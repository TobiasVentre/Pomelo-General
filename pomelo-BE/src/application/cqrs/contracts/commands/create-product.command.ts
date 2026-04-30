import type { ProductColor, ColorCombo } from "../../../../domain/entities/product";

export interface CreateProductCommand {
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
  availableColors?: ProductColor[];
  availableSizes?: string[];
  images?: string[];
  colorCombos?: ColorCombo[];
}
