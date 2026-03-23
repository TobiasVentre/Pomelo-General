import type { GetServerSideProps } from "next";
import CategoryCard from "../components/CategoryCard";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import PromoBanner from "../components/PromoBanner";
import {
  buildFeaturedCategoriesFromApi,
  buildPromosFromApi,
  type BackendCollectionDto,
  type CategoryItem,
  type PromoItem
} from "../lib/catalog-data";

interface LandingPageProps {
  featuredCategories: CategoryItem[];
  promoBanners: PromoItem[];
  apiError: string | null;
}

export default function LandingPage({
  featuredCategories,
  promoBanners,
  apiError
}: LandingPageProps): JSX.Element {
  return (
    <main>
      <Navbar />
      <Hero />

      <section className="mx-auto mt-20 max-w-[1400px] px-5 md:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-4xl md:text-5xl">Categorias destacadas</h2>
        </div>
        {apiError ? (
          <p className="mb-6 text-sm text-[#9a3412]">
            No se pudo conectar con la API: {apiError}
          </p>
        ) : null}
        <div className="grid gap-6 md:grid-cols-3">
          {featuredCategories.map((category) => (
            <CategoryCard
              key={category.name}
              title={category.name}
              image={category.image}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto mb-24 mt-20 max-w-[1400px] px-5 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {promoBanners.map((banner, index) => (
            <PromoBanner
              key={banner.title}
              title={banner.title}
              subtitle={banner.subtitle}
              cta={banner.cta}
              image={banner.image}
              offset={index === 1}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<LandingPageProps> = async () => {
  const apiBase =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:4000";

  try {
    const response = await fetch(`${apiBase}/api/collections?activeOnly=true`);
    if (!response.ok) {
      throw new Error("No se pudieron obtener colecciones");
    }

    const data = (await response.json()) as { items: BackendCollectionDto[] };
    return {
      props: {
        featuredCategories: buildFeaturedCategoriesFromApi(data.items ?? []),
        promoBanners: buildPromosFromApi(data.items ?? []),
        apiError: null
      }
    };
  } catch (error) {
    return {
      props: {
        featuredCategories: [],
        promoBanners: [],
        apiError: error instanceof Error ? error.message : "Error desconocido"
      }
    };
  }
};
