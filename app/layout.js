import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Stock Easy — Smart Pharmacy Stock Management',
  description: 'FEFO-driven medicine stock management SaaS for small pharmacies. Reduce expiry waste, automate billing, get AI-powered insights.',
  keywords: 'pharmacy, stock management, FEFO, medicine expiry, billing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
