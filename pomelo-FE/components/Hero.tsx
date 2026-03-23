import Image from "next/image";
import Link from "next/link";

export default function Hero(): JSX.Element {
  return (
    <section className="relative -mt-[73px] min-h-screen overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=2200&q=85"
        alt="Portada editorial de moda"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/5" />

      <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-end px-5 pb-20 pt-32 md:px-8">
        <div className="max-w-xl text-white">
          <p className="mb-4 text-xs uppercase tracking-[0.24em] text-white/80">
            Primavera 2026
          </p>
          <h1 className="font-display text-5xl leading-[0.94] md:text-7xl">
            Lujo sutil para un guardarropa moderno.
          </h1>
          <p className="mt-5 max-w-md text-base text-white/85 md:text-lg">
            Siluetas refinadas, texturas suaves y esenciales elevados para todos
            los dias.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-block border-b border-white pb-1 text-xs uppercase tracking-[0.2em] transition-opacity duration-300 hover:opacity-70"
          >
            Comprar ropa
          </Link>
        </div>
      </div>
    </section>
  );
}
