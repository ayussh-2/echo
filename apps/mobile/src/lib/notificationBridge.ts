import { NativeModules, Platform } from "react-native";
import { writeNotification } from "@echo/firebase-client";
import { getStoredSession, getWhitelistedApps, getIsForwardingEnabled } from "./storage";
import type { NotificationItem } from "@echo/shared-types";

// Interface for native Android NotificationListenerService when compiled into standalone APK
export interface NativeEchoNotificationListener {
  isNotificationAccessGranted(): Promise<boolean>;
  openNotificationAccessSettings(): Promise<void>;
  isBatteryOptimizationIgnored(): Promise<boolean>;
  requestIgnoreBatteryOptimizations(): Promise<void>;
  sendRemoteInputReply(key: string, replyText: string): Promise<boolean>;
}

const { EchoNotificationBridge } = NativeModules;

export const NotificationBridgeService = {
  async isPermissionGranted(): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    if (EchoNotificationBridge?.isNotificationAccessGranted) {
      return await EchoNotificationBridge.isNotificationAccessGranted();
    }
    return true;
  },

  async openPermissionSettings(): Promise<void> {
    if (Platform.OS === "android" && EchoNotificationBridge?.openNotificationAccessSettings) {
      await EchoNotificationBridge.openNotificationAccessSettings();
    }
  },

  async sendNativeReply(notificationKey: string, replyText: string): Promise<boolean> {
    if (Platform.OS === "android" && EchoNotificationBridge?.sendRemoteInputReply) {
      return await EchoNotificationBridge.sendRemoteInputReply(notificationKey, replyText);
    }
    console.log(`[Echo Bridge] Executed reply for key: ${notificationKey} -> "${replyText}"`);
    return true;
  },

  async simulateIncomingNotification(
    appName: string,
    packageName: string,
    title: string,
    text: string,
    isGroup = false,
    groupName?: string
  ): Promise<void> {
    const session = await getStoredSession();
    if (!session) {
      throw new Error("Device is not paired to any desktop.");
    }

    const forwardingEnabled = await getIsForwardingEnabled();
    if (!forwardingEnabled) {
      console.log("[Echo Bridge] Forwarding is disabled in settings.");
      return;
    }

    const whitelist = await getWhitelistedApps();
    if (!whitelist.includes(packageName)) {
      console.log(`[Echo Bridge] ${packageName} is not in whitelist.`);
      return;
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    const notif: Omit<NotificationItem, "expiresAt"> = {
      id: notificationId,
      packageName,
      appName,
      conversationId: `conv_${title.toLowerCase().replace(/\s+/g, "_")}`,
      title,
      text,
      postedAt: now,
      hasReplyAction: true,
      isRead: false,
      isGroup,
      groupName,
      key: `android_sbn_${notificationId}`,
    };

    await writeNotification(session.uid, notif);
  },
};
