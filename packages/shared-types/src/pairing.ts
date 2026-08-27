import { z } from "zod";

export const PairingPayloadSchema = z.object({
  uid: z.string(),
  code: z.string(),
  desktopDeviceName: z.string(),
  createdAt: z.number(),
  // 2-minute short-lived TTL for security
  expiresAt: z.number(),
});

export type PairingPayload = z.infer<typeof PairingPayloadSchema>;

export const PairingConfirmationSchema = z.object({
  uid: z.string(),
  code: z.string(),
  mobileDeviceId: z.string(),
  mobileDeviceName: z.string(),
  confirmedAt: z.number(),
});

export type PairingConfirmation = z.infer<typeof PairingConfirmationSchema>;
