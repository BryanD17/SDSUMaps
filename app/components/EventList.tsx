import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { getLocationById } from "../constants/locations";
import { colors, radius, spacing, typography } from "../constants/theme";
import { sortEventsByStartTime } from "../utils/eventFilter";

export type Event = {
  id: string;
  title: string;
  /** `LocationId` key from `app/constants/locations.ts` (see DATA_SCHEMA.md).
   *  Translated to the human-readable name for display via getLocationById. */
  location: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  clubName?: string;
};

type Props = {
  events: Event[];
  loading?: boolean;
  /** Hide the per-card location row when the parent already shows a
   *  single-location header (e.g. inside the per-pin modal). */
  hideLocation?: boolean;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const EventCard = ({ item, hideLocation }: { item: Event; hideLocation?: boolean }) => {
  // Translate stored LocationId back to a human-readable name. Falls back
  // to the raw value so live data with an unknown id still renders.
  const locationName = getLocationById(item.location)?.name ?? item.location;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      {!hideLocation && <Text style={styles.location}>{locationName}</Text>}
      <Text style={styles.time}>
        {formatTime(item.startTime)} – {formatTime(item.endTime)}
      </Text>
      {!!item.clubName && <Text style={styles.clubName}>{item.clubName}</Text>}
      {!!item.description && (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      )}
    </View>
  );
};

export default function EventList({ events, loading = false, hideLocation = false }: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.scarlet} />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No events right now.</Text>
      </View>
    );
  }

  const sorted = sortEventsByStartTime(events);

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EventCard item={item} hideLocation={hideLocation} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      // Prevent the inner FlatList from grabbing parent scroll on web/portrait.
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral100,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.neutral900,
  },
  location: {
    ...typography.caption,
    color: colors.neutral600,
    marginTop: 2,
  },
  time: {
    ...typography.caption,
    color: colors.neutral700,
    marginTop: 2,
  },
  clubName: {
    ...typography.caption,
    color: colors.neutral600,
    marginTop: 2,
  },
  description: {
    ...typography.body,
    color: colors.neutral700,
    marginTop: 2,
  },
  separator: {
    height: spacing.sm,
  },
  center: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  empty: {
    ...typography.caption,
    color: colors.neutral500,
  },
});
