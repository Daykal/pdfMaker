import { z } from "zod";

export const motifSchema = z.object({
  width: z.number().min(1),
  height: z.number().min(1),
  colors: z.array(z.string()),
  rows: z.array(
    z.object({
      index: z.number(),
      pixels: z.array(
        z.object({
          color: z.union([z.number(), z.literal(false)]),
          count: z.number().min(1),
        })
      ),
    })
  ),
});
