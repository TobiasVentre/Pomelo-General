import type { GetServerSideProps } from "next";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import ProductGallery from "../../components/ProductGallery";
import ProductInfo from "../../components/ProductInfo";
import {
  mapBackendProductToUi,
  type BackendProductDto,
  type ProductItem
} from "../../lib/catalog-data";
import { getBackendApiBase } from "../../lib/backend-api";

interface ProductDetailPageProps {
  product: ProductItem;
}

export default function ProductDetailPage({
  product
}: ProductDetailPageProps): JSX.Element {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto mt-8 max-w-[1400px] px-5 md:mt-10 md:px-8">
        <Link href="/shop" className="text-xs uppercase tracking-[0.14em] text-[#6a6158]">
          Volver a tienda
        </Link>
      </section>

      <section className="mx-auto mb-20 mt-6 grid max-w-[1400px] gap-8 px-5 md:px-8 lg:grid-cols-[1.8fr_1fr] lg:gap-10">
        <ProductGallery name={product.name} images={product.galleryImages} />
        <ProductInfo product={product} />
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<ProductDetailPageProps> = async (
  context
) => {
  const slug = context.params?.slug;
  if (typeof slug !== "string") {
    return { notFound: true };
  }

  const apiBase = getBackendApiBase();

  try {
    const response = await fetch(`${apiBase}/api/products/${slug}`);
    if (!response.ok) {
      return { notFound: true };
    }

    const apiProduct = (await response.json()) as BackendProductDto;
    return {
      props: {
        product: mapBackendProductToUi(apiProduct, 0)
      }
    };
  } catch {
    return { notFound: true };
  }
};
