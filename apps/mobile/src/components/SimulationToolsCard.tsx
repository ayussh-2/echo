import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MessageSquare, Mail } from "lucide-react-native";
import { componentStyles as styles } from "../lib/styles";

interface SimulationToolsCardProps {
  isSimulating: boolean;
  onSendWhatsApp: () => void;
  onSendSMS: () => void;
}

export function SimulationToolsCard({
  isSimulating,
  onSendWhatsApp,
  onSendSMS,
}: SimulationToolsCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>TEST & DIAGNOSTICS</Text>
      <View style={styles.card}>
        <Text style={styles.cardDesc}>
          Send a simulated notification to verify desktop pairing, toast delivery, and quick replies.
        </Text>

        <View style={styles.simBtnRow}>
          <TouchableOpacity
            style={styles.simBtn}
            onPress={onSendWhatsApp}
            disabled={isSimulating}
            activeOpacity={0.8}
          >
            <MessageSquare size={14} color="#22c55e" />
            <Text style={styles.simBtnText}>Test WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simBtn}
            onPress={onSendSMS}
            disabled={isSimulating}
            activeOpacity={0.8}
          >
            <Mail size={14} color="#38bdf8" />
            <Text style={styles.simBtnText}>Test SMS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
