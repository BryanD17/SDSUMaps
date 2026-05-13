// Polished Add Event modal: labeled fields, inline validation, double-submit
// guard, unmount-safe async, success/failure feedback. Posts to Firestore
// via app/services/eventService.ts (A3). Date inputs use the native
// datetime picker on iOS/Android and an HTML datetime-local control on web
// (A5).
import { createElement, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { LOCATION_LIST, type LocationId } from "../constants/locations";
import { addEvent } from "../services/eventService";
import { colors, radius, spacing, tap, typography } from "../constants/theme";
import { firebaseReady } from "../utils/firebase";

// @react-native-community/datetimepicker has no web implementation. Loading
// it via require behind a Platform check keeps the web bundle clean.
const DateTimePicker =
  Platform.OS !== "web"
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ? require("@react-native-community/datetimepicker").default
    : null;

type EventFormState = {
  title: string;
  description: string;
  location: LocationId | null;
  clubName: string;
  startTime: Date | null;
  endTime: Date | null;
};

type FieldErrors = Partial<Record<keyof EventFormState, string>>;

const EMPTY_FORM: EventFormState = {
  title: "",
  description: "",
  location: null,
  clubName: "",
  startTime: null,
  endTime: null,
};

// Format a Date for an HTML <input type="datetime-local"> (local TZ, minute
// precision — the input's native granularity).
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function validate(form: EventFormState): FieldErrors {
  const errors: FieldErrors = {};
  const title = form.title.trim();
  if (!title) errors.title = "Required";
  else if (title.length > 80) errors.title = "Max 80 characters";

  const description = form.description.trim();
  if (!description) errors.description = "Required";
  else if (description.length > 500) errors.description = "Max 500 characters";

  if (!form.location) errors.location = "Required";

  const club = form.clubName.trim();
  if (!club) errors.clubName = "Required";
  else if (club.length > 60) errors.clubName = "Max 60 characters";

  if (!form.startTime) errors.startTime = "Required";
  else if (form.startTime.getTime() < Date.now()) errors.startTime = "Must be in the future";

  if (!form.endTime) errors.endTime = "Required";
  else if (form.startTime && form.endTime.getTime() <= form.startTime.getTime()) {
    errors.endTime = "Must be after start";
  }

  return errors;
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AddEventModal({ visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Avoid setState after unmount when the user dismisses mid-submit.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function update<K extends keyof EventFormState>(key: K, value: EventFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear that field's error as soon as the user types again.
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function reset() {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitAttempted(false);
    setSubmitResult(null);
  }

  function handleCancel() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitAttempted(true);
    setSubmitResult(null);
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      // validate() above already proved location and both Dates are non-null.
      await addEvent({
        title: form.title,
        description: form.description,
        location: form.location!,
        clubName: form.clubName,
        startTime: form.startTime!,
        endTime: form.endTime!,
      });
      if (!mountedRef.current) return;
      setSubmitResult({ type: "success", msg: "Event added! Your event has been posted." });
      // Brief delay so the user sees the success message before the modal closes.
      setTimeout(() => {
        if (!mountedRef.current) return;
        reset();
        onClose();
      }, 1200);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setSubmitResult({ type: "error", msg });
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }

  // Borders go red only after an attempted submit, so users aren't yelled
  // at while still filling in the form.
  function showError(key: keyof EventFormState): boolean {
    return submitAttempted && !!errors[key];
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
      supportedOrientations={[
        "portrait",
        "portrait-upside-down",
        "landscape",
        "landscape-left",
        "landscape-right",
      ]}
    >
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", padding: spacing.lg }}>
        <View
          style={{
            width: "100%",
            maxWidth: 480,
            maxHeight: isLandscape ? height * 0.9 : height * 0.85,
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
            <Text style={{ ...typography.h2, color: colors.neutral900 }}>Add Event</Text>
            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={submitting}
              style={{
                width: tap.minSize,
                height: tap.minSize,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.pill,
                opacity: submitting ? 0.4 : 1,
              }}
            >
              <Text style={{ ...typography.h2, color: colors.neutral600 }}>×</Text>
            </Pressable>
          </View>

          {!firebaseReady && (
            <View style={{
              backgroundColor: "#FFF3CD",
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: "#FFECB5",
            }}>
              <Text style={{ ...typography.caption, color: "#664D03" }}>
                Firebase is not configured. Events cannot be saved. Copy .env.example to .env and add your Firebase keys.
              </Text>
            </View>
          )}

          {submitResult && (
            <View style={{
              backgroundColor: submitResult.type === "success" ? "#D1E7DD" : "#F8D7DA",
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: submitResult.type === "success" ? "#BADBCC" : "#F5C2C7",
            }}>
              <Text style={{
                ...typography.caption,
                color: submitResult.type === "success" ? "#0F5132" : "#842029",
              }}>
                {submitResult.msg}
              </Text>
            </View>
          )}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ marginBottom: spacing.md }}
            contentContainerStyle={{ paddingBottom: spacing.sm }}
          >
            <Field
              label="Title"
              value={form.title}
              onChange={(v) => update("title", v)}
              placeholder="e.g. Aztec Baseball Club practice"
              error={showError("title") ? errors.title : undefined}
              maxLength={80}
            />
            <Field
              label="Description"
              value={form.description}
              onChange={(v) => update("description", v)}
              placeholder="What's happening?"
              error={showError("description") ? errors.description : undefined}
              maxLength={500}
              multiline
            />
            <LocationPicker
              value={form.location}
              onChange={(v) => update("location", v)}
              error={showError("location") ? errors.location : undefined}
            />
            <Field
              label="Club name"
              value={form.clubName}
              onChange={(v) => update("clubName", v)}
              placeholder="e.g. Baseball Club"
              error={showError("clubName") ? errors.clubName : undefined}
              maxLength={60}
            />
            <DateField
              label="Starts"
              value={form.startTime}
              onChange={(d) => update("startTime", d)}
              error={showError("startTime") ? errors.startTime : undefined}
            />
            <DateField
              label="Ends"
              value={form.endTime}
              onChange={(d) => update("endTime", d)}
              error={showError("endTime") ? errors.endTime : undefined}
            />
          </ScrollView>

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Pressable
              onPress={handleCancel}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Cancel and close"
              style={({ pressed }) => ({
                flex: 1,
                minHeight: tap.minSize,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.neutral300,
                backgroundColor: pressed ? colors.neutral100 : colors.white,
                alignItems: "center",
                justifyContent: "center",
                opacity: submitting ? 0.5 : 1,
              })}
            >
              <Text style={{ ...typography.button, color: colors.neutral700 }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !firebaseReady}
              accessibilityRole="button"
              accessibilityLabel="Submit new event"
              accessibilityState={{ busy: submitting, disabled: submitting || !firebaseReady }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: tap.minSize,
                borderRadius: radius.md,
                backgroundColor: !firebaseReady
                  ? colors.neutral300
                  : submitting
                    ? colors.scarletDark
                    : pressed
                      ? colors.scarletDark
                      : colors.scarlet,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: spacing.sm,
                opacity: !firebaseReady ? 0.6 : 1,
              })}
            >
              {submitting && <ActivityIndicator color={colors.scarletInk} />}
              <Text style={{ ...typography.button, color: !firebaseReady ? colors.neutral600 : colors.scarletInk }}>
                {submitting ? "Adding…" : "Add Event"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

function Field({ label, value, onChange, placeholder, hint, error, multiline, maxLength, autoCapitalize }: FieldProps) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.caption, color: colors.neutral700, marginBottom: spacing.xs }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral500}
        accessibilityLabel={label}
        multiline={!!multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={{
          ...typography.body,
          color: colors.neutral900,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.neutral300,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: multiline ? spacing.md : spacing.sm,
          minHeight: multiline ? 88 : tap.minSize,
          textAlignVertical: multiline ? "top" : "center",
          backgroundColor: colors.white,
        }}
      />
      {!!hint && !error && (
        <Text style={{ ...typography.caption, color: colors.neutral500, marginTop: spacing.xs }}>{hint}</Text>
      )}
      {!!error && (
        <Text style={{ ...typography.caption, color: colors.danger, marginTop: spacing.xs }}>{error}</Text>
      )}
    </View>
  );
}

type DateFieldProps = {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  error?: string;
};

function DateField({ label, value, onChange, error }: DateFieldProps) {
  // Track whether the native picker is currently open. On Android the picker
  // is a one-shot dialog opened on demand; on iOS we render it inline.
  const [showAndroid, setShowAndroid] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.caption, color: colors.neutral700, marginBottom: spacing.xs }}>
        {label}
      </Text>

      {Platform.OS === "web"
        ? createElement("input", {
            type: "datetime-local",
            value: value ? toLocalInputValue(value) : "",
            onChange: (e: { target: { value: string } }) => {
              const v = e.target.value;
              if (v) onChange(new Date(v));
            },
            "aria-label": label,
            style: {
              ...typography.body,
              color: colors.neutral900,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: error ? colors.danger : colors.neutral300,
              borderRadius: radius.md,
              paddingLeft: spacing.md,
              paddingRight: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm,
              minHeight: tap.minSize,
              backgroundColor: colors.white,
              fontFamily: "inherit",
              fontSize: 16,
            },
          })
        : Platform.OS === "ios" ? (
          <DateTimePicker
            mode="datetime"
            value={value ?? new Date()}
            onChange={(_: unknown, d?: Date) => {
              if (d) onChange(d);
            }}
            accessibilityLabel={label}
          />
        ) : (
          <View>
            <Pressable
              onPress={() => setShowAndroid(true)}
              accessibilityRole="button"
              accessibilityLabel={`${label}: open date picker`}
              style={{
                minHeight: tap.minSize,
                borderWidth: 1,
                borderColor: error ? colors.danger : colors.neutral300,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                justifyContent: "center",
                backgroundColor: colors.white,
              }}
            >
              <Text style={{ ...typography.body, color: value ? colors.neutral900 : colors.neutral500 }}>
                {value ? toLocalInputValue(value).replace("T", " ") : "Tap to pick date and time"}
              </Text>
            </Pressable>
            {showAndroid && (
              <DateTimePicker
                mode="datetime"
                value={value ?? new Date()}
                onChange={(_: unknown, d?: Date) => {
                  setShowAndroid(false);
                  if (d) onChange(d);
                }}
              />
            )}
          </View>
        )}

      {!!error && (
        <Text style={{ ...typography.caption, color: colors.danger, marginTop: spacing.xs }}>{error}</Text>
      )}
    </View>
  );
}

