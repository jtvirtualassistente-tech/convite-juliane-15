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
  title: "Juliane 15 Anos | Uma Noite Estrelada",
  description:
    "Voce e nosso convidado para celebrar os 15 anos de Juliane em uma noite inesquecivel.",
  openGraph: {
    title: "Juliane 15 Anos | Uma Noite Estrelada",
    description:
      "Sob a luz das estrelas, um sonho esta prestes a se tornar realidade.",
    type: "website",
    images: ["/images/convite-estrelado-mobile.png"],
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
