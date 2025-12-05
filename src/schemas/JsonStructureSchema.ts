import { z } from "zod";
import { StructureNodeSchema } from "./StructureNodeSchema";
import { EdgeSchema } from "./EdgeSchema";

export const JsonStructureSchema = z.object({
  nodes: z.array(StructureNodeSchema),
  edges: z.array(EdgeSchema),
});
