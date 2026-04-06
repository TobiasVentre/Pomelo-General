import type { ProductVariant } from "../../../../domain/entities/product";

export interface UpdateProductCommand {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: string;
  collection: string;
  priceArs: number;
  description: string;
  subtitle: string;
  rating: number;
  shippingInfo: string;
  fabricCare: string;
  isActive: boolean;
  variants: ProductVariant[];
  availableSizes?: string[];
}
