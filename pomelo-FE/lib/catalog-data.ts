export interface CategoryItem {
  name: string;
  image: string;
}

export interface PromoItem {
  title: string;
  subtitle: string;
  cta: string;
  image: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductVariant {
  fabricColor: ProductColor;
  printColor: ProductColor;
  images: string[];
}

export interface ProductItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection: string;
  priceArs: number;
  description: string;
  subtitle: string;
  variants: ProductVariant[];
  availableFabricColors: ProductColor[];
  availablePrintColors: ProductColor[];
  availableColors: ProductColor[];
  availableSizes: string[];
  rating: number;
  thumbnail: string;
  hoverImage?: string;
  galleryImages: string[];
  shippingInfo: string;
  fabricCare: string;
}

export interface BackendCollectionDto {
  id: string;
  slug: string;
  name: string;
  colorHex: string;
  coverImageUrl: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export interface BackendProductDto {
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
  variants: ProductVariant[];
  availableSizes: string[];
  shippingInfo: string;
  fabricCare: string;
  isActive: boolean;
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80";

function normalizeCatalogImage(url: string | undefined): string {
  if (!url || typeof url !== "string") {
    return DEFAULT_IMAGE;
  }

  if (url.startsWith("/")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === "example.com") {
      return DEFAULT_IMAGE;
    }

    return url;
  } catch {
    return DEFAULT_IMAGE;
  }
}

function buildGalleryImages(images: string[]): string[] {
  return [
    images[0] ?? DEFAULT_IMAGE,
    images[1] ?? images[0] ?? DEFAULT_IMAGE,
    images[2] ?? images[1] ?? images[0] ?? DEFAULT_IMAGE
  ];
}

function buildUniqueColors(colors: ProductColor[]): ProductColor[] {
  const seen = new Set<string>();

  return colors.filter((color) => {
    const key = `${color.name.trim().toLowerCase()}|${color.hex.trim().toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeProductVariants(product: BackendProductDto): ProductVariant[] {
  const incomingVariants = Array.isArray(product.variants) ? product.variants : [];
  const normalizedVariants = incomingVariants
    .filter(
      (variant) =>
        variant &&
        typeof variant.fabricColor?.name === "string" &&
        typeof variant.fabricColor?.hex === "string" &&
        typeof variant.printColor?.name === "string" &&
        typeof variant.printColor?.hex === "string"
    )
    .map((variant) => ({
      fabricColor: variant.fabricColor,
      printColor: variant.printColor,
      images: Array.isArray(variant.images)
        ? variant.images
            .filter((url) => typeof url === "string" && url.length > 0)
            .map((url) => normalizeCatalogImage(url))
        : []
    }));

  if (normalizedVariants.length > 0) {
    return normalizedVariants;
  }

  const fallbackHex = product.collection === "Azul" ? "#2f4f77" : "#b9a798";

  return [
    {
      fabricColor: { name: product.collection, hex: fallbackHex },
      printColor: { name: product.collection, hex: fallbackHex },
      images: [DEFAULT_IMAGE]
    }
  ];
}

export interface NavLinkItem {
  label: string;
  href: string;
}

export const navLinks: NavLinkItem[] = [
  { label: "Novedades", href: "#" },
  { label: "Ropa", href: "/shop" },
  { label: "Accesorios", href: "#" },
  { label: "Marcas", href: "#" },
  { label: "Admin", href: "/admin" }
];

export function mapBackendProductToUi(
  product: BackendProductDto,
  index = 0
): ProductItem {
  const variants = normalizeProductVariants(product);
  const defaultVariant = variants[0];
  const galleryImages = buildGalleryImages(defaultVariant?.images ?? []);
  const availableFabricColors = buildUniqueColors(variants.map((variant) => variant.fabricColor));
  const availablePrintColors = buildUniqueColors(variants.map((variant) => variant.printColor));

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    collection: product.collection,
    priceArs: product.priceArs,
    description: product.description,
    subtitle: product.subtitle,
    variants,
    availableFabricColors,
    availablePrintColors,
    availableColors: availableFabricColors,
    availableSizes:
      product.availableSizes?.length > 0 ? product.availableSizes : ["S", "M", "L"],
    rating: product.rating ?? 0,
    thumbnail: galleryImages[0],
    hoverImage: galleryImages[1],
    galleryImages: [
      galleryImages[0],
      galleryImages[1],
      galleryImages[2]
    ],
    shippingInfo: product.shippingInfo,
    fabricCare: product.fabricCare
  };
}

export function buildSliderCategoriesFromApi(
  collections: BackendCollectionDto[]
): CategoryItem[] {
  const apiCategories = collections
    .filter((collection) => collection.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((collection) => ({
      name: collection.name,
      image: normalizeCatalogImage(collection.coverImageUrl)
    }));

  return [
    {
      name: "Todas",
      image: DEFAULT_IMAGE
    },
    ...apiCategories
  ];
}

export function buildFeaturedCategoriesFromApi(
  collections: BackendCollectionDto[]
): CategoryItem[] {
  return collections
    .filter((collection) => collection.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 3)
    .map((collection) => ({
      name: `Coleccion ${collection.name}`,
      image: normalizeCatalogImage(collection.coverImageUrl)
    }));
}

export function buildPromosFromApi(
  collections: BackendCollectionDto[]
): PromoItem[] {
  const topCollections = collections
    .filter((collection) => collection.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 2);

  return topCollections.map((collection) => ({
    title: `Coleccion ${collection.name}`,
    subtitle:
      collection.description || `Descubri la nueva coleccion ${collection.name}.`,
    cta: "Ver tienda",
    image: normalizeCatalogImage(collection.coverImageUrl)
  }));
}

export function formatArs(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}
