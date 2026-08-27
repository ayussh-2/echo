import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CameraView, type BarcodeScanningResult } from "expo-camera";
import { QrCode } from "lucide-react-native";
import { componentStyles as styles } from "../lib/styles";

interface QRScannerViewProps {
  scanned: boolean;
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
}

export function QRScannerView({ scanned, onBarcodeScanned }: QRScannerViewProps) {
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
      />

      <View style={styles.overlay}>
        <View style={styles.finderBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <QrCode size={36} color="rgba(255, 255, 255, 0.4)" />
        </View>
      </View>
    </View>
  );
}
