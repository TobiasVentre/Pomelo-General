import type { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { type ChangeEvent, useState } from "react";
import Navbar from "../../components/Navbar";
import { resolveAdminSession } from "../../lib/admin-session";
import { getBackendApiBase } from "../../lib/backend-api";
import type { BackendCollectionDto, BackendProductDto, ProductVariant } from "../../lib/catalog-data";

interface AdminPageProps {
  products: BackendProductDto[];
  collections: BackendCollectionDto[];
  apiError: string | null;
  adminEmail: string | null;
}

interface CollectionFormState {
  id: string;
  slug: string;
  name: string;
  colorHex: string;
  coverImageUrl: string;
  description: string;
  isActive: boolean;
  displayOrder: string;
}

interface ProductFormState {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: string;
  collection: string;
  priceArs: string;
  subtitle: string;
  description: string;
  rating: string;
  shippingInfo: string;
  fabricCare: string;
  isActive: boolean;
  availableSizesText: string;
  variants: ProductVariantFormState[];
}

interface ProductVariantFormState {
  key: string;
  fabricColorName: string;
  fabricColorHex: string;
  printColorName: string;
  printColorHex: string;
  imagesText: string;
}

const emptyCollectionForm: CollectionFormState = {
  id: "",
  slug: "",
  name: "",
  colorHex: "#000000",
  coverImageUrl: "",
  description: "",
  isActive: true,
  displayOrder: "100"
};

function createVariantFormState(
  overrides: Partial<Omit<ProductVariantFormState, "key">> = {}
): ProductVariantFormState {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    fabricColorName: "",
    fabricColorHex: "#000000",
    printColorName: "",
    printColorHex: "#000000",
    imagesText: "",
    ...overrides
  };
}

function createEmptyProductForm(): ProductFormState {
  return {
    id: "",
    slug: "",
    sku: "",
    name: "",
    category: "Remeras",
    collection: "",
    priceArs: "",
    subtitle: "",
    description: "",
    rating: "4.5",
    shippingInfo: "Envio a todo el pais",
    fabricCare: "100% algodon",
    isActive: true,
    availableSizesText: "S\nM\nL",
    variants: [createVariantFormState()]
  };
}

const productCategoryOptions = ["Remeras"];

type AdminTab = "collections" | "products";
type MessageTone = "success" | "error";

interface UploadFileResult {
  url: string;
  originalName: string;
  size: number;
}

function sortCollections(items: BackendCollectionDto[]): BackendCollectionDto[] {
  return [...items].sort(
    (left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)
  );
}

function sortProducts(items: BackendProductDto[]): BackendProductDto[] {
  return [...items].sort(
    (left, right) => left.collection.localeCompare(right.collection) || left.name.localeCompare(right.name)
  );
}

function appendLines(value: string, nextItems: string[]): string {
  return [...splitLines(value), ...nextItems].join("\n");
}

function removeLineAt(value: string, indexToRemove: number): string {
  return splitLines(value)
    .filter((_, index) => index !== indexToRemove)
    .join("\n");
}

function moveLine(value: string, index: number, direction: -1 | 1): string {
  const items = splitLines(value);
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= items.length) {
    return value;
  }

  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  return items.join("\n");
}

function getActiveTab(tab: string | string[] | undefined): AdminTab {
  if (tab === "products") {
    return "products";
  }

  if (Array.isArray(tab) && tab[0] === "products") {
    return "products";
  }

  return "collections";
}

async function readResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; details?: string[] };

    if (Array.isArray(payload.details) && payload.details.length > 0) {
      return `${payload.message ?? "Error desconocido"}: ${payload.details.join(", ")}`;
    }

    return payload.message ?? "Error desconocido";
  } catch {
    return "Error desconocido";
  }
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isBlankVariantForm(variant: ProductVariantFormState): boolean {
  return (
    variant.fabricColorName.trim() === "" &&
    variant.fabricColorHex.trim() === "#000000" &&
    variant.printColorName.trim() === "" &&
    variant.printColorHex.trim() === "#000000" &&
    splitLines(variant.imagesText).length === 0
  );
}

