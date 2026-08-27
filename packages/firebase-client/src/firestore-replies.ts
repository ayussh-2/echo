import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import type { CreateReplyPayload, ReplyItem, ReplyStatus } from "@echo/shared-types";
import { getEchoFirestore } from "./config";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function createReply(
  uid: string,
  payload: CreateReplyPayload
): Promise<string> {
  const db = getEchoFirestore();
  const replyDocRef = doc(collection(db, `users/${uid}/replies`));
  const now = Date.now();

  const replyItem: ReplyItem = {
    ...payload,
    id: replyDocRef.id,
    createdAt: now,
    // Set 7-day TTL at write time
    expiresAt: now + SEVEN_DAYS_MS,
    status: "pending",
  };

  await setDoc(replyDocRef, replyItem);
  return replyDocRef.id;
}

export function subscribeToPendingReplies(
  uid: string,
  onUpdate: (replies: ReplyItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getEchoFirestore();
  const repliesCol = collection(db, `users/${uid}/replies`);
  
  // Real-time listener for pending replies to be processed on Android device
  const q = query(
    repliesCol,
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as ReplyItem);
      onUpdate(items);
    },
    (err) => {
      if (onError) {
        onError(err);
      }
    }
  );
}

export async function updateReplyStatus(
  uid: string,
  replyId: string,
  status: ReplyStatus,
  error?: string
): Promise<void> {
  const db = getEchoFirestore();
  const replyDocRef = doc(db, `users/${uid}/replies/${replyId}`);
  
  const updateData: Partial<ReplyItem> = { status };
  if (error !== undefined) {
    updateData.error = error;
  }

  await updateDoc(replyDocRef, updateData);
}
