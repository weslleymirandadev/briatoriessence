import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/contexts/CartContext";
import { NotifyProvider } from "@/components/contexts/NotifyContext";

export const metadata: Metadata = {
  title: "Briatori Essense - Perfumaria Online",
  description: "A sua essência à um clique de distância",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning={true}>
      <body className="antialiased">
        <CartProvider>
          <NotifyProvider>{children}</NotifyProvider>
        </CartProvider>
      </body>
    </html>
  );
}