function mapVariantFormToPayload(variant: ProductVariantFormState): ProductVariant {
  return {
    fabricColor: {
      name: variant.fabricColorName.trim(),
      hex: variant.fabricColorHex.trim()
    },
    printColor: {
      name: variant.printColorName.trim(),
      hex: variant.printColorHex.trim()
    },
    images: splitLines(variant.imagesText)
  };
}

function normalizeSkuSegment(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();

  if (normalized.length >= 3) {
    return normalized.slice(0, 3);
  }

  if (normalized.length > 0) {
    return normalized.padEnd(3, fallback[0] ?? "X");
  }

  return fallback;
}

function normalizeSlugSegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildSuggestedSku(input: {
  category: string;
  collectionName: string;
  currentProductId: string;
  products: BackendProductDto[];
  collections: BackendCollectionDto[];
}): string {
  const category = input.category.trim();
  const collectionName = input.collectionName.trim();

  if (!category || !collectionName) {
    return "";
  }

  const categoryPrefix = normalizeSkuSegment(category, "CAT");
  const matchingCollection = input.collections.find((collection) => collection.name === collectionName);
  const collectionSource = matchingCollection?.slug || matchingCollection?.name || collectionName;
  const collectionPrefix = normalizeSkuSegment(collectionSource, "COL");
  const prefix = `${categoryPrefix}-${collectionPrefix}`;
  const relatedProducts = input.products.filter(
    (product) =>
      product.id !== input.currentProductId &&
      product.category.trim() === category &&
      product.collection.trim() === collectionName
  );

  const sequence = relatedProducts
    .reduce((maxSequence, product) => {
      const parsedSequence = Number.parseInt(product.sku.trim().match(/(\d+)$/)?.[1] ?? "", 10);

      if (product.sku.trim().startsWith(`${prefix}-`) && Number.isFinite(parsedSequence)) {
        return Math.max(maxSequence, parsedSequence);
      }

      return maxSequence;
    }, relatedProducts.length);

  return `${prefix}-${String(sequence + 1).padStart(3, "0")}`;
}

function buildSuggestedProductSlug(input: {
  name: string;
  collectionName: string;
  currentProductId: string;
  products: BackendProductDto[];
  collections: BackendCollectionDto[];
}): string {
  const nameSegment = normalizeSlugSegment(input.name.trim());

  if (!nameSegment) {
    return "";
  }

  const matchingCollection = input.collections.find(
    (collection) => collection.name === input.collectionName.trim()
  );
  const collectionSegment = normalizeSlugSegment(
    matchingCollection?.slug || matchingCollection?.name || input.collectionName.trim()
  );
  const baseSlug = [nameSegment, collectionSegment].filter(Boolean).join("-");

  if (!baseSlug) {
    return "";
  }

  const usedSlugs = new Set(
    input.products
      .filter((product) => product.id !== input.currentProductId)
      .map((product) => product.slug.trim())
  );

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let sequence = 2;

  while (usedSlugs.has(`${baseSlug}-${sequence}`)) {
    sequence += 1;
  }

  return `${baseSlug}-${sequence}`;
}

function withSuggestedProductIdentifiers(
  previous: ProductFormState,
  next: ProductFormState,
  products: BackendProductDto[],
  collections: BackendCollectionDto[]
): ProductFormState {
  const previousSuggestedSku = buildSuggestedSku({
    category: previous.category,
    collectionName: previous.collection,
    currentProductId: previous.id,
    products,
    collections
  });
  const nextSuggestedSku = buildSuggestedSku({
    category: next.category,
    collectionName: next.collection,
    currentProductId: next.id,
    products,
    collections
  });
  const previousSuggestedSlug = buildSuggestedProductSlug({
    name: previous.name,
    collectionName: previous.collection,
    currentProductId: previous.id,
    products,
    collections
  });
  const nextSuggestedSlug = buildSuggestedProductSlug({
    name: next.name,
    collectionName: next.collection,
    currentProductId: next.id,
    products,
    collections
  });

  return {
    ...next,
    slug:
      !previous.id && (previous.slug.trim() === "" || previous.slug === previousSuggestedSlug)
        ? nextSuggestedSlug
        : next.slug,
    sku:
      !previous.id && (previous.sku.trim() === "" || previous.sku === previousSuggestedSku)
        ? nextSuggestedSku
        : next.sku
  };
}

