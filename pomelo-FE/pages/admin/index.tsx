import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import { resolveAdminSession } from "../../lib/admin-session";
import { getBackendApiBase } from "../../lib/backend-api";
import type { BackendCollectionDto, BackendProductDto } from "../../lib/catalog-data";

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
  availableColorsText: string;
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

const emptyProductForm: ProductFormState = {
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
  availableColorsText: "",
  imagesText: ""
};

const productCategoryOptions = ["Remeras"];

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseColorLines(value: string): Array<{ name: string; hex: string }> {
  return splitLines(value)
    .map((line) => {
      const [name, hex] = line.split("|").map((part) => part.trim());
      if (!name || !hex) {
        return null;
      }
      return { name, hex };
    })
    .filter((item): item is { name: string; hex: string } => item !== null);
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
    availableColorsText: product.availableColors
      .map((color) => `${color.name}|${color.hex}`)
      .join("\n"),
    imagesText: product.images.join("\n")
  };
}

export default function AdminPage({
  products,
  collections,
  apiError,
  adminEmail
}: AdminPageProps): JSX.Element {
  const router = useRouter();
  const collectionOptions = Array.from(new Set(collections.map((collection) => collection.name)));
  const [collectionForm, setCollectionForm] = useState<CollectionFormState>(emptyCollectionForm);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [message, setMessage] = useState<string>("");
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = (await response.json()) as { message?: string; details?: string[] };
      setMessage(`Error guardando coleccion: ${error.message ?? "desconocido"}`);
      setIsSavingCollection(false);
      return;
    }
    setMessage("Coleccion guardada correctamente.");
    setCollectionForm(emptyCollectionForm);
    setIsSavingCollection(false);
    await router.replace(router.asPath);
  };

  const saveProduct = async (): Promise<void> => {
    setIsSavingProduct(true);
    setMessage("");

    const payload = {
      slug: productForm.slug.trim(),
      sku: productForm.sku.trim(),
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
      availableColors: parseColorLines(productForm.availableColorsText),
      images: splitLines(productForm.imagesText)
    };

    const endpoint = productForm.id
      ? `/api/admin/products/${productForm.id}`
      : "/api/admin/products";
    const method = productForm.id ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = (await response.json()) as { message?: string; details?: string[] };
      setMessage(`Error guardando producto: ${error.message ?? "desconocido"}`);
      setIsSavingProduct(false);
      return;
    }

    setMessage("Producto guardado correctamente.");
    setProductForm(emptyProductForm);
    setIsSavingProduct(false);
    await router.replace(router.asPath);
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
              Gestiona colecciones, productos, colores y talles. La desactivacion se
              realiza marcando el producto o coleccion como inactivo.
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
        {message ? <p className="mt-4 text-sm text-[#1d4d2e]">{message}</p> : null}
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-8 px-5 pb-20 md:px-8 lg:grid-cols-2">
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
            {collections.map((collection) => (
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
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="URL imagen portada"
              value={collectionForm.coverImageUrl}
              onChange={(event) =>
                setCollectionForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">
              URL publica de imagen que se usara como portada de coleccion.
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

        <article className="rounded-2xl border border-[#ddd4c8] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-3xl">Productos</h2>
            <button
              type="button"
              className="rounded-full border border-[#2d261f] px-4 py-1 text-xs uppercase tracking-[0.13em]"
              onClick={() => setProductForm(emptyProductForm)}
            >
              Nuevo
            </button>
          </div>

          <div className="mb-5 max-h-56 overflow-auto rounded-xl border border-[#ece4d8]">
            {products.map((product) => (
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
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="SKU"
              value={productForm.sku}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, sku: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">Codigo interno unico para gestionar el producto.</p>
            <input
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder="Nombre"
              value={productForm.name}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">Nombre comercial mostrado al cliente.</p>
            <select
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              value={productForm.category}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, category: event.target.value }))
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
                setProductForm((prev) => ({ ...prev, collection: event.target.value }))
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
            <textarea
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder={"Colores (Nombre|#hex por linea)\nBeige|#d5c6ac"}
              rows={3}
              value={productForm.availableColorsText}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  availableColorsText: event.target.value
                }))
              }
            />
            <p className="text-xs text-[#766d63]">
              Formato exacto: <code>Nombre|#hex</code> en cada linea.
            </p>
            <textarea
              className="rounded-lg border border-[#d9d0c3] px-3 py-2 text-sm"
              placeholder={"Imagenes (URL por linea)"}
              rows={3}
              value={productForm.imagesText}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, imagesText: event.target.value }))
              }
            />
            <p className="text-xs text-[#766d63]">Una URL por linea. La primera sera imagen principal.</p>
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
              disabled={isSavingProduct}
            >
              {isSavingProduct ? "Guardando..." : productForm.id ? "Actualizar producto" : "Crear producto"}
            </button>
          </div>
        </article>
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
