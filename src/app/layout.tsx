import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { Belleza, Alegreya } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const fontBelleza = Belleza({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-belleza",
})

const fontAlegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
})

export const metadata: Metadata = {
  title: 'SheRide - Safe Rides for Women',
  description: 'A non-commercial, women-only ride-pairing platform for safety and comfort.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-body antialiased",
        fontBelleza.variable,
        fontAlegreya.variable
      )}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
