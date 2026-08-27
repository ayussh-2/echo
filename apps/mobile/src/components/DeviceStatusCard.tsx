import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Monitor, Smartphone, LogOut, QrCode } from "lucide-react-native";
import { theme } from "../lib/theme";
import { componentStyles as styles } from "../lib/styles";
import type { MobilePairedSession } from "../lib/storage";

interface DeviceStatusCardProps {
  session: MobilePairedSession | null;
  forwardingEnabled: boolean;
  onToggleForwarding: (val: boolean) => void;
  onUnpair: () => void;
  onScanQR: () => void;
}

export function DeviceStatusCard({
  session,
  forwardingEnabled,
  onToggleForwarding,
  onUnpair,
  onScanQR,
}: DeviceStatusCardProps) {
  if (!session) {
    return (
      <View style={[styles.card, styles.unpairedCard]}>
        <View style={styles.unpairedIconWrap}>
          <Smartphone size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.unpairedTitle}>No PC Connected</Text>
        <Text style={styles.unpairedSub}>
          Scan the QR code displayed on your Echo Desktop application to start syncing.
        </Text>
        <TouchableOpacity style={styles.pairPrimaryBtn} onPress={onScanQR} activeOpacity={0.85}>
          <QrCode size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.pairPrimaryBtnText}>Scan Desktop QR Code</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.statusPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusPillText}>CONNECTED</Text>
        </View>
        <TouchableOpacity onPress={onUnpair} style={styles.unpairBtn} activeOpacity={0.7}>
          <LogOut size={13} color={theme.colors.danger} />
          <Text style={styles.unpairText}>Unpair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deviceRow}>
        <View style={styles.deviceIconWrap}>
          <Monitor size={24} color={theme.colors.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.deviceName}>{session.desktopName || "Echo for Windows"}</Text>
          <Text style={styles.deviceMeta}>
            Paired {new Date(session.pairedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleTitle}>Forward Notifications</Text>
          <Text style={styles.toggleDesc}>Mirror incoming messages to your PC</Text>
        </View>
        <Switch
          value={forwardingEnabled}
          onValueChange={onToggleForwarding}
          thumbColor="#ffffff"
          trackColor={{ false: "#e4e4e7", true: theme.colors.primary }}
        />
      </View>
    </View>
  );
}
