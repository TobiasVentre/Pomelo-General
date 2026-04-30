import { z } from "zod";

export const QuoteShippingSchema = z.object({
  postalCode: z.string().min(1),
  itemsCount: z.number().int().positive(),
  subtotalArs: z.number().min(0)
});

export type QuoteShippingInput = z.infer<typeof QuoteShippingSchema>;
