import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useVehicleJourney } from "@/src/hooks/useVehicleJourney";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import type { Vehicle360Target } from "@/src/contexts/YardVehicle360Context";

type Props = {
  visible: boolean;
  target: Vehicle360Target | null;
  onClose: () => void;
};

export default function Vehicle360Sheet({ visible, target, onClose }: Props) {
  const router = useRouter();
  const { can, isYardAdmin, user } = useYardAuth();
  const { data, isLoading, error, refetch, isRefetching } = useVehicleJourney(target?.vehicleId, visible);

  const badge = statusColor(data?.status || "pending");
  const canGate = canAccessYardScreen("gate", can, isYardAdmin, user?.role);
  const canQueue = canAccessYardScreen("queue", can, isYardAdmin, user?.role);
  const canDocks = canAccessYardScreen("docks", can, isYardAdmin, user?.role);

  const navigateWithLookup = (href: "/(yard)/gate" | "/(yard)/queue" | "/(yard)/docks") => {
    const q = data?.plate || target?.query || "";
    onClose();
    router.push({ pathname: href, params: q && q !== "—" ? { q } : {} });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.overline}>VEHICLE 360</Text>
              <Text style={styles.title}>{data?.plate || target?.query || "Vehicle"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="vehicle-360-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {isLoading ? (
              <ActivityIndicator color={colors.shipgenOrange} style={{ marginVertical: spacing.xl }} />
            ) : error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Unable to load vehicle</Text>
                <Text style={styles.errorBody}>{error instanceof Error ? error.message : "Try again."}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => void refetch()}>
                  <Text style={styles.retryText}>{isRefetching ? "Retrying…" : "Retry"}</Text>
                </TouchableOpacity>
              </View>
            ) : data ? (
              <>
                <View style={styles.metaCard}>
                  <View style={styles.metaTop}>
                    <Text style={styles.stage}>{data.currentStage}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>{data.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.metaLine}>{data.transporter}</Text>
                  <Text style={styles.metaLine}>
                    {data.driver}
                    {data.driverPhone ? ` · ${data.driverPhone}` : ""}
                  </Text>
                  {data.zone ? <Text style={styles.metaLine}>Zone · {data.zone}</Text> : null}
                  {data.dockCode ? <Text style={styles.metaLine}>Dock · {data.dockCode}</Text> : null}
                  {data.appointmentRef ? <Text style={styles.metaLine}>Booking · {data.appointmentRef}</Text> : null}
                  {data.queueNumber ? (
                    <Text style={styles.metaLine}>
                      Queue {data.queueNumber}
                      {data.queueStatus ? ` · ${data.queueStatus}` : ""}
                    </Text>
                  ) : null}
                  {data.material ? <Text style={styles.metaLine}>Material · {data.material}</Text> : null}
                </View>

                <View style={styles.navRow}>
                  {canGate ? (
                    <NavChip
                      label="Gate"
                      icon="shield-checkmark-outline"
                      onPress={() => navigateWithLookup("/(yard)/gate")}
                      testID="vehicle-360-nav-gate"
                    />
                  ) : null}
                  {canQueue ? (
                    <NavChip
                      label="Queue"
                      icon="list-outline"
                      onPress={() => navigateWithLookup("/(yard)/queue")}
                      testID="vehicle-360-nav-queue"
                    />
                  ) : null}
                  {canDocks ? (
                    <NavChip
                      label="Docks"
                      icon="git-branch-outline"
                      onPress={() => navigateWithLookup("/(yard)/docks")}
                      testID="vehicle-360-nav-docks"
                    />
                  ) : null}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Journey</Text>
                  {data.journeySteps.map((step) => (
                    <View key={step.key} style={styles.stepRow}>
                      <View
                        style={[
                          styles.stepDot,
                          step.current
                            ? { backgroundColor: colors.shipgenOrange }
                            : step.done
                              ? { backgroundColor: colors.success }
                              : { backgroundColor: colors.border },
                        ]}
                      />
                      <Text
                        style={[
                          styles.stepLabel,
                          step.current && { color: colors.text, fontWeight: "800" },
                          step.done && !step.current && { color: colors.textSecondary },
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {data.events.length ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent events</Text>
                    {data.events.map((event) => (
                      <View key={event.id} style={styles.eventRow}>
                        <Text style={styles.eventTime}>{event.time}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.eventType}>{event.type}</Text>
                          {event.note ? <Text style={styles.eventNote}>{event.note}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function NavChip({
  label,
  icon,
  onPress,
  testID,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity style={styles.navChip} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={16} color={colors.shipgenOrange} />
      <Text style={styles.navChipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10,10,10,0.45)" },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 24, fontWeight: "900", color: colors.text, marginTop: 4 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  metaTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  stage: { fontSize: 14, fontWeight: "800", color: colors.shipgenOrange, flex: 1, marginRight: spacing.sm },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  metaLine: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  navRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  navChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  navChipText: { fontSize: 12, fontWeight: "800", color: colors.text },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  stepRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLabel: { fontSize: 13, color: colors.textMuted },
  eventRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventTime: { width: 52, fontSize: 11, fontWeight: "700", color: colors.textMuted },
  eventType: { fontSize: 13, fontWeight: "700", color: colors.text },
  eventNote: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
  },
  errorTitle: { fontSize: 14, fontWeight: "800", color: colors.error },
  errorBody: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  retryBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    backgroundColor: colors.error,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  retryText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
