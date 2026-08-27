import { z } from "zod";

export const NotificationItemSchema = z.object({
  id: z.string(),
  packageName: z.string(),
  appName: z.string(),
  conversationId: z.string(),
  title: z.string(),
  text: z.string(),
  postedAt: z.number(),
  // 7 days TTL expiry time computed on-device before persisting to Firestore
  expiresAt: z.number(),
  hasReplyAction: z.boolean(),
  isRead: z.boolean().default(false),
  isGroup: z.boolean().default(false),
  groupName: z.string().optional(),
  // Android StatusBarNotification key used for pinpoint lookup during reply execution
  key: z.string(),
});

export type NotificationItem = z.infer<typeof NotificationItemSchema>;

export const WhitelistedAppSchema = z.object({
  packageName: z.string(),
  appLabel: z.string(),
  enabled: z.boolean(),
  supportsReply: z.boolean(),
  iconDataUrl: z.string().optional(),
});

export type WhitelistedApp = z.infer<typeof WhitelistedAppSchema>;
