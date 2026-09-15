import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { ThemeToggle } from "@common/components/ThemeToggle";
import { THEME_COOKIE, parseThemeChoice } from "@common/lib/theme";
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
  // Tema elegido en el selector: el servidor lo pinta en <html> y no hay parpadeo. Sin cookie, sigue al sistema.
  const theme = parseThemeChoice((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="es" data-theme={theme === "system" ? undefined : theme}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ThemeToggle initial={theme} />
      </body>
    </html>
  );
}
