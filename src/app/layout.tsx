import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Parisienne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://convite-juliane-15.vercel.app"),
  title: "Juliane 15 Anos | Uma Noite Estrelada",
  description:
    "Você é nosso convidado para celebrar os 15 anos de Juliane em uma noite inesquecível.",
  openGraph: {
    title: "Juliane 15 Anos | Uma Noite Estrelada",
    description:
      "Toque no cartão virtual para abrir o convite da Juliane.",
    type: "website",
    url: "/convite",
    images: [
      {
        url: "/images/cartao-abrir-convite-juliane-v1.png",
        width: 1080,
        height: 1920,
        alt: "Cartão virtual Juliane 15 anos com botão Abrir Convite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Juliane 15 Anos | Uma Noite Estrelada",
    description: "Toque no cartão virtual para abrir o convite da Juliane.",
    images: ["/images/cartao-abrir-convite-juliane-v1.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${cormorant.variable} ${parisienne.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
