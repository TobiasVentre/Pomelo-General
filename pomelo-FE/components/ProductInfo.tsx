import { useMemo, useState } from "react";
import { formatArs, type ProductItem } from "../lib/catalog-data";
import { useCart } from "../context/cart-context";
import AddToBagButton from "./AddToBagButton";
import ColorSwatches from "./ColorSwatches";
import SizeSelector from "./SizeSelector";

interface ProductInfoProps {
  product: ProductItem;
}

export default function ProductInfo({ product }: ProductInfoProps): JSX.Element {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState(product.availableColors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState(product.availableSizes[0] ?? "");

  const selectedColorHex = useMemo(
    () => product.availableColors.find((color) => color.name === selectedColor)?.hex,
    [product.availableColors, selectedColor]
  );

  return (
    <aside className="top-24 h-fit border border-black/10 bg-white p-6 lg:sticky lg:p-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7167]">{product.category}</p>
      <h1 className="mt-2 font-display text-4xl leading-tight">{product.name}</h1>
      <p className="mt-1 text-sm text-[#6a6158]">{product.subtitle}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#6a6158]">
        Coleccion: {product.collection}
      </p>
      <p className="mt-4 text-lg">{formatArs(product.priceArs)}</p>

      <div className="mt-7 space-y-3">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6a6158]">
          Color: {selectedColor}
        </p>
        <ColorSwatches
          colors={product.availableColors}
          selected={selectedColor}
          onSelect={setSelectedColor}
        />
        {selectedColorHex ? (
          <p className="text-xs text-[#6a6158]">Muestra: {selectedColorHex}</p>
        ) : null}
      </div>

      <div className="mt-7 space-y-3">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6a6158]">
          Talle: {selectedSize}
        </p>
        <SizeSelector
          sizes={product.availableSizes}
          selected={selectedSize}
          onSelect={setSelectedSize}
        />
      </div>

      <div className="mt-7">
        <AddToBagButton
          onClick={() =>
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceArs: product.priceArs,
              color: selectedColor,
              size: selectedSize,
              image: product.thumbnail
            })
          }
        />
      </div>

      <div className="mt-7 border-t border-black/10 pt-6 text-sm leading-relaxed text-[#4f4740]">
        <p>{product.description}</p>
      </div>

      <div className="mt-6 space-y-3">
        <details className="group border-t border-black/10 pt-3" open>
          <summary className="cursor-pointer text-sm uppercase tracking-[0.12em]">
            Envio
          </summary>
          <p className="mt-3 text-sm text-[#4f4740]">{product.shippingInfo}</p>
        </details>
        <details className="group border-t border-black/10 pt-3">
          <summary className="cursor-pointer text-sm uppercase tracking-[0.12em]">
            Tela y cuidados
          </summary>
          <p className="mt-3 text-sm text-[#4f4740]">{product.fabricCare}</p>
        </details>
      </div>
    </aside>
  );
}
