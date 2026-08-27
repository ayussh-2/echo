import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { componentStyles as styles } from "../lib/styles";

interface PermissionWarningBannerProps {
  onOpenSettings: () => void;
}

export function PermissionWarningBanner({ onOpenSettings }: PermissionWarningBannerProps) {
  return (
    <View style={styles.warningCard}>
      <View style={styles.warningIconWrap}>
        <AlertTriangle size={20} color="#ea580c" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.warningTitle}>Notification Access Required</Text>
        <Text style={styles.warningDesc}>
          Android requires special permission to let Echo intercept notifications.
        </Text>
        <TouchableOpacity onPress={onOpenSettings} style={styles.permissionLink} activeOpacity={0.7}>
          <Text style={styles.permissionLinkText}>Enable in Settings &gt;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
