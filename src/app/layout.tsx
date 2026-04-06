import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MotoDogs NFT - Bitcoin OpNet Presale',
  description: 'The most ALPHA dog NFT collection on Bitcoin OpNet. Join the pack. Ride or Die.',
  keywords: 'NFT, Bitcoin, OpNet, MotoDogs, Presale, Crypto, Dogs, Motorcycles',
  openGraph: {
    title: 'MotoDogs NFT - Bitcoin OpNet Presale',
    description: 'The most ALPHA dog NFT collection on Bitcoin OpNet',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
