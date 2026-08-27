import { z } from "zod";

export const ReplyStatusSchema = z.enum([
  "pending",
  "delivered",
  "failed",
  "expired",
]);

export type ReplyStatus = z.infer<typeof ReplyStatusSchema>;

export const ReplyItemSchema = z.object({
  id: z.string(),
  notificationId: z.string(),
  packageName: z.string(),
  conversationId: z.string(),
  text: z.string(),
  createdAt: z.number(),
  // 7 days TTL expiry matches notification lifecycle
  expiresAt: z.number(),
  status: ReplyStatusSchema,
  error: z.string().optional(),
});

export type ReplyItem = z.infer<typeof ReplyItemSchema>;

export const CreateReplyPayloadSchema = ReplyItemSchema.omit({
  id: true,
  createdAt: true,
  expiresAt: true,
  status: true,
  error: true,
});

export type CreateReplyPayload = z.infer<typeof CreateReplyPayloadSchema>;
