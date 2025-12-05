import { z } from "zod";
import { AiResponseSchema } from "./AiResponseSchema";

export const WrapperSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("TEXT"),
    message: z.string(),
    data: z.null().optional(),
  }),
  z.object({
    type: z.literal("DIAGRAM"),
    message: z.string(),
    data: AiResponseSchema,
  }),
]);

export type WrapperType = z.infer<typeof WrapperSchema>;
