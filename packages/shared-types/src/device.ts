import { z } from "zod";

export const DevicePlatformSchema = z.enum(["windows", "android"]);
export type DevicePlatform = z.infer<typeof DevicePlatformSchema>;

export const DeviceHeartbeatSchema = z.object({
  deviceId: z.string(),
  platform: DevicePlatformSchema,
  deviceName: z.string(),
  appVersion: z.string(),
  lastSeenAt: z.number(),
});

export type DeviceHeartbeat = z.infer<typeof DeviceHeartbeatSchema>;
