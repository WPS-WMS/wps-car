import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'WPS Car — Gestão de revenda',
  description: 'SaaS para gestão de estoque e vendas de veículos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)}>
      <body
        className={`${inter.variable} min-h-screen bg-page-gradient font-sans antialiased text-brand-950`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
