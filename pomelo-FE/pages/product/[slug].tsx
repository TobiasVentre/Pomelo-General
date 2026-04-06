import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import ProductGallery from "../../components/ProductGallery";
import ProductInfo from "../../components/ProductInfo";
import {
  mapBackendProductToUi,
  type BackendProductDto,
  type ProductItem
} from "../../lib/catalog-data";

interface ProductDetailPageProps {
  product: ProductItem;
}

function buildUniqueNames(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

export default function ProductDetailPage({
  product
}: ProductDetailPageProps): JSX.Element {
  const defaultVariant = product.variants[0];
  const [selectedFabricColor, setSelectedFabricColor] = useState(
    defaultVariant?.fabricColor.name ?? ""
  );
  const [selectedPrintColor, setSelectedPrintColor] = useState(
    defaultVariant?.printColor.name ?? ""
  );
  const availablePrintColors = useMemo(
    () =>
      buildUniqueNames(
        product.variants
          .filter((variant) => variant.fabricColor.name === selectedFabricColor)
          .map((variant) => variant.printColor.name)
      )
        .map(
          (printColorName) =>
            product.availablePrintColors.find((color) => color.name === printColorName) ??
            product.availablePrintColors[0]
        )
        .filter((color): color is NonNullable<(typeof product.availablePrintColors)[number]> => Boolean(color)),
    [product.availablePrintColors, product.variants, selectedFabricColor]
  );
  const activeVariant = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          variant.fabricColor.name === selectedFabricColor &&
          variant.printColor.name === selectedPrintColor
      ) ??
      product.variants.find((variant) => variant.fabricColor.name === selectedFabricColor) ??
      product.variants[0],
    [product.variants, selectedFabricColor, selectedPrintColor]
  );

  const handleFabricColorSelect = (nextFabricColor: string): void => {
    const variantsForFabricColor = product.variants.filter(
      (variant) => variant.fabricColor.name === nextFabricColor
    );
    const nextVariant =
      variantsForFabricColor.find((variant) => variant.printColor.name === selectedPrintColor) ??
      variantsForFabricColor[0] ??
      product.variants[0];

    if (!nextVariant) {
      return;
    }

    setSelectedFabricColor(nextVariant.fabricColor.name);
    setSelectedPrintColor(nextVariant.printColor.name);
  };

  const handlePrintColorSelect = (nextPrintColor: string): void => {
    const nextVariant =
      product.variants.find(
        (variant) =>
          variant.fabricColor.name === selectedFabricColor &&
          variant.printColor.name === nextPrintColor
      ) ??
      product.variants.find((variant) => variant.printColor.name === nextPrintColor) ??
      product.variants[0];

    if (!nextVariant) {
      return;
    }

    setSelectedFabricColor(nextVariant.fabricColor.name);
    setSelectedPrintColor(nextVariant.printColor.name);
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto mt-8 max-w-[1400px] px-5 md:mt-10 md:px-8">
        <Link href="/shop" className="text-xs uppercase tracking-[0.14em] text-[#6a6158]">
          Volver a tienda
        </Link>
      </section>

      <section className="mx-auto mb-20 mt-6 grid max-w-[1400px] gap-8 px-5 md:px-8 lg:grid-cols-[1.8fr_1fr] lg:gap-10">
        <ProductGallery name={product.name} images={activeVariant?.images ?? product.galleryImages} />
        <ProductInfo
          product={product}
          availableFabricColors={product.availableFabricColors}
          availablePrintColors={availablePrintColors}
          selectedFabricColor={selectedFabricColor}
          selectedPrintColor={selectedPrintColor}
          onSelectFabricColor={handleFabricColorSelect}
          onSelectPrintColor={handlePrintColorSelect}
          activeImage={activeVariant?.images[0] ?? product.thumbnail}
        />
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

  const apiBase =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:4000";

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
