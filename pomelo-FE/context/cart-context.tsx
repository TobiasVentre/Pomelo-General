import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { formatArs } from "../lib/catalog-data";

const STORAGE_KEY = "pomelo_carrito";
const WHATSAPP_PHONE = "5491112345678";
const ENVIO_MOCK_ARS = 3500;

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  priceArs: number;
  fabricColor: string;
  printColor: string;
  size: string;
  image: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  subtotalArs: number;
  shippingArs: number;
  totalArs: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "key" | "quantity">) => void;
  increase: (key: string) => void;
  decrease: (key: string) => void;
  clear: () => void;
  checkoutWhatsapp: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeStoredCartItem(value: unknown): CartItem | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Record<string, unknown>;
  const legacyColor = readString(item.color);
  const fabricColor = readString(item.fabricColor) ?? legacyColor;
  const printColor = readString(item.printColor) ?? legacyColor;
  const productId = readString(item.productId);
  const slug = readString(item.slug);
  const name = readString(item.name);
  const size = readString(item.size);
  const image = readString(item.image);
  const key = readString(item.key);
  const priceArs = typeof item.priceArs === "number" ? item.priceArs : null;
  const quantity = typeof item.quantity === "number" ? item.quantity : null;

  if (
    !productId ||
    !slug ||
    !name ||
    !fabricColor ||
    !printColor ||
    !size ||
    !image ||
    !key ||
    priceArs === null ||
    quantity === null
  ) {
    return null;
  }

  return {
    key,
    productId,
    slug,
    name,
    priceArs,
    fabricColor,
    printColor,
    size,
    image,
    quantity
  };
}

export function CartProvider({ children }: { children: ReactNode }): JSX.Element {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setItems(parsed.map((item) => normalizeStoredCartItem(item)).filter((item): item is CartItem => item !== null));
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const subtotalArs = useMemo(
    () => items.reduce((sum, item) => sum + item.priceArs * item.quantity, 0),
    [items]
  );
  const shippingArs = items.length > 0 ? ENVIO_MOCK_ARS : 0;
  const totalArs = subtotalArs + shippingArs;
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const addItem = (item: Omit<CartItem, "key" | "quantity">): void => {
    const key = `${item.productId}-${item.fabricColor}-${item.printColor}-${item.size}`;
    setItems((prev) => {
      const found = prev.find((current) => current.key === key);
      if (found) {
        return prev.map((current) =>
          current.key === key
            ? { ...current, quantity: current.quantity + 1 }
            : current
        );
      }
      return [...prev, { ...item, key, quantity: 1 }];
    });
    setIsOpen(true);
  };

  const increase = (key: string): void => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrease = (key: string): void => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clear = (): void => {
    setItems([]);
  };

  const checkoutWhatsapp = (): void => {
    if (items.length === 0 || typeof window === "undefined") {
      return;
    }

    const lines = items.map(
      (item) =>
        `- ${item.name} | Tela: ${item.fabricColor} | Estampa: ${item.printColor} | Talle: ${item.size} | Cantidad: ${item.quantity} | Subtotal: ${formatArs(item.priceArs * item.quantity)}`
    );
    const message = [
      "Hola! Quiero realizar este pedido:",
      ...lines,
      `Envio (mock): ${formatArs(shippingArs)}`,
      `Total estimado: ${formatArs(totalArs)}`
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalItems,
        subtotalArs,
        shippingArs,
        totalArs,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        increase,
        decrease,
        clear,
        checkoutWhatsapp
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return ctx;
}