function mapCollectionToForm(collection: BackendCollectionDto): CollectionFormState {
  return {
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    colorHex: collection.colorHex,
    coverImageUrl: collection.coverImageUrl,
    description: collection.description,
    isActive: collection.isActive,
    displayOrder: String(collection.displayOrder)
  };
}

function mapProductToForm(product: BackendProductDto): ProductFormState {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    category: product.category,
    collection: product.collection,
    priceArs: String(product.priceArs),
    subtitle: product.subtitle,
    description: product.description,
    rating: String(product.rating),
    shippingInfo: product.shippingInfo,
    fabricCare: product.fabricCare,
    isActive: product.isActive,
    availableSizesText: product.availableSizes.join("\n"),
    variants:
      product.variants.length > 0
        ? product.variants.map((variant) =>
            createVariantFormState({
              fabricColorName: variant.fabricColor.name,
              fabricColorHex: variant.fabricColor.hex,
              printColorName: variant.printColor.name,
              printColorHex: variant.printColor.hex,
              imagesText: variant.images.join("\n")
            })
          )
        : [createVariantFormState()]
  };
}

export default function AdminPage({
  products,
  collections,
  apiError,
  adminEmail
}: AdminPageProps): JSX.Element {
  const router = useRouter();
  const activeTab = getActiveTab(router.query.tab);
  const [catalogCollections, setCatalogCollections] = useState<BackendCollectionDto[]>(() =>
    sortCollections(collections)
  );
  const [catalogProducts, setCatalogProducts] = useState<BackendProductDto[]>(() =>
    sortProducts(products)
  );
  const collectionOptions = Array.from(new Set(catalogCollections.map((collection) => collection.name))).sort(
    (left, right) => left.localeCompare(right)
  );
  const [collectionForm, setCollectionForm] = useState<CollectionFormState>(emptyCollectionForm);
  const [productForm, setProductForm] = useState<ProductFormState>(() => createEmptyProductForm());
  const [message, setMessage] = useState<string>("");
  const [messageTone, setMessageTone] = useState<MessageTone>("success");
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingCollectionCover, setIsUploadingCollectionCover] = useState(false);
  const [isUploadingProductImages, setIsUploadingProductImages] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const suggestedSlug = buildSuggestedProductSlug({
    name: productForm.name,
    collectionName: productForm.collection,
    currentProductId: productForm.id,
    products: catalogProducts,
    collections: catalogCollections
  });
  const suggestedSku = buildSuggestedSku({
    category: productForm.category,
    collectionName: productForm.collection,
    currentProductId: productForm.id,
    products: catalogProducts,
    collections: catalogCollections
  });

  const switchTab = async (tab: AdminTab): Promise<void> => {
    if (tab === activeTab) {
      return;
    }

    await router.replace(
      {
        pathname: router.pathname,
        query: tab === "products" ? { tab } : {}
      },
      undefined,
      { shallow: true }
    );
  };

  const uploadAdminFiles = async (
    files: FileList,
    folder: "collections" | "products",
    entitySlug: string
  ): Promise<UploadFileResult[]> => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    formData.append("folder", folder);
    if (entitySlug.trim().length > 0) {
      formData.append("entitySlug", entitySlug.trim());
    }

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(await readResponseError(response));
    }

    const payload = (await response.json()) as { files?: UploadFileResult[] };
    return payload.files ?? [];
  };

  const handleCollectionCoverUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploadingCollectionCover(true);
    setMessage("");

    try {
      const uploadedFiles = await uploadAdminFiles(files, "collections", collectionForm.slug);
      const uploadedCover = uploadedFiles[0];

      if (!uploadedCover) {
        throw new Error("No se pudo obtener la portada subida");
      }

      setCollectionForm((prev) => ({ ...prev, coverImageUrl: uploadedCover.url }));
      setMessageTone("success");
      setMessage("Portada de coleccion cargada correctamente.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "No se pudo subir la portada.");
    } finally {
      setIsUploadingCollectionCover(false);
      event.target.value = "";
    }
  };

  const updateProductVariant = (
    variantIndex: number,
    updater: (variant: ProductVariantFormState) => ProductVariantFormState
  ): void => {
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, index) =>
        index === variantIndex ? updater(variant) : variant
      )
    }));
  };

  const addProductVariant = (): void => {
    setProductForm((prev) => ({
      ...prev,
      variants: [...prev.variants, createVariantFormState()]
    }));
  };

  const removeProductVariant = (variantIndex: number): void => {
    setProductForm((prev) => ({
      ...prev,
      variants:
        prev.variants.length > 1
          ? prev.variants.filter((_, index) => index !== variantIndex)
          : [createVariantFormState()]
    }));
  };

  const handleVariantImagesUpload = async (
    variantIndex: number,
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploadingProductImages(true);
    setMessage("");

    try {
      const uploadedFiles = await uploadAdminFiles(files, "products", productForm.slug);
      const uploadedUrls = uploadedFiles.map((file) => file.url);

      if (uploadedUrls.length === 0) {
        throw new Error("No se pudieron obtener las imagenes subidas");
      }

      updateProductVariant(variantIndex, (variant) => ({
        ...variant,
        imagesText: appendLines(variant.imagesText, uploadedUrls)
      }));
      setMessageTone("success");
      setMessage(`Imagenes de la variante ${variantIndex + 1} cargadas correctamente.`);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "No se pudieron subir las imagenes.");
    } finally {
      setIsUploadingProductImages(false);
      event.target.value = "";
    }
  };

  const moveVariantImage = (variantIndex: number, imageIndex: number, direction: -1 | 1): void => {
    updateProductVariant(variantIndex, (variant) => ({
      ...variant,
      imagesText: moveLine(variant.imagesText, imageIndex, direction)
    }));
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number): void => {
    updateProductVariant(variantIndex, (variant) => ({
      ...variant,
      imagesText: removeLineAt(variant.imagesText, imageIndex)
    }));
  };

  const saveCollection = async (): Promise<void> => {
    setIsSavingCollection(true);
    setMessage("");
    const payload = {
      slug: collectionForm.slug.trim(),
      name: collectionForm.name.trim(),
      colorHex: collectionForm.colorHex.trim(),
      coverImageUrl: collectionForm.coverImageUrl.trim(),
      description: collectionForm.description.trim(),
      isActive: collectionForm.isActive,
      displayOrder: Number(collectionForm.displayOrder)
    };
    const endpoint = collectionForm.id
      ? `/api/admin/collections/${collectionForm.id}`
      : "/api/admin/collections";
    const method = collectionForm.id ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setMessageTone("error");
        setMessage(`Error guardando coleccion: ${await readResponseError(response)}`);
        return;
      }

      const savedCollection = (await response.json()) as BackendCollectionDto;
      setCatalogCollections((prev) =>
        sortCollections([savedCollection, ...prev.filter((item) => item.id !== savedCollection.id)])
      );
      setCollectionForm(emptyCollectionForm);
      setMessageTone("success");
      setMessage("Coleccion guardada correctamente.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la coleccion.");
    } finally {
      setIsSavingCollection(false);
    }
  };

  const saveProduct = async (): Promise<void> => {
    setIsSavingProduct(true);
    setMessage("");

    const resolvedSku = productForm.sku.trim() || suggestedSku;
    const resolvedSlug = productForm.slug.trim() || suggestedSlug;
    const payload = {
      slug: resolvedSlug,
      sku: resolvedSku,
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      collection: productForm.collection.trim(),
      priceArs: Number(productForm.priceArs),
      description: productForm.description.trim(),
      subtitle: productForm.subtitle.trim(),
      rating: Number(productForm.rating),
      shippingInfo: productForm.shippingInfo.trim(),
      fabricCare: productForm.fabricCare.trim(),
      isActive: productForm.isActive,
      availableSizes: splitLines(productForm.availableSizesText),
      variants: productForm.variants
        .filter((variant) => !isBlankVariantForm(variant))
        .map((variant) => mapVariantFormToPayload(variant))
    };

    const endpoint = productForm.id
      ? `/api/admin/products/${productForm.id}`
      : "/api/admin/products";
    const method = productForm.id ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setMessageTone("error");
        setMessage(`Error guardando producto: ${await readResponseError(response)}`);
        return;
      }

      const savedProduct = (await response.json()) as BackendProductDto;
      setCatalogProducts((prev) =>
        sortProducts([savedProduct, ...prev.filter((item) => item.id !== savedProduct.id)])
      );
      setProductForm(createEmptyProductForm());
      setMessageTone("success");
      setMessage("Producto guardado correctamente.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el producto.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    await router.push("/admin/login");
  };

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <Navbar />

      <section className="mx-auto max-w-[1400px] px-5 pb-14 pt-8 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#7a7167]">Panel interno</p>
            <h1 className="mt-2 font-display text-4xl text-[#1f1b16] md:text-5xl">
              Administracion de catalogo
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-[#5b5249]">
              Gestiona colecciones y remeras desde un solo panel. Ahora podes separar la
              carga por seccion y adjuntar imagenes para guardarlas en el servidor.
            </p>
            {adminEmail ? (
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#7a7167]">
                Sesion: {adminEmail}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="rounded-full border border-[#2d261f] px-4 py-2 text-xs uppercase tracking-[0.13em]"
            onClick={logout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Saliendo..." : "Cerrar sesion"}
          </button>
        </div>
        {apiError ? (
          <p className="mt-4 text-sm text-[#9a3412]">Error API: {apiError}</p>
        ) : null}
        {message ? (
          <p className={`mt-4 text-sm ${messageTone === "error" ? "text-[#9a3412]" : "text-[#1d4d2e]"}`}>
            {message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
              activeTab === "collections"
                ? "bg-[#1f1b16] text-white"
                : "border border-[#cfc4b5] bg-white text-[#3c342d]"
            }`}
            onClick={() => void switchTab("collections")}
          >
            Colecciones
          </button>
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
              activeTab === "products"
                ? "bg-[#1f1b16] text-white"
                : "border border-[#cfc4b5] bg-white text-[#3c342d]"
            }`}
            onClick={() => void switchTab("products")}
          >
            Remeras
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1040px] gap-8 px-5 pb-20 md:px-8">
        {activeTab === "collections" ? (
          <article className="rounded-2xl border border-[#ddd4c8] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-3xl">Colecciones</h2>
            <button
              type="button"
              className="rounded-full border border-[#2d261f] px-4 py-1 text-xs uppercase tracking-[0.13em]"
              onClick={() => setCollectionForm(emptyCollectionForm)}
            >
              Nueva
            </button>
          </div>

          <div className="mb-5 max-h-56 overflow-auto rounded-xl border border-[#ece4d8]">
            {catalogCollections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                className="flex w-full items-center justify-between border-b border-[#f4eee3] px-3 py-2 text-left text-sm hover:bg-[#faf7f2]"
                onClick={() => setCollectionForm(mapCollectionToForm(collection))}
              >
                <span>{collection.name}</span>
                <span className={collection.isActive ? "text-[#166534]" : "text-[#991b1b]"}>
                  {collection.isActive ? "Activa" : "Inactiva"}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Slug"
              value={collectionForm.slug}
              onChange={(event) =>
                setCollectionForm((prev) => ({ ...prev, slug: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Identificador unico para URL. Ejemplo: <code>azul</code>.
            </p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Nombre"
              value={collectionForm.name}
              onChange={(event) =>
                setCollectionForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Nombre visible para cliente y para seleccionar en productos.
            </p>
            <p className="text-xs text-[#9a3412]">
              Si la coleccion ya tiene productos asociados, cambiar el nombre no actualiza
              automaticamente las remeras existentes.
            </p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Color HEX"
              value={collectionForm.colorHex}
              onChange={(event) =>
                setCollectionForm((prev) => ({ ...prev, colorHex: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Color principal de la coleccion en formato HEX. Ejemplo: <code>#2f4f77</code>.
            </p>
            {collectionForm.coverImageUrl ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-[#ece4d8] bg-[#f7f4ef]">
                <Image
                  src={collectionForm.coverImageUrl}
                  alt={collectionForm.name || "Portada de coleccion"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#cfc4b5] px-4 py-3 text-sm text-[#3c342d] transition-colors hover:bg-[#faf7f2]">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => void handleCollectionCoverUpload(event)}
              />
              {isUploadingCollectionCover ? "Subiendo portada..." : "Adjuntar portada desde tu compu"}
            </label>
            <p className="text-xs text-[#766d63]">
              La imagen se guarda en el servidor. Si completas el slug antes de subirla, se
              organiza dentro de la carpeta de esa coleccion.
            </p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="URL imagen portada"
              value={collectionForm.coverImageUrl}
              onChange={(event) =>
                setCollectionForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Ruta publica de la imagen portada. Tambien podes pegar una URL externa si hace falta.
            </p>
            <textarea
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Descripcion"
              rows={3}
              value={collectionForm.description}
              onChange={(event) =>
                setCollectionForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">Texto breve para comunicar estilo de la coleccion.</p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Orden"
              value={collectionForm.displayOrder}
              onChange={(event) =>
                setCollectionForm((prev) => ({ ...prev, displayOrder: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Numero entero para ordenar. Menor numero aparece primero.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={collectionForm.isActive}
                onChange={(event) =>
                  setCollectionForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Activa
            </label>
            <button
              type="button"
              className="rounded-lg bg-[#1f1b16] px-4 py-2 text-sm text-white disabled:opacity-70"
              onClick={saveCollection}
              disabled={isSavingCollection}
            >
              {isSavingCollection ? "Guardando..." : collectionForm.id ? "Actualizar coleccion" : "Crear coleccion"}
            </button>
          </div>
          </article>
        ) : null}

        {activeTab === "products" ? (
          <article className="rounded-2xl border border-[#ddd4c8] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-3xl">Remeras</h2>
              <button
                type="button"
                className="rounded-full border border-[#2d261f] px-4 py-1 text-xs uppercase tracking-[0.13em]"
                onClick={() => setProductForm(createEmptyProductForm())}
              >
                Nuevo
              </button>
            </div>

            {collectionOptions.length === 0 ? (
              <p className="mb-4 rounded-xl border border-[#f3d1bf] bg-[#fff4ed] px-4 py-3 text-sm text-[#9a3412]">
                Primero crea una coleccion para poder asociar nuevas remeras.
              </p>
            ) : null}

            <div className="mb-5 max-h-56 overflow-auto rounded-xl border border-[#ece4d8]">
              {catalogProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="flex w-full items-center justify-between border-b border-[#f4eee3] px-3 py-2 text-left text-sm hover:bg-[#faf7f2]"
                  onClick={() => setProductForm(mapProductToForm(product))}
                >
                  <span>{product.name}</span>
                  <span className={product.isActive ? "text-[#166534]" : "text-[#991b1b]"}>
                    {product.isActive ? "Activo" : "Inactivo"}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-3">
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Slug"
              value={productForm.slug}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, slug: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Identificador unico para URL. Ejemplo: <code>remera-basica-azul</code>.
            </p>
            {suggestedSlug ? (
              <p className="text-xs text-[#766d63]">
                Sugerido: <code>{suggestedSlug}</code>
              </p>
            ) : null}
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="SKU"
              value={productForm.sku}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, sku: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Codigo interno unico. Si lo dejas vacio o todavia no lo tocaste, se genera
              automaticamente con el formato <code>REM-AZU-001</code>.
            </p>
            {suggestedSku ? (
              <p className="text-xs text-[#766d63]">
                Sugerido: <code>{suggestedSku}</code>
              </p>
            ) : null}
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Nombre"
              value={productForm.name}
              onChange={(event) =>
                setProductForm((prev) =>
                  withSuggestedProductIdentifiers(
                    prev,
                    { ...prev, name: event.target.value },
                    catalogProducts,
                    catalogCollections
                  )
                )
              }
            />
            <p className="text-xs text-[#766d63]">Nombre comercial mostrado al cliente.</p>
            <select
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              value={productForm.category}
              onChange={(event) =>
                setProductForm((prev) =>
                  withSuggestedProductIdentifiers(
                    prev,
                    { ...prev, category: event.target.value },
                    catalogProducts,
                    catalogCollections
                  )
                )
              }
            >
              {productCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#766d63]">Categoria del producto. Por ahora solo remeras.</p>
            <select
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              value={productForm.collection}
              onChange={(event) =>
                setProductForm((prev) =>
                  withSuggestedProductIdentifiers(
                    prev,
                    { ...prev, collection: event.target.value },
                    catalogProducts,
                    catalogCollections
                  )
                )
              }
            >
              <option value="">Seleccionar coleccion</option>
              {collectionOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#766d63]">
              Coleccion por color. El desplegable se alimenta de las colecciones creadas.
            </p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Precio ARS"
              value={productForm.priceArs}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, priceArs: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Precio en pesos argentinos sin separadores. Ejemplo: <code>42000</code>.
            </p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Subtitulo"
              value={productForm.subtitle}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, subtitle: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">Bajada corta para cards y detalle de producto.</p>
            <textarea
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Descripcion"
              rows={3}
              value={productForm.description}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">Descripcion completa del producto.</p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Rating"
              value={productForm.rating}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, rating: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Valor numerico entre 0 y 5. Ejemplo: <code>4.7</code>.
            </p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Info de envio"
              value={productForm.shippingInfo}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, shippingInfo: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">Mensaje comercial de envio para PDP.</p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Tela y cuidados"
              value={productForm.fabricCare}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, fabricCare: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">Composicion de tela y cuidados de lavado.</p>
            <textarea
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder={"Talles (uno por linea)\nS\nM\nL"}
              rows={3}
              value={productForm.availableSizesText}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  availableSizesText: event.target.value
                }))
              }
            />
            <p className="text-xs text-[#766d63]">Un talle por linea. Ejemplo: S, M, L.</p>
            <div className="rounded-2xl border border-[#e5dbcf] bg-[#fcfaf7] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2b241d]">Variantes</p>
                  <p className="mt-1 text-xs text-[#766d63]">
                    Carga cada combinacion de tela y estampa por separado. Cada tarjeta tiene
                    sus propias imagenes para la PDP.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#2d261f] px-4 py-2 text-xs uppercase tracking-[0.13em]"
                  onClick={addProductVariant}
                >
                  Nueva variante
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {productForm.variants.map((variant, variantIndex) => {
                  const variantImages = splitLines(variant.imagesText);

                  return (
                    <div
                      key={variant.key}
                      className="rounded-2xl border border-[#e7ddd1] bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-[#7a7167]">
                            Variante {variantIndex + 1}
                          </p>
                          <p className="mt-1 text-sm text-[#5b5249]">
                            {variant.fabricColorName.trim() || "Tela"} / {variant.printColorName.trim() || "Estampa"}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-full border border-[#efc6bb] px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[#9a3412]"
                          onClick={() => removeProductVariant(variantIndex)}
                        >
                          Quitar variante
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="grid gap-3">
                          <input
                            className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
                            placeholder="Color de tela"
                            value={variant.fabricColorName}
                            onChange={(event) =>
                              updateProductVariant(variantIndex, (currentVariant) => ({
                                ...currentVariant,
                                fabricColorName: event.target.value
                              }))
                            }
                          />
                          <input
                            className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
                            placeholder="HEX tela"
                            value={variant.fabricColorHex}
                            onChange={(event) =>
                              updateProductVariant(variantIndex, (currentVariant) => ({
                                ...currentVariant,
                                fabricColorHex: event.target.value
                              }))
                            }
                          />
                          <p className="text-xs text-[#766d63]">
                            Ejemplo: <code>Negro</code> y <code>#111111</code>.
                          </p>
                        </div>

                        <div className="grid gap-3">
                          <input
                            className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
                            placeholder="Color de estampa"
                            value={variant.printColorName}
                            onChange={(event) =>
                              updateProductVariant(variantIndex, (currentVariant) => ({
                                ...currentVariant,
                                printColorName: event.target.value
                              }))
                            }
                          />
                          <input
                            className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
                            placeholder="HEX estampa"
                            value={variant.printColorHex}
                            onChange={(event) =>
                              updateProductVariant(variantIndex, (currentVariant) => ({
                                ...currentVariant,
                                printColorHex: event.target.value
                              }))
                            }
                          />
                          <p className="text-xs text-[#766d63]">
                            Ejemplo: <code>Blanco</code> y <code>#ffffff</code>.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#5b5249]">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#f6f1e8] px-3 py-1">
                          <span
                            className="h-3 w-3 rounded-full border border-black/10"
                            style={{ backgroundColor: variant.fabricColorHex || "#ffffff" }}
                          />
                          Tela: {variant.fabricColorName.trim() || "Sin nombre"}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#f6f1e8] px-3 py-1">
                          <span
                            className="h-3 w-3 rounded-full border border-black/10"
                            style={{ backgroundColor: variant.printColorHex || "#ffffff" }}
                          />
                          Estampa: {variant.printColorName.trim() || "Sin nombre"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#cfc4b5] px-4 py-3 text-sm text-[#3c342d] transition-colors hover:bg-[#faf7f2]">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            className="hidden"
                            onChange={(event) => void handleVariantImagesUpload(variantIndex, event)}
                          />
                          {isUploadingProductImages
                            ? "Subiendo imagenes..."
                            : "Adjuntar imagenes de esta variante"}
                        </label>
                        <p className="text-xs text-[#766d63]">
                          La primera imagen sera la portada de esta combinacion, la segunda se usa
                          para hover y el resto arma la galeria.
                        </p>
                      </div>

                      {variantImages.length > 0 ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {variantImages.map((image, imageIndex) => (
                            <div
                              key={`${variant.key}-${image}-${imageIndex}`}
                              className="rounded-xl border border-[#ece4d8] bg-[#faf7f2] p-3"
                            >
                              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[#f1ece4]">
                                <Image
                                  src={image}
                                  alt={`Imagen ${imageIndex + 1} de la variante ${variantIndex + 1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  className="object-cover"
                                />
                              </div>
                              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#7a7167]">
                                {imageIndex === 0 ? "Portada" : imageIndex === 1 ? "Hover" : `Galeria ${imageIndex - 1}`}
                              </p>
                              <p className="mt-1 truncate text-xs text-[#5b5249]">{image}</p>
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  className="rounded-full border border-[#d0c6b9] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#3c342d] disabled:opacity-40"
                                  onClick={() => moveVariantImage(variantIndex, imageIndex, -1)}
                                  disabled={imageIndex === 0}
                                >
                                  Subir
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full border border-[#d0c6b9] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#3c342d] disabled:opacity-40"
                                  onClick={() => moveVariantImage(variantIndex, imageIndex, 1)}
                                  disabled={imageIndex === variantImages.length - 1}
                                >
                                  Bajar
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full border border-[#efc6bb] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#9a3412]"
                                  onClick={() => removeVariantImage(variantIndex, imageIndex)}
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <textarea
                        className="mt-4 rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
                        placeholder={"Imagenes de esta variante (URL por linea)"}
                        rows={4}
                        value={variant.imagesText}
                        onChange={(event) =>
                          updateProductVariant(variantIndex, (currentVariant) => ({
                            ...currentVariant,
                            imagesText: event.target.value
                          }))
                        }
                      />
                      <p className="mt-2 text-xs text-[#766d63]">
                        Tambien podes pegar URLs manualmente si necesitas ajustar el orden o sumar
                        una imagen externa.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={productForm.isActive}
                onChange={(event) =>
                  setProductForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Activo
            </label>
            <button
              type="button"
              className="rounded-lg bg-[#1f1b16] px-4 py-2 text-sm text-white disabled:opacity-70"
              onClick={saveProduct}
              disabled={isSavingProduct || collectionOptions.length === 0}
            >
              {isSavingProduct ? "Guardando..." : productForm.id ? "Actualizar producto" : "Crear producto"}
            </button>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async (context) => {
  const session = await resolveAdminSession(context.req, context.res);

  if (!session) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false
      }
    };
  }

  try {
    const apiBase = getBackendApiBase();
    const [productsResponse, collectionsResponse] = await Promise.all([
      fetch(`${apiBase}/api/products?activeOnly=false&page=1&pageSize=500`),
      fetch(`${apiBase}/api/collections?activeOnly=false`)
    ]);

    if (!productsResponse.ok || !collectionsResponse.ok) {
      throw new Error("No se pudo obtener informacion desde backend");
    }

    const productsJson = (await productsResponse.json()) as { items: BackendProductDto[] };
    const collectionsJson = (await collectionsResponse.json()) as {
      items: BackendCollectionDto[];
    };

    return {
      props: {
        products: productsJson.items ?? [],
        collections: collectionsJson.items ?? [],
        apiError: null,
        adminEmail: session.email
      }
    };
  } catch (error) {
    return {
      props: {
        products: [],
        collections: [],
        apiError: error instanceof Error ? error.message : "Error desconocido",
        adminEmail: session.email
      }
    };
  }
};
