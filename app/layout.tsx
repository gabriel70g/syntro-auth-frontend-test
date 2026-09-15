import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyntroAuth · Seguridad grado bancario para tu login",
  description: "Un solo login para todas tus aplicaciones. Si tenés varios sistemas, tus usuarios entran una vez y se mueven entre ellos como si fueran uno solo.",
  icons: {
    icon: "/branding/syntropysoft-logo.png",
    apple: "/branding/syntropysoft-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // CSP con nonce: cada página se renderiza por pedido para que Next aplique el nonce de ese pedido.
  await connection();
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
