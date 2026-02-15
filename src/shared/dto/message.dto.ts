import { z } from "zod";

export const CreateMessageSchema = z.object({
    conversationId: z.string(),
    content: z.string().min(1).max(5000),
    messageType: z.enum(["text", "image", "video", "audio", "file"]),
    repliedTo: z.string().optional(),
});

export type CreateMessageDTO = z.infer<typeof CreateMessageSchema>;