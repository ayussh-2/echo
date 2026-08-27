import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import type { DeviceHeartbeat } from "@echo/shared-types";
import { getEchoFirestore } from "./config";

export async function updateDeviceHeartbeat(
  uid: string,
  heartbeat: DeviceHeartbeat
): Promise<void> {
  const db = getEchoFirestore();
  const devDocRef = doc(db, `users/${uid}/devices/${heartbeat.deviceId}`);
  await setDoc(devDocRef, heartbeat, { merge: true });
}

export function subscribeToDevices(
  uid: string,
  onUpdate: (devices: DeviceHeartbeat[]) => void
): Unsubscribe {
  const db = getEchoFirestore();
  const devsCol = collection(db, `users/${uid}/devices`);

  return onSnapshot(devsCol, (snap) => {
    const devices = snap.docs.map((d) => d.data() as DeviceHeartbeat);
    onUpdate(devices);
  });
}
