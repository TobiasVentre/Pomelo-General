import type { ProductItem } from "../lib/catalog-data";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: ProductItem[];
}

export default function ProductGrid({ products }: ProductGridProps): JSX.Element {
  return (
    <section className="mx-auto mb-20 mt-10 max-w-[1400px] px-5 md:px-8">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
