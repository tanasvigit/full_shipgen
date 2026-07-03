import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "../theme";

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
};

export default function ScreenHeader({ title, subtitle, back, rightIcon, onRightPress }: Props) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {back ? (
          <TouchableOpacity
            testID="header-back-btn"
            onPress={() => router.back()}
            style={[styles.iconBtn, styles.iconBtnFilled]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightIcon && onRightPress ? (
          <TouchableOpacity
            testID="header-right-btn"
            onPress={onRightPress}
            style={[styles.iconBtn, styles.iconBtnFilled]}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={20} color={colors.brand} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  iconBtnFilled: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleWrap: { flex: 1, alignItems: "center", paddingHorizontal: spacing.sm },
  title: { fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: "600" },
});
