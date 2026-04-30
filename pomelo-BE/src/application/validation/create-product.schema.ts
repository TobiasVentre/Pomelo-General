import { z } from "zod";

const ProductColorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().min(1)
});

export const CreateProductSchema = z.object({
  slug: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  collection: z.string().min(1),
  priceArs: z.number().positive(),
  description: z.string().min(1),
  subtitle: z.string().min(1),
  rating: z.number().min(0).max(5),
  shippingInfo: z.string().min(1),
  fabricCare: z.string().min(1),
  isActive: z.boolean(),
  availableColors: z.array(ProductColorSchema).default([]),
  availableSizes: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([])
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
