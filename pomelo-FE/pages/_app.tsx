import type { AppProps } from "next/app";
import { Cormorant_Garamond, Inter } from "next/font/google";
import CartDrawer from "../components/CartDrawer";
import { CartProvider } from "../context/cart-context";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"]
});

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <CartProvider>
      <div
        className={`${inter.variable} ${cormorant.variable} min-h-screen bg-[#f8f6f2] font-sans text-[#1d1b18] antialiased`}
      >
        <Component {...pageProps} />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