type LocationPickerProps = {
  value: LocationId | null;
  onChange: (v: LocationId) => void;
  error?: string;
};

function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedName = value
    ? LOCATION_LIST.find((l) => l.id === value)?.name ?? value
    : null;

  if (Platform.OS === "web") {
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ ...typography.caption, color: colors.neutral700, marginBottom: spacing.xs }}>
          Location
        </Text>
        {createElement("select", {
          value: value ?? "",
          onChange: (e: { target: { value: string } }) => {
            if (e.target.value) onChange(e.target.value as LocationId);
          },
          "aria-label": "Location",
          style: {
            ...typography.body,
            color: value ? colors.neutral900 : colors.neutral500,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: error ? colors.danger : colors.neutral300,
            borderRadius: radius.md,
            paddingLeft: spacing.md,
            paddingRight: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            minHeight: tap.minSize,
            backgroundColor: colors.white,
            fontFamily: "inherit",
            fontSize: 16,
          },
        },
          createElement("option", { value: "", disabled: true }, "Select a location"),
          ...LOCATION_LIST.map((loc) =>
            createElement("option", { key: loc.id, value: loc.id }, loc.name),
          ),
        )}
        {!!error && (
          <Text style={{ ...typography.caption, color: colors.danger, marginTop: spacing.xs }}>{error}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.caption, color: colors.neutral700, marginBottom: spacing.xs }}>
        Location
      </Text>
      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Location: open picker"
        style={{
          minHeight: tap.minSize,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.neutral300,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          justifyContent: "center",
          backgroundColor: colors.white,
        }}
      >
        <Text style={{ ...typography.body, color: selectedName ? colors.neutral900 : colors.neutral500 }}>
          {selectedName ?? "Select a location"}
        </Text>
      </Pressable>
      {!!error && (
        <Text style={{ ...typography.caption, color: colors.danger, marginTop: spacing.xs }}>{error}</Text>
      )}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            maxHeight: "60%",
            paddingTop: spacing.md,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
              <Text style={{ ...typography.h3, color: colors.neutral900 }}>Select Location</Text>
              <Pressable
                onPress={() => setPickerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close location picker"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ ...typography.h3, color: colors.neutral600 }}>×</Text>
              </Pressable>
            </View>
            <FlatList
              data={LOCATION_LIST}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    setPickerOpen(false);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    backgroundColor: item.id === value
                      ? colors.neutral100
                      : pressed
                        ? colors.neutral100
                        : colors.white,
                  })}
                >
                  <Text style={{
                    ...typography.body,
                    color: item.id === value ? colors.scarlet : colors.neutral900,
                  }}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: colors.neutral200, marginHorizontal: spacing.lg }} />
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
