import Image from "next/image";

interface ProductGalleryProps {
  name: string;
  images: string[];
  activeImage?: string;
}

export default function ProductGallery({
  name,
  images,
  activeImage
}: ProductGalleryProps): JSX.Element {
  const displayImages = activeImage ? [activeImage, ...images.slice(1)] : images;

  return (
    <section className="grid gap-6">
      {displayImages.map((image, index) => (
        <div key={`${name}-${index}`} className="relative aspect-[3/4] overflow-hidden bg-[#f2efe9]">
          <Image
            src={image}
            alt={`${name} view ${index + 1}`}
            fill
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover"
          />
        </div>
      ))}
    </section>
  );
}
