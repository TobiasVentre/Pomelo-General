import Image from "next/image";
import Link from "next/link";

interface PromoBannerProps {
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  offset?: boolean;
}

export default function PromoBanner({
  title,
  subtitle,
  cta,
  image,
  offset
}: PromoBannerProps): JSX.Element {
  return (
    <article
      className={`relative overflow-hidden ${
        offset ? "min-h-[520px] lg:mt-14" : "min-h-[520px]"
      }`}
    >
      <Image
        src={image}
        alt={title}
        fill
        loading="lazy"
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-8 text-white md:p-10">
        <h3 className="max-w-lg font-display text-4xl leading-tight md:text-5xl">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-sm text-white/85 md:text-base">{subtitle}</p>
        <Link
          href="/shop"
          className="mt-6 inline-block border-b border-white pb-1 text-xs uppercase tracking-[0.2em] transition-opacity duration-300 hover:opacity-70"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
