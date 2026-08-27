import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Radio, QrCode, ArrowLeft } from "lucide-react-native";
import { theme } from "../lib/theme";
import { componentStyles as styles } from "../lib/styles";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  onAction?: () => void;
  actionIcon?: typeof QrCode;
}

export function ScreenHeader({
  title,
  onBack,
  onAction,
  actionIcon: ActionIcon = QrCode,
}: ScreenHeaderProps) {
  if (onBack) {
    return (
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.navHeaderTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <Text style={styles.brandTitle}>{title}</Text>
      </View>
      {onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={styles.pairIconBtn}
          activeOpacity={0.8}
        >
          <ActionIcon size={18} color={theme.colors.ink} />
        </TouchableOpacity>
      )}
    </View>
  );
}
