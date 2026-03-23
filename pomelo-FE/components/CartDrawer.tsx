import Image from "next/image";
import { formatArs } from "../lib/catalog-data";
import { useCart } from "../context/cart-context";

export default function CartDrawer(): JSX.Element {
  const {
    items,
    isOpen,
    closeCart,
    increase,
    decrease,
    clear,
    subtotalArs,
    shippingArs,
    totalArs,
    checkoutWhatsapp
  } = useCart();

  if (!isOpen) {
    return <></>;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45"
      role="presentation"
      onClick={closeCart}
    >
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white p-5 shadow-2xl md:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <h2 className="font-display text-3xl">Carrito</h2>
          <button
            type="button"
            onClick={closeCart}
            className="text-xs uppercase tracking-[0.14em] text-[#6a6158]"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 max-h-[52vh] space-y-4 overflow-auto pr-1">
          {items.length === 0 ? (
            <p className="text-sm text-[#6a6158]">Todavia no agregaste productos.</p>
          ) : (
            items.map((item) => (
              <article key={item.key} className="flex gap-3 border-b border-black/10 pb-4">
                <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden bg-[#f2efe9]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm">{item.name}</h3>
                  <p className="mt-1 text-xs text-[#6a6158]">
                    {item.color} / {item.size}
                  </p>
                  <p className="mt-1 text-sm">{formatArs(item.priceArs)}</p>
                  <div className="mt-2 inline-flex items-center border border-black/20">
                    <button
                      type="button"
                      className="px-2 py-1 text-sm"
                      onClick={() => decrease(item.key)}
                    >
                      -
                    </button>
                    <span className="px-2 text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-2 py-1 text-sm"
                      onClick={() => increase(item.key)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 border-t border-black/10 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <strong>{formatArs(subtotalArs)}</strong>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Envio (mock)</span>
            <strong>{formatArs(shippingArs)}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-base">
            <span>Total</span>
            <strong>{formatArs(totalArs)}</strong>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            className="w-full border border-black bg-black px-4 py-3 text-xs uppercase tracking-[0.14em] text-white disabled:opacity-50"
            disabled={items.length === 0}
            onClick={checkoutWhatsapp}
          >
            Finalizar por WhatsApp
          </button>
          <button
            type="button"
            className="w-full border border-black/20 px-4 py-3 text-xs uppercase tracking-[0.14em] text-[#4f4740] disabled:opacity-50"
            disabled={items.length === 0}
            onClick={clear}
          >
            Vaciar carrito
          </button>
        </div>
      </aside>
    </div>
  );
}
