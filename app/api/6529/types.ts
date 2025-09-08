export interface MemeCard {
  id: number;
  season: number;
  card_number: number;
  name: string;
  artist: string;
  image: string;
  thumbnail?: string;
  floor_price: number;
  highest_offer: number;
  total_supply: number;
  unique_owners: number;
  volume_24h: number;
  volume_7d: number;
  listed_count: number;
  last_sales?: any[];
}

export interface CollectionStats {
  total_memes: number;
  total_collectors: number;
  total_volume: number;
  floor_price: number;
  market_cap: number;
}

export interface WalletData {
  address: string;
  ens: string | null;
  ownedMemes: number[];
  totalOwned: number;
  lastChecked: string;
}