import { Image, View, Text, StyleSheet, type ImageStyle, type StyleProp } from "react-native";
import { colors } from "@/src/theme";

type EntityImageProps = {
  uri?: string | null;
  label?: string;
  style: StyleProp<ImageStyle>;
  rounded?: boolean;
};

export default function EntityImage({ uri, label = "?", style, rounded = true }: EntityImageProps) {
  if (uri) {
    return <Image source={{ uri }} style={style} />;
  }

  const flat = StyleSheet.flatten(style);
  const initials = label
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        flat,
        rounded ? styles.rounded : null,
        styles.fallback,
      ]}
    >
      <Text style={styles.initials}>{initials || "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rounded: { borderRadius: 999 },
  fallback: {
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: { fontSize: 12, fontWeight: "800", color: colors.textSecondary },
});
