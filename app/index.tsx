// Main screen of the app. Renders the SDSU campus map image with interactive
// map markers (pins) overlaid on top. Tapping a pin opens a modal showing
// the top 3 active events for that pin's location, with a "See All" button
// that hands off to the side menu.
//
// Data flow: subscribeToActiveEvents (onSnapshot) is the source of truth.
// If the snapshot is empty or errors, MOCK_EVENTS is the fallback so the
// demo doesn't show a blank state.
import { useEffect, useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AboutScreen from "./aboutScreen";
import AddEventModal from "./components/AddEventModal";
import EventList, { type Event } from "./components/EventList";
import { LOCATIONS, LOCATION_LIST, type LocationId } from "./constants/locations";
import { colors, radius, spacing, tap, typography } from "./constants/theme";
import ImageC from "./image";
import { subscribeToActiveEvents, type ActiveEvent } from "./services/eventService";
import { firebaseReady } from "./utils/firebase";
import { SideMenu } from "./sideMenu";
import { filterEventsByLocation, topNEventsByStartTime } from "./utils/eventFilter";
import { MOCK_EVENTS } from "./utils/mockEvents";

const PIN_MODAL_TOP_N = 3;

export default function Index() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const topBarHeight = 56;
  const bottomBarHeight = 50;
  const mapWidth = width;
  const mapHeight = Math.max(height - topBarHeight - bottomBarHeight - insets.top - insets.bottom, 0);

  const [selectedPinId, setSelectedPinId] = useState<LocationId | null>(null);
  const modalVis = selectedPinId !== null;
  const selectedLocation = selectedPinId ? LOCATIONS[selectedPinId] : null;
  const closeModal = () => setSelectedPinId(null);

  const [addEventVis, setAddEventVis] = useState(false);
  const [sideMenuVis, setSideMenuVis] = useState(false);

  // Live events from Firestore via onSnapshot, with graceful fallback to mocks.
  // ActiveEvent is a strict superset of Event (extra fields), so it's
  // structurally assignable to Event[] for downstream consumers.
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [eventsLoading, setEventsLoading] = useState(true);
  useEffect(() => {
    if (!firebaseReady) {
      setEvents(MOCK_EVENTS);
      setEventsLoading(false);
      return;
    }
    const unsubscribe = subscribeToActiveEvents(
      (live: ActiveEvent[]) => {
        setEvents(live.length > 0 ? live : MOCK_EVENTS);
        setEventsLoading(false);
      },
      (err) => {
        console.warn("subscribeToActiveEvents error, falling back to MOCK_EVENTS:", err);
        setEvents(MOCK_EVENTS);
        setEventsLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  // B4: top-N events for the currently-tapped pin. Filtered by LocationId
  // so it works against both mock data (which now uses LocationId values)
  // and live Firestore data (schema-mandated to use LocationId).
  const pinEvents = selectedLocation
    ? topNEventsByStartTime(filterEventsByLocation(events, selectedLocation.id), PIN_MODAL_TOP_N)
    : [];

  const handleSeeAll = () => {
    setSelectedPinId(null);
    setSideMenuVis(true);
  };

  // Pin marker visual size as fraction of map dims.
  const PIN_W = 0.045;
  const PIN_H = 0.075;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, flexDirection: "column" }}>
      <View
        style={{
          height: topBarHeight,
          width: "100%",
          backgroundColor: colors.white,
          justifyContent: "center",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral300,
        }}
      >
        <Text style={{ ...typography.h2, color: colors.scarlet }}>SDSU Maps</Text>
      </View>

      {/* Side menu trigger lives here (not inside SideMenu) because the
          panel is now a controlled component opened by both this button
          and the per-pin "See All" handoff. */}
      <Pressable
        onPress={() => setSideMenuVis(true)}
        accessibilityRole="button"
        accessibilityLabel="Open events list"
        style={({ pressed }) => ({
          position: "absolute",
          top: insets.top + spacing.md,
          left: spacing.md,
          minHeight: tap.minSize,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: pressed ? colors.scarletDark : colors.scarlet,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          shadowColor: colors.black,
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        })}
      >
        <Text style={{ ...typography.button, color: colors.scarletInk }}>Events</Text>
      </Pressable>

      <ScrollView
        style={{ width: mapWidth, height: mapHeight }}
        contentContainerStyle={{ width: mapWidth, height: mapHeight }}
        minimumZoomScale={1}
        maximumZoomScale={isIOS ? 3 : 1}
        bouncesZoom={isIOS}
        centerContent
        pinchGestureEnabled={isIOS}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
      <View style={{ width: mapWidth, height: mapHeight, position: "relative" }}>
        <ImageC
          source={require("../assets/images/sdsu_campus_map.jpg")}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />

        {/* All campus pins from the shared LOCATIONS map (D2/D3). */}
        {LOCATION_LIST.map((loc) => (
          <Pressable
            key={loc.id}
            onPress={() => setSelectedPinId(loc.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open details for ${loc.name}`}
            style={{
              position: "absolute",
              top: mapHeight * loc.y - (mapHeight * PIN_H) / 2,
              left: mapWidth * loc.x - (mapWidth * PIN_W) / 2,
              width: mapWidth * PIN_W,
              height: mapHeight * PIN_H,
              zIndex: 999,
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Image
              source={require("../assets/images/marker.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </Pressable>
        ))}

        {/* Per-pin events modal (B4). Filters live events by LocationId,
            shows the top 3, and offers "See All" → side menu. */}
        <Modal
          visible={modalVis}
          animationType="fade"
          transparent
          onRequestClose={closeModal}
          supportedOrientations={[
            "portrait",
            "portrait-upside-down",
            "landscape",
            "landscape-left",
            "landscape-right",
          ]}
        >
          <Pressable
            onPress={closeModal}
            style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.overlay }}
            accessibilityLabel="Close event details"
          >
            <Pressable
              onPress={(e) => e.stopPropagation?.()}
              style={{
                minWidth: Math.min(width * 0.7, 320),
                maxWidth: 380,
                width: "85%",
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.lg,
              }}
            >
              <Pressable
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  position: "absolute",
                  top: spacing.sm,
                  right: spacing.sm,
                  width: tap.minSize,
                  height: tap.minSize,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                <Text style={{ ...typography.h3, color: colors.neutral600 }}>×</Text>
              </Pressable>

              {selectedLocation && (
                <>
                  <Text
                    style={{
                      ...typography.h3,
                      color: colors.neutral900,
                      marginBottom: spacing.xs,
                      marginRight: tap.minSize,
                    }}
                  >
                    {selectedLocation.name}
                  </Text>
                  {selectedLocation.notes && (
                    <Text style={{ ...typography.caption, color: colors.neutral500, marginBottom: spacing.sm }}>
                      {selectedLocation.notes}
                    </Text>
                  )}

                  <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
                    <EventList events={pinEvents} loading={eventsLoading} hideLocation />
                  </View>

                  <Pressable
                    onPress={handleSeeAll}
                    accessibilityRole="button"
                    accessibilityLabel="See all events"
                    style={({ pressed }) => ({
                      minHeight: tap.minSize,
                      borderRadius: radius.md,
                      backgroundColor: pressed ? colors.scarletDark : colors.scarlet,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: spacing.md,
                    })}
                  >
                    <Text style={{ ...typography.button, color: colors.scarletInk }}>See all events</Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
      </ScrollView>

      <AddEventModal visible={addEventVis} onClose={() => setAddEventVis(false)} />

      <Pressable
        onPress={() => setAddEventVis(true)}
        accessibilityRole="button"
        accessibilityLabel="Add a new campus event"
        style={({ pressed }) => ({
          position: "absolute",
          bottom: bottomBarHeight + spacing.md,
          right: spacing.lg,
          zIndex: 1000,
          minHeight: tap.minSize,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: pressed ? colors.scarletDark : colors.scarlet,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.black,
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        })}
      >
        <Text style={{ ...typography.button, color: colors.scarletInk }}>+ Add Event</Text>
      </Pressable>

      <View style={{ height: bottomBarHeight, width: "100%" }}>
        <AboutScreen />
      </View>

      <SideMenu
        visible={sideMenuVis}
        onClose={() => setSideMenuVis(false)}
        events={events}
        loading={eventsLoading}
      />

      </View>
    </SafeAreaView>
  );
}
