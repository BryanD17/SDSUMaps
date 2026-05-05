// Main screen of the app. Renders the SDSU campus map image with interactive
// map markers (pins) overlaid on top. Tapping a pin opens a modal popup with
// event details. Also renders the AboutScreen banner at the bottom.
import { useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AboutScreen from "./aboutScreen";
import AddEventModal from "./components/AddEventModal";
import { LOCATIONS, LOCATION_LIST, type LocationId } from "./constants/locations";
import { colors, radius, spacing, tap, typography } from "./constants/theme";
import ImageC from "./image";
import { SideMenu } from './sideMenu';

export default function Index() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const topBarHeight = 56;
  const bottomBarHeight = 50;
  const mapWidth = width;
  // Subtract notch/home-indicator insets so the ScrollView doesn't get clipped
  // under iPhone's status bar or home indicator in portrait.
  const mapHeight = Math.max(height - topBarHeight - bottomBarHeight - insets.top - insets.bottom, 0);

  // Single modal drives the details popup for whichever pin was last tapped.
  // `selectedPinId` is the join key into LOCATIONS (and, eventually, into
  // Firestore's per-location event query — see B4).
  const [selectedPinId, setSelectedPinId] = useState<LocationId | null>(null);
  const modalVis = selectedPinId !== null;
  const selectedLocation = selectedPinId ? LOCATIONS[selectedPinId] : null;
  const closeModal = () => setSelectedPinId(null);

  const [addEventVis, setAddEventVis] = useState(false);

  // Pin marker visual size as fraction of map dims. Kept here (not in
  // LOCATIONS) because it's a presentation concern shared by every pin —
  // not a per-location attribute.
  const PIN_W = 0.045;
  const PIN_H = 0.075;

  return (
    // SafeAreaView keeps top bar below the iPhone notch/status bar and the
    // floating Add Event button above the home indicator, on iOS portrait.
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

      {/* SDSU campus map with pins anchored inside one responsive wrapper.
          minimumZoomScale=1 prevents users from pinch-zooming below the
          container size, which on iOS portrait used to leave the map
          shrunken with white space around it. */}
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
        {/* TASK C1: campus map is now bundled locally instead of fetched from
            an external URL (faster load, works offline, and lets us swap in
            a higher-res official SDSU map by replacing this single asset).
            TODO(bryan): replace sdsu_campus_map.jpg with a higher-resolution
            export from https://map.sdsu.edu before final submission. */}
        <ImageC
          source={require("../assets/images/sdsu_campus_map.jpg")}
          style={{
            width: "100%",
            height: "100%",
          }}
          contentFit="contain"
        />

        {/* Render every campus pin from the shared LOCATIONS map (D2/D3).
            One source of truth means pin labels and Firestore `event.location`
            join keys can never drift. Tapping any pin sets selectedPinId,
            which opens the details modal below. */}
        {LOCATION_LIST.map((loc) => (
          <Pressable
            key={loc.id}
            onPress={() => setSelectedPinId(loc.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open details for ${loc.name}`}
            // Center the marker on (x, y) by offsetting half its rendered size.
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

        {/* Modal popup shown when a marker is tapped, displays event info.
            Backdrop tap and Android hardware back both dismiss. */}
        <Modal
          visible={modalVis}
          animationType="fade"
          transparent={true}
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
              // Inner pressable swallows taps so backdrop dismiss only fires
              // outside the card body.
              onPress={(e) => e.stopPropagation?.()}
              style={{
                minWidth: Math.min(width * 0.7, 320),
                maxWidth: 360,
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.lg,
              }}
            >
              {/* Close X — visible affordance, ≥44pt hit area, top-right. */}
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
                  <Text style={{ ...typography.h3, color: colors.neutral900, marginBottom: spacing.xs, marginRight: tap.minSize }}>
                    {selectedLocation.name}
                  </Text>
                  {selectedLocation.notes && (
                    <Text style={{ ...typography.caption, color: colors.neutral500, marginBottom: spacing.sm }}>
                      {selectedLocation.notes}
                    </Text>
                  )}
                  {/* TODO(B4 — Talan): replace with EventList filtered by
                      `event.location === selectedLocation.id`. Until the
                      Firestore-backed list lands, show a placeholder so the
                      modal still feels alive. */}
                  <Text style={{ ...typography.body, color: colors.neutral700 }}>
                    No live events yet — check back soon.
                  </Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
      </ScrollView>

      <AddEventModal visible={addEventVis} onClose={() => setAddEventVis(false)} />

      {/* Floating "Add Event" button. bottom offset clears the AboutScreen
          banner; minHeight=tap.minSize keeps the hit target ≥44pt. */}
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

      {/* Side menu (just seperated for ease of access, cleaner imo) */}
      <SideMenu />

      </View>
    </SafeAreaView>
  );
}
