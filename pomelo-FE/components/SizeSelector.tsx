interface SizeSelectorProps {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
}

export default function SizeSelector({
  sizes,
  selected,
  onSelect
}: SizeSelectorProps): JSX.Element {
  return (
    <div className="grid grid-cols-4 gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onSelect(size)}
          className={`border px-3 py-2 text-sm transition ${
            selected === size
              ? "border-black bg-black text-white"
              : "border-black/20 bg-white text-[#1d1b18] hover:border-black/55"
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
