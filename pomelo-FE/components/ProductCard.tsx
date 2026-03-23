import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatArs, type ProductItem } from "../lib/catalog-data";

interface ProductCardProps {
  product: ProductItem;
}

function Stars({ value }: { value: number }): JSX.Element {
  return (
    <div className="flex gap-0.5 text-[#1d1b18]">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < value ? "opacity-100" : "opacity-25"}>
          *
        </span>
      ))}
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const imageToShow = hovered && product.hoverImage ? product.hoverImage : product.thumbnail;

  return (
    <Link href={`/product/${product.slug}`} className="block">
      <article
        className="group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f2efe9]">
          <Image
            src={imageToShow}
            alt={product.name}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="text-base">{product.name}</h3>
          <p className="text-sm text-[#4e4841]">{formatArs(product.priceArs)}</p>
          <Stars value={product.rating} />

          {product.availableColors.length > 0 ? (
            <div className="mt-1 flex gap-1.5">
              {product.availableColors.map((color) => (
                <span
                  key={`${product.id}-${color.hex}`}
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
