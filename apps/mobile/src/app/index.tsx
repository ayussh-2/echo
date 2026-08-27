import React, { useState, useEffect } from "react";
import { ScrollView, ActivityIndicator, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MessageSquare, Mail } from "lucide-react-native";
import {
  getStoredSession,
  clearStoredSession,
  getWhitelistedApps,
  setWhitelistedApps,
  getIsForwardingEnabled,
  setIsForwardingEnabled,
  NotificationBridgeService,
  theme,
  screenStyles as styles,
  type MobilePairedSession,
} from "../lib";
import {
  ScreenHeader,
  DeviceStatusCard,
  WhitelistedAppsList,
  PermissionWarningBanner,
  SimulationToolsCard,
  type WhitelistAppItem,
} from "../components";

const SUPPORTED_APPS: WhitelistAppItem[] = [
  {
    id: "com.whatsapp",
    name: "WhatsApp",
    icon: MessageSquare,
    color: "#22c55e",
    subtext: "Messages & Quick Replies",
  },
  {
    id: "com.google.android.apps.messaging",
    name: "Google Messages / SMS",
    icon: Mail,
    color: "#38bdf8",
    subtext: "SMS & RCS text forwarding",
  },
  {
    id: "org.telegram.messenger",
    name: "Telegram",
    icon: MessageSquare,
    color: "#24A1DE",
    subtext: "Telegram channels & chats",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<MobilePairedSession | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [forwardingEnabled, setForwardingEnabled] = useState<boolean>(true);
  const [hasNotifAccess, setHasNotifAccess] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    setIsLoading(true);
    const stored = await getStoredSession();
    setSession(stored);

    const apps = await getWhitelistedApps();
    setWhitelist(apps);

    const enabled = await getIsForwardingEnabled();
    setForwardingEnabled(enabled);

    const granted = await NotificationBridgeService.isPermissionGranted();
    setHasNotifAccess(granted);

    setIsLoading(false);
  };

  const handleToggleForwarding = async (val: boolean) => {
    setForwardingEnabled(val);
    await setIsForwardingEnabled(val);
  };

  const handleToggleApp = async (packageId: string) => {
    const next = whitelist.includes(packageId)
      ? whitelist.filter((p) => p !== packageId)
      : [...whitelist, packageId];
    setWhitelist(next);
    await setWhitelistedApps(next);
  };

  const handleUnpair = () => {
    Alert.alert(
      "Unpair Desktop",
      "Are you sure you want to disconnect from this desktop? You will stop sending notifications until you scan a new QR code.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unpair",
          style: "destructive",
          onPress: async () => {
            await clearStoredSession();
            setSession(null);
          },
        },
      ],
    );
  };

  const handleTestWhatsAppNotification = async () => {
    if (!session) return;
    setIsSimulating(true);
    try {
      await NotificationBridgeService.simulateIncomingNotification(
        "WhatsApp",
        "com.whatsapp",
        "Alexander Wright",
        "Project status update: The deployment has completed successfully.",
      );
      Alert.alert("Notification Sent", "Test message forwarded to desktop.");
    } catch (err) {
      Alert.alert(
        "Simulation Failed",
        err instanceof Error ? err.message : "Failed to simulate notification.",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleTestSMSNotification = async () => {
    if (!session) return;
    setIsSimulating(true);
    try {
      await NotificationBridgeService.simulateIncomingNotification(
        "Messages",
        "com.google.android.apps.messaging",
        "+1 (555) 019-2834",
        "Verification security code: 849204 (Expires in 5 minutes)",
      );
      Alert.alert(
        "Notification Sent",
        "Test SMS notification forwarded to desktop.",
      );
    } catch (err) {
      Alert.alert(
        "Simulation Failed",
        err instanceof Error ? err.message : "Failed to simulate notification.",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Echo" onAction={() => router.push("/pair")} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DeviceStatusCard
          session={session}
          forwardingEnabled={forwardingEnabled}
          onToggleForwarding={handleToggleForwarding}
          onUnpair={handleUnpair}
          onScanQR={() => router.push("/pair")}
        />

        {!hasNotifAccess && (
          <PermissionWarningBanner
            onOpenSettings={() =>
              NotificationBridgeService.openPermissionSettings()
            }
          />
        )}

        <WhitelistedAppsList
          apps={SUPPORTED_APPS}
          whitelist={whitelist}
          onToggleApp={handleToggleApp}
        />

        {session && (
          <SimulationToolsCard
            isSimulating={isSimulating}
            onSendWhatsApp={handleTestWhatsAppNotification}
            onSendSMS={handleTestSMSNotification}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
