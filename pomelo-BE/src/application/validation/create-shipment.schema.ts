import { z } from "zod";

export const CreateShipmentSchema = z.object({
  orderId: z.string().min(1),
  productCode: z.string().optional(),
  recipientName: z.string().min(1),
  recipientEmail: z.string().email(),
  recipientPhone: z.string().min(1),
  recipientAddress: z.string().min(1),
  recipientCity: z.string().min(1),
  recipientProvince: z.string().min(1),
  recipientPostalCode: z.string().min(1),
  packageWeightKg: z.number().positive(),
  packageVolumeCm3: z.number().positive(),
  declaredValueArs: z.number().min(0),
  itemsDescription: z.string().min(1)
});

export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
