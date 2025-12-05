import { z } from "zod";

export const StructureNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["FILE", "FOLDER"]),   // important: FILE or FOLDER only
  level: z.number(),
  path: z.string(),
  parentId: z.string().optional(),
});
