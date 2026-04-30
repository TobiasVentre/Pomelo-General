import type { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import CategorySlider from "../components/CategorySlider";
import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
import {
  buildSliderCategoriesFromApi,
  mapBackendProductToUi,
  type BackendCollectionDto,
  type BackendProductDto,
  type CategoryItem,
  type ProductItem
} from "../lib/catalog-data";
import { getBackendApiBase } from "../lib/backend-api";

interface ShopPageProps {
  initialProducts: ProductItem[];
  initialCategories: CategoryItem[];
  apiError: string | null;
}

export default function ShopPage({
  initialProducts,
  initialCategories,
  apiError
}: ShopPageProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategories[0]?.name ?? "Todas"
  );
  const filteredProducts = useMemo(
    () =>
      initialProducts.filter((product) =>
        selectedCategory === "Todas" ? true : product.collection === selectedCategory
      ),
    [initialProducts, selectedCategory]
  );

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto mt-10 max-w-[1400px] px-5 md:mt-14 md:px-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[#7a7167]">
          Ropa
        </p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl">Todas las colecciones</h1>
      </section>

      {initialCategories.length > 0 ? (
        <CategorySlider
          categories={initialCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      ) : null}

      {apiError ? (
        <section className="mx-auto mt-6 max-w-[1400px] px-5 md:px-8">
          <p className="text-sm text-[#9a3412]">
            No se pudo conectar con la API: {apiError}
          </p>
        </section>
      ) : null}

      <ProductGrid products={filteredProducts} />
      {filteredProducts.length === 0 ? (
        <section className="mx-auto mb-20 max-w-[1400px] px-5 md:px-8">
          <p className="text-sm text-[#6a6158]">
            No hay productos para la coleccion seleccionada.
          </p>
        </section>
      ) : null}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<ShopPageProps> = async () => {
  const apiBase = getBackendApiBase();

  try {
    const [collectionsResponse, productsResponse] = await Promise.all([
      fetch(`${apiBase}/api/collections`),
      fetch(`${apiBase}/api/products?activeOnly=true&page=1&pageSize=200`)
    ]);

    if (!collectionsResponse.ok || !productsResponse.ok) {
      throw new Error("Failed to fetch API data");
    }

    const collectionsJson = (await collectionsResponse.json()) as {
      items: BackendCollectionDto[];
    };
    const productsJson = (await productsResponse.json()) as {
      items: BackendProductDto[];
    };

    const mappedProducts =
      productsJson.items?.map((item, index) => mapBackendProductToUi(item, index)) ?? [];
    const mappedCategories = buildSliderCategoriesFromApi(collectionsJson.items ?? []);
    return {
      props: {
        initialProducts: mappedProducts,
        initialCategories: mappedCategories,
        apiError: null
      }
    };
  } catch (error) {
    return {
      props: {
        initialProducts: [],
        initialCategories: [],
        apiError: error instanceof Error ? error.message : "Error desconocido"
      }
    };
  }
};
