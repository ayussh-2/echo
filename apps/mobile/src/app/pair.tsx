import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useRouter } from "expo-router";
import { ShieldAlert, Camera } from "lucide-react-native";
import { decodePairingPayload } from "@echo/crypto";
import { confirmPairing } from "@echo/firebase-client";
import { setStoredSession, initMobileFirebase, theme, screenStyles as styles } from "../lib";
import { ScreenHeader, QRScannerView } from "../components";

export default function PairScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    const data = result.data;
    if (scanned || isProcessing) return;
    setScanned(true);
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const payload = decodePairingPayload(data);
      if (!payload) {
        throw new Error("Invalid QR code format. Please scan the QR code displayed in Echo Desktop.");
      }

      if (Date.now() > payload.expiresAt) {
        throw new Error("This pairing QR code has expired. Please refresh the QR code on your PC.");
      }

      const mobileDeviceId = `android_${Math.random().toString(36).slice(2, 9)}`;
      const mobileDeviceName = "Android Device";

      const confirmed = await confirmPairing(payload.uid, {
        uid: payload.uid,
        code: payload.code,
        mobileDeviceId,
        mobileDeviceName,
        confirmedAt: Date.now(),
      });

      if (!confirmed) {
        throw new Error("Failed to confirm pairing. The session code may be invalid or expired.");
      }

      // Persist paired session securely
      await setStoredSession({
        uid: payload.uid,
        desktopId: payload.desktopDeviceName,
        desktopName: payload.desktopDeviceName,
        pairedAt: Date.now(),
      });

      router.replace("/");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Pairing failed");
      setIsProcessing(false);
      setTimeout(() => setScanned(false), 2500);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.cardContainer}>
        <View style={styles.centerBox}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.cardContainer}>
        <ScreenHeader title="Scan Desktop QR" onBack={() => router.back()} />

        <View style={styles.permissionBox}>
          <View style={styles.permissionIconWrap}>
            <ShieldAlert size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.permTitle}>Camera Permission Required</Text>
          <Text style={styles.permSub}>
            Echo requires camera access to scan the desktop pairing QR code and link your phone.
          </Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Camera size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.cardContainer}>
      <ScreenHeader title="Scan Desktop QR" onBack={() => router.back()} />

      <QRScannerView scanned={scanned} onBarcodeScanned={handleBarcodeScanned} />

      <View style={styles.footer}>
        {isProcessing ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <Text style={styles.statusText}>Connecting to Echo Desktop...</Text>
          </View>
        ) : errorMsg ? (
          <View style={[styles.statusBox, styles.errorBox]}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Point camera at PC screen</Text>
            <Text style={styles.hintSub}>
              Open Echo Desktop &gt; Pair screen, and align the QR code within the frame.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
