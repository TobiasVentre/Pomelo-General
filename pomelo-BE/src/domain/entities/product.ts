import { randomUUID } from "node:crypto";

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductData {
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
  availableColors: ProductColor[];
  availableSizes: string[];
  images: string[];
}

export class Product {
  readonly id: string;
  readonly slug: string;
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly collection: string;
  readonly description: string;
  readonly subtitle: string;
  readonly shippingInfo: string;
  readonly fabricCare: string;
  readonly rating: number;

  private _priceArs: number;
  private _isActive: boolean;
  private _availableColors: ProductColor[];
  private _availableSizes: string[];
  private _images: string[];

  get priceArs() { return this._priceArs; }
  get isActive() { return this._isActive; }
  get availableColors() { return this._availableColors; }
  get availableSizes() { return this._availableSizes; }
  get images() { return this._images; }

  private constructor(data: ProductData) {
    this.id = data.id;
    this.slug = data.slug;
    this.sku = data.sku;
    this.name = data.name;
    this.category = data.category;
    this.collection = data.collection;
    this.description = data.description;
    this.subtitle = data.subtitle;
    this.shippingInfo = data.shippingInfo;
    this.fabricCare = data.fabricCare;
    this.rating = data.rating;
    this._priceArs = data.priceArs;
    this._isActive = data.isActive;
    this._availableColors = data.availableColors;
    this._availableSizes = data.availableSizes;
    this._images = data.images;
  }

  static create(data: Omit<ProductData, "id">): Product {
    if (data.priceArs <= 0) {
      throw new Error("Product priceArs must be positive");
    }
    if (data.rating < 0 || data.rating > 5) {
      throw new Error("Product rating must be between 0 and 5");
    }
    const sizes = data.availableSizes ?? [];
    if (new Set(sizes).size !== sizes.length) {
      throw new Error("Product availableSizes must not contain duplicates");
    }
    return new Product({ ...data, id: randomUUID(), availableColors: data.availableColors ?? [], availableSizes: sizes, images: data.images ?? [] });
  }

  static reconstitute(data: ProductData): Product {
    return new Product(data);
  }

  changePrice(newPrice: number): void {
    if (newPrice <= 0) throw new Error("Product priceArs must be positive");
    this._priceArs = newPrice;
  }

  activate(): void { this._isActive = true; }
  deactivate(): void { this._isActive = false; }

  replaceVariants(colors: ProductColor[], sizes: string[], images: string[]): void {
    if (new Set(sizes).size !== sizes.length) {
      throw new Error("Product availableSizes must not contain duplicates");
    }
    this._availableColors = [...colors];
    this._availableSizes = [...sizes];
    this._images = [...images];
  }
}
