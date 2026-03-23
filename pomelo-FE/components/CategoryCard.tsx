import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  title: string;
  image: string;
}

export default function CategoryCard({
  title,
  image
}: CategoryCardProps): JSX.Element {
  return (
    <Link href="/shop" className="group block">
      <article>
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
          <Image
            src={image}
            alt={title}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        <h3 className="mt-4 font-display text-3xl">{title}</h3>
      </article>
    </Link>
  );
}
