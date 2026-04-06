export interface MotoDog {
  id: number;
  name: string;
  title: string;
  image: string;
  rarity: string;
  available: number;
}

export const PRESALE_WALLET = 'bc1pjn2r3t8n5q7ehq7qk5406asleez2w36v4wppsnrk47jl0vty9vjqdw44cy';

export const COLLECTION_STATS = {
  totalSupply: 7777,
  price: 0.00007442,
  airdropPerNFT: 2000,
  airdropDate: '2026-05-22T00:00:00Z'
};

export const MOTODOGS: MotoDog[] = [
  {
    id: 1,
    name: 'Diesel Duke',
    title: 'The OG Bulldog',
    image: '/nfts/motodog1.png',
    rarity: 'Legendary',
    available: 1111
  },
  {
    id: 2,
    name: 'Midnight Howler',
    title: 'Dark Web Drifter',
    image: '/nfts/motodog2.png',
    rarity: 'Epic',
    available: 1111
  },
  {
    id: 3,
    name: 'Tiny Thunder',
    title: 'Lambo Chihuahua',
    image: '/nfts/motodog3.png',
    rarity: 'Rare',
    available: 1111
  },
  {
    id: 4,
    name: 'Beach Barker',
    title: 'DeFi Golden',
    image: '/nfts/motodog4.png',
    rarity: 'Epic',
    available: 1111
  },
  {
    id: 5,
    name: 'Rosa Rocket',
    title: 'Protocol Poodle',
    image: '/nfts/motodog5.png',
    rarity: 'Legendary',
    available: 1112
  },
  {
    id: 6,
    name: 'Shadow Strider',
    title: 'Silent Husky',
    image: '/nfts/motodog6.png',
    rarity: 'Epic',
    available: 1111
  },
  {
    id: 7,
    name: 'Duke Jr.',
    title: 'Rust Master',
    image: '/nfts/motodog7.png',
    rarity: 'Rare',
    available: 1111
  }
];
