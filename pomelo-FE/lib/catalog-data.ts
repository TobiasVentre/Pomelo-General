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

export interface ProductItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection: string;
  priceArs: number;
  description: string;
  subtitle: string;
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
  availableColors: ProductColor[];
  availableSizes: string[];
  images: string[];
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

export interface NavLinkItem {
  label: string;
  href: string;
}

export const navLinks: NavLinkItem[] = [
  { label: "Novedades", href: "#" },
  { label: "Ropa", href: "/shop" },
  { label: "Accesorios", href: "#" },
  { label: "Marcas", href: "#" }
];

export function mapBackendProductToUi(
  product: BackendProductDto,
  index = 0
): ProductItem {
  const incomingImages = Array.isArray(product.images)
    ? product.images
        .filter((url) => typeof url === "string" && url.length > 0)
        .map((url) => normalizeCatalogImage(url))
    : [];

  const galleryImages = [
    incomingImages[0] ?? DEFAULT_IMAGE,
    incomingImages[1] ?? incomingImages[0] ?? DEFAULT_IMAGE,
    incomingImages[2] ?? incomingImages[1] ?? incomingImages[0] ?? DEFAULT_IMAGE
  ];

  const fallbackHex = product.collection === "Azul" ? "#2f4f77" : "#b9a798";

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    collection: product.collection,
    priceArs: product.priceArs,
    description: product.description,
    subtitle: product.subtitle,
    availableColors:
      product.availableColors?.length > 0
        ? product.availableColors
        : [{ name: product.collection, hex: fallbackHex }],
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
