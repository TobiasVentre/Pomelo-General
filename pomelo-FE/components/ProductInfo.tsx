import { useEffect, useMemo, useState } from "react";
import { formatArs, type ProductItem } from "../lib/catalog-data";
import { useCart } from "../context/cart-context";
import AddToBagButton from "./AddToBagButton";
import ColorSwatches from "./ColorSwatches";
import SizeSelector from "./SizeSelector";

interface ProductInfoProps {
  product: ProductItem;
  onComboChange?: (image: string | null) => void;
}

export default function ProductInfo({ product, onComboChange }: ProductInfoProps): JSX.Element {
  const { addItem } = useCart();
  const combos = product.colorCombos ?? [];
  const hasColorCombos = combos.length > 0;

  // — single-color mode (no combos) —
  const [selectedColor, setSelectedColor] = useState(product.availableColors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState(product.availableSizes[0] ?? "");

  // — combo mode —
  const [selectedShirt, setSelectedShirt] = useState(combos[0]?.shirtColor.name ?? "");
  const [selectedPrint, setSelectedPrint] = useState(combos[0]?.printColor.name ?? "");

  const shirtColors = useMemo(
    () => [...new Map(combos.map((c) => [c.shirtColor.name, c.shirtColor])).values()],
    [combos]
  );

  const availablePrintColors = useMemo(
    () => combos.filter((c) => c.shirtColor.name === selectedShirt).map((c) => c.printColor),
    [combos, selectedShirt]
  );

  const activeCombo = useMemo(
    () => combos.find((c) => c.shirtColor.name === selectedShirt && c.printColor.name === selectedPrint),
    [combos, selectedShirt, selectedPrint]
  );

  // When shirt color changes, auto-select first available print color
  useEffect(() => {
    const first = availablePrintColors[0]?.name;
    if (first) setSelectedPrint(first);
  }, [selectedShirt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent whenever active combo image changes
  useEffect(() => {
    if (!hasColorCombos || !onComboChange) return;
    onComboChange(activeCombo?.image ?? null);
  }, [activeCombo, hasColorCombos, onComboChange]);

  const cartColor = hasColorCombos
    ? `${selectedShirt} / ${selectedPrint}`
    : selectedColor;

  return (
    <aside className="top-24 h-fit border border-black/10 bg-white p-6 lg:sticky lg:p-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7167]">{product.category}</p>
      <h1 className="mt-2 font-display text-4xl leading-tight">{product.name}</h1>
      <p className="mt-1 text-sm text-[#6a6158]">{product.subtitle}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#6a6158]">
        Coleccion: {product.collection}
      </p>
      <p className="mt-4 text-lg">{formatArs(product.priceArs)}</p>

      {hasColorCombos ? (
        <>
          <div className="mt-7 space-y-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[#6a6158]">
              Color remera: {selectedShirt}
            </p>
            <ColorSwatches
              colors={shirtColors}
              selected={selectedShirt}
              onSelect={setSelectedShirt}
            />
          </div>
          <div className="mt-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[#6a6158]">
              Color estampa: {selectedPrint}
            </p>
            <ColorSwatches
              colors={availablePrintColors}
              selected={selectedPrint}
              onSelect={setSelectedPrint}
            />
          </div>
        </>
      ) : (
        <div className="mt-7 space-y-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[#6a6158]">
            Color: {selectedColor}
          </p>
          <ColorSwatches
            colors={product.availableColors}
            selected={selectedColor}
            onSelect={setSelectedColor}
          />
        </div>
      )}

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
              color: cartColor,
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
