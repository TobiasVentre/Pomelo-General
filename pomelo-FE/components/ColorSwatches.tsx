import type { ProductColor } from "../lib/catalog-data";

interface ColorSwatchesProps {
  colors: ProductColor[];
  selected: string;
  onSelect: (name: string) => void;
}

export default function ColorSwatches({
  colors,
  selected,
  onSelect
}: ColorSwatchesProps): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => onSelect(color.name)}
          className={`h-7 w-7 rounded-full border transition ${
            selected === color.name ? "border-black ring-1 ring-black" : "border-black/15"
          }`}
          style={{ backgroundColor: color.hex }}
          aria-label={`Color ${color.name}`}
          title={color.name}
        />
      ))}
    </div>
  );
}
