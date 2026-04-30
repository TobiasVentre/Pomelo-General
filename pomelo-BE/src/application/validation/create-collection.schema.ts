import { z } from "zod";

export const CreateCollectionSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  colorHex: z.string().min(1),
  coverImageUrl: z.string().url(),
  description: z.string().min(1),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0)
});

export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
