import Image from "next/image";
import type { CategoryItem } from "../lib/catalog-data";

interface CategorySliderProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategorySlider({
  categories,
  selectedCategory,
  onSelectCategory
}: CategorySliderProps): JSX.Element {
  return (
    <section className="mx-auto mt-10 max-w-[1400px] px-5 md:px-8">
      <div className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <button
            key={category.name}
            type="button"
            className="min-w-[132px] flex-shrink-0 text-left"
            onClick={() => onSelectCategory(category.name)}
          >
            <div
              className={`relative h-28 w-full overflow-hidden rounded-sm border transition ${
                selectedCategory === category.name
                  ? "border-black"
                  : "border-transparent"
              }`}
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                loading="lazy"
                sizes="132px"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <p className="mt-2 text-sm uppercase tracking-[0.1em] text-[#3f3b36]">
              {category.name}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
