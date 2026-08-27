import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import type { NotificationItem } from "@echo/shared-types";
import { getEchoFirestore } from "./config";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function writeNotification(
  uid: string,
  notification: Omit<NotificationItem, "expiresAt">
): Promise<void> {
  const db = getEchoFirestore();
  const notifDocRef = doc(db, `users/${uid}/notifications/${notification.id}`);
  
  // Enforce 7-day TTL expiration at write time as required by Firestore TTL policy
  const fullNotification: NotificationItem = {
    ...notification,
    expiresAt: notification.postedAt + SEVEN_DAYS_MS,
  };

  await setDoc(notifDocRef, fullNotification, { merge: true });
}

export function subscribeToNotifications(
  uid: string,
  onUpdate: (notifications: NotificationItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getEchoFirestore();
  const notifsCol = collection(db, `users/${uid}/notifications`);
  
  // Real-time listener ordered by latest posted time
  const q = query(notifsCol, orderBy("postedAt", "desc"), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: NotificationItem[] = snapshot.docs.map((docSnap) => docSnap.data() as NotificationItem);
      onUpdate(items);
    },
    (err) => {
      if (onError) {
        onError(err);
      }
    }
  );
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  const db = getEchoFirestore();
  const notifDocRef = doc(db, `users/${uid}/notifications/${notificationId}`);
  await updateDoc(notifDocRef, { isRead: true });
}

export async function deleteNotification(uid: string, notificationId: string): Promise<void> {
  const db = getEchoFirestore();
  const notifDocRef = doc(db, `users/${uid}/notifications/${notificationId}`);
  await deleteDoc(notifDocRef);
}

export async function deleteReadNotifications(uid: string): Promise<void> {
  const db = getEchoFirestore();
  const notifsCol = collection(db, `users/${uid}/notifications`);
  const q = query(notifsCol, where("isRead", "==", true));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
  }
  await batch.commit();
}

export async function getMissedUnreadNotifications(uid: string): Promise<NotificationItem[]> {
  const db = getEchoFirestore();
  const notifsCol = collection(db, `users/${uid}/notifications`);
  const q = query(
    notifsCol,
    where("isRead", "==", false),
    orderBy("postedAt", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as NotificationItem);
}
