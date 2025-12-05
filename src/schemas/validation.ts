import { z } from "zod";

export const StructureNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["FILE", "FOLDER"]),
  level: z.number(),
  path: z.string(),
  parentId: z.string().optional(),
});

export const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
});

export const JsonStructureSchema = z.object({
  nodes: z.array(StructureNodeSchema), 
  edges: z.array(EdgeSchema),
});

export const DiagramDataSchema = z.object({
  mermaidSyntax: z.string(),
  jsonStructure: JsonStructureSchema,
});

export const WrapperSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("TEXT"),
    message: z.string(),
    data: z.null().optional(),
  }),
  z.object({
    type: z.literal("DIAGRAM"),
    message: z.string(),
    data: DiagramDataSchema,
  }),
]);

export type WrapperType = z.infer<typeof WrapperSchema>;
