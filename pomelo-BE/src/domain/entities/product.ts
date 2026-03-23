export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
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
  availableColors: ProductColor[];
  availableSizes: string[];
  images: string[];
  shippingInfo: string;
  fabricCare: string;
  isActive: boolean;
}
