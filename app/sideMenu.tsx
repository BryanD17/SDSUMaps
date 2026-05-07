// Side menu / events list panel. Controlled — visibility and event data
// are owned by the parent (app/index.tsx) so the per-pin "See All" handoff
// can open this panel pre-populated.
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import EventList, { type Event } from "./components/EventList";
import { colors, radius, spacing, tap, typography } from "./constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  events: Event[];
  loading?: boolean;
};

export const SideMenu = function ({ visible, onClose, events, loading = false }: Props) {
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(Math.max(width * 0.78, 260), 360);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close events list"
        style={{ flex: 1, backgroundColor: colors.overlay, flexDirection: "row" }}
      >
        <Pressable
          // Inner pressable swallows taps so the panel itself doesn't dismiss.
          onPress={(e) => e.stopPropagation?.()}
          style={{
            width: panelWidth,
            height: "100%",
            backgroundColor: colors.white,
            paddingTop: spacing.xl,
            paddingHorizontal: spacing.lg,
            shadowColor: colors.black,
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 2, height: 0 },
            elevation: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing.lg,
            }}
          >
            <Text style={{ ...typography.h2, color: colors.neutral900 }}>Events</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close events list"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: tap.minSize,
                height: tap.minSize,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.pill,
              }}
            >
              <Text style={{ ...typography.h2, color: colors.neutral600 }}>×</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1, marginBottom: spacing.lg }}>
            <EventList events={events} loading={loading} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
