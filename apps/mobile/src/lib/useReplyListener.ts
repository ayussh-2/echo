import { useEffect } from "react";
import { subscribeToPendingReplies, updateReplyStatus } from "@echo/firebase-client";
import { getStoredSession } from "./storage";
import { NotificationBridgeService } from "./notificationBridge";
import type { ReplyItem } from "@echo/shared-types";

export function useReplyListener() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      const session = await getStoredSession();
      if (!session?.uid) return;

      unsubscribe = subscribeToPendingReplies(session.uid, async (pendingReplies: ReplyItem[]) => {
        for (const reply of pendingReplies) {
          try {
            console.log(`[Mobile Bridge] Executing reply: ${reply.id} for "${reply.text}"`);
            
            // Execute RemoteInput reply on device
            await NotificationBridgeService.sendNativeReply(reply.notificationId, reply.text);
            
            // Mark reply status as delivered in Firestore
            await updateReplyStatus(session.uid, reply.id, "delivered");
          } catch (err) {
            console.error(`[Mobile Bridge] Reply execution failed for ${reply.id}`, err);
            await updateReplyStatus(
              session.uid,
              reply.id,
              "failed",
              err instanceof Error ? err.message : "Unknown reply execution error"
            );
          }
        }
      });
    };

    setupListener();

    return () => {
      unsubscribe?.();
    };
  }, []);
}
