import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "../context/cart-context";
import { navLinks } from "../lib/catalog-data";

function SearchIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.4-3.4" />
    </svg>
  );
}

function AccountIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c1.7-3.3 4.8-5 7.5-5s5.8 1.7 7.5 5" />
    </svg>
  );
}

function BagIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export default function Navbar(): JSX.Element {
  const router = useRouter();
  const { openCart, totalItems } = useCart();
  const darkText = router.pathname === "/shop" || router.pathname === "/product/[slug]";
  const textClass = darkText ? "text-[#1d1b18]" : "text-white";

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/30 border-b border-white/20">
      <div className={`mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-8 ${textClass}`}>
        <Link href="/" className="font-display text-3xl tracking-[0.14em]">
          POMELO
        </Link>

        <nav className="hidden items-center gap-7 text-sm uppercase tracking-[0.16em] md:flex">
          {navLinks.map((link) => {
            return (
              <Link
                key={link.label}
                href={link.href}
                className="transition-opacity duration-300 hover:opacity-65"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button type="button" aria-label="Buscar" className="transition-opacity duration-300 hover:opacity-65">
            <SearchIcon />
          </button>
          <button type="button" aria-label="Cuenta" className="transition-opacity duration-300 hover:opacity-65">
            <AccountIcon />
          </button>
          <button
            type="button"
            aria-label="Carrito"
            className="relative transition-opacity duration-300 hover:opacity-65"
            onClick={openCart}
          >
            <BagIcon />
            {totalItems > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] text-white">
                {totalItems}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
