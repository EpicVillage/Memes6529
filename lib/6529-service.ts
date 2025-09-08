import { MemeCard, CollectionStats } from '@/app/api/6529/types';

const SEIZE_API_BASE = 'https://api.seize.io/api';
const CONTRACT_ADDRESS = '0x33FD426905F149f8376e227d0C9D3340AaD17aF1';
const ETHEREUM_RPC = 'https://eth.llamarpc.com';

export class SixFiveTwoNineService {
  private static instance: SixFiveTwoNineService;

  private constructor() {}

  static getInstance(): SixFiveTwoNineService {
    if (!SixFiveTwoNineService.instance) {
      SixFiveTwoNineService.instance = new SixFiveTwoNineService();
    }
    return SixFiveTwoNineService.instance;
  }

  async fetchMemesCollection(): Promise<MemeCard[]> {
    const memesMap = new Map<number, MemeCard>();
    let page = 1;
    const pageSize = 50; // Seize API returns max 50 per page
    let hasMore = true;
    let consecutiveEmptyPages = 0;

    try {
      while (hasMore && memesMap.size < 500 && consecutiveEmptyPages < 3) {
        const url = `${SEIZE_API_BASE}/nfts?contract_address=${CONTRACT_ADDRESS}&page=${page}&page_size=${pageSize}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          console.error('Seize API error:', response.status, response.statusText);
          break;
        }

        const data = await response.json();
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          consecutiveEmptyPages = 0;
          const transformedMemes = this.transformSeizeData(data.data);
          
          // Use Map to prevent duplicates and filter out nulls
          transformedMemes.forEach(meme => {
            if (meme && meme.id > 0 && meme.id <= 404) {
              memesMap.set(meme.id, meme);
            }
          });
          
          // Continue until we have all NFTs or hit empty pages
          page++;
        } else {
          consecutiveEmptyPages++;
          page++;
        }
      }

      // Convert Map to array and sort by ID
      const allMemes = Array.from(memesMap.values()).sort((a, b) => a.id - b.id);
      
      // Only return real data, no fallback to samples
      console.log(`Fetched ${allMemes.length} unique memes from Seize.io`);
      return allMemes;
    } catch (error) {
      console.error('Error fetching from Seize.io:', error);
      return [];
    }
  }

  private transformSeizeData(seizeData: any[]): MemeCard[] {
    return seizeData.map((nft: any) => {
      const tokenId = parseInt(nft.token_id || nft.tokenId || nft.id || '0');
      const season = Math.floor((tokenId - 1) / 100) + 1;
      
      // Use thumbnail first for performance, then fallback to image
      // This matches the working implementation
      let thumbnailUrl = nft.thumbnail || nft.image || '';
      let imageUrl = nft.image || nft.thumbnail || '';
      
      // Skip NFTs with wrong contract address in image URLs
      // These are duplicates with incorrect data
      if ((imageUrl && imageUrl.includes('0x0c58ef43ff3032005e472cb5')) ||
          (thumbnailUrl && thumbnailUrl.includes('0x0c58ef43ff3032005e472cb5'))) {
        return null; // This will be filtered out
      }
      
      return {
        id: tokenId,
        season,
        card_number: tokenId,
        name: nft.name || nft.metadata?.name || `Meme #${tokenId}`,
        artist: this.extractArtist(nft),
        image: imageUrl,
        thumbnail: thumbnailUrl,
        floor_price: parseFloat(nft.floor_price || nft.floorPrice || '0'),
        highest_offer: parseFloat(nft.highest_offer || nft.bestOffer || '0'),
        total_supply: parseInt(nft.supply || nft.total_supply || nft.totalSupply || '0'),
        unique_owners: parseInt(nft.unique_owners || nft.uniqueOwners || '0'),
        volume_24h: parseFloat(nft.volume_24h || nft.volume24h || '0'),
        volume_7d: parseFloat(nft.volume_7d || nft.volume7d || '0'),
        listed_count: parseInt(nft.listed_count || nft.listedCount || '0'),
        last_sales: nft.last_sales || nft.lastSales || []
      };
    });
  }

  private extractArtist(nft: any): string {
    if (nft.artist) return nft.artist;
    
    if (nft.metadata?.attributes) {
      const artistAttr = nft.metadata.attributes.find(
        (attr: any) => attr.trait_type === 'Artist' || attr.trait_type === 'artist'
      );
      if (artistAttr) return artistAttr.value;
    }
    
    if (nft.attributes) {
      const artistAttr = nft.attributes.find(
        (attr: any) => attr.trait_type === 'Artist' || attr.trait_type === 'artist'
      );
      if (artistAttr) return artistAttr.value;
    }
    
    return 'Unknown';
  }

  async fetchCollectionStats(): Promise<CollectionStats> {
    try {
      const url = `${SEIZE_API_BASE}/collection/stats?contract_address=${CONTRACT_ADDRESS}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          total_memes: 403,
          total_collectors: data.num_owners || data.unique_owners || 12000,
          total_volume: parseFloat(data.total_volume || data.volume_all_time || '50000'),
          floor_price: parseFloat(data.floor_price || '0.08'),
          market_cap: parseFloat(data.market_cap || '100000')
        };
      }
    } catch (error) {
      console.error('Error fetching collection stats:', error);
    }

    return {
      total_memes: 403,
      total_collectors: 12000,
      total_volume: 50000,
      floor_price: 0.08,
      market_cap: 100000
    };
  }

  async fetchWalletHoldings(address: string): Promise<any> {
    try {
      // Try using SimpleHash API (free tier available)
      const simpleHashUrl = `https://api.simplehash.com/api/v0/nfts/owners?chains=ethereum&wallet_addresses=${address}&contract_addresses=${CONTRACT_ADDRESS}&limit=500`;
      
      const response = await fetch(simpleHashUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const ownedMemes: number[] = [];
        
        if (data.nfts && Array.isArray(data.nfts)) {
          data.nfts.forEach((nft: any) => {
            const tokenId = parseInt(nft.token_id || nft.nft_id || '0');
            if (tokenId > 0 && tokenId <= 404) {
              ownedMemes.push(tokenId);
            }
          });
        }

        return {
          address,
          ens: null,
          ownedMemes: ownedMemes.sort((a, b) => a - b),
          totalOwned: ownedMemes.length,
          lastChecked: new Date().toISOString()
        };
      }

      // Fallback: Try using Alchemy's free tier if available
      if (process.env.ALCHEMY_API_KEY) {
        const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${address}&contractAddresses[]=${CONTRACT_ADDRESS}&withMetadata=false`;
        
        const alchemyResponse = await fetch(alchemyUrl);
        if (alchemyResponse.ok) {
          const data = await alchemyResponse.json();
          const ownedMemes: number[] = [];
          
          if (data.ownedNfts) {
            data.ownedNfts.forEach((nft: any) => {
              const tokenId = parseInt(nft.tokenId, 16); // Convert from hex
              if (tokenId > 0 && tokenId <= 404) {
                ownedMemes.push(tokenId);
              }
            });
          }

          return {
            address,
            ens: null,
            ownedMemes: ownedMemes.sort((a, b) => a - b),
            totalOwned: ownedMemes.length,
            lastChecked: new Date().toISOString()
          };
        }
      }

      // If all else fails, return empty
      console.log('No wallet data available - APIs require keys or are unavailable');
      return {
        address,
        ens: null,
        ownedMemes: [],
        totalOwned: 0,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching wallet holdings:', error);
      return {
        address,
        ens: null,
        ownedMemes: [],
        totalOwned: 0,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private encodeBalanceOfBatch(addresses: string[], tokenIds: string[]): string {
    const methodId = '0x4e1273f4';
    const addressesOffset = '0x0000000000000000000000000000000000000000000000000000000000000040';
    const tokenIdsOffset = `0x${(64 + addresses.length * 32 + 32).toString(16).padStart(64, '0')}`;
    const addressesLength = `0x${addresses.length.toString(16).padStart(64, '0')}`;
    const tokenIdsLength = `0x${tokenIds.length.toString(16).padStart(64, '0')}`;
    
    let data = methodId + addressesOffset.slice(2) + tokenIdsOffset;
    data += addressesLength.slice(2);
    addresses.forEach(addr => {
      data += addr.slice(2).toLowerCase().padStart(64, '0');
    });
    data += tokenIdsLength.slice(2);
    tokenIds.forEach(id => {
      data += id.slice(2);
    });
    
    return data;
  }

  private decodeBalances(data: string): number[] {
    if (!data || data === '0x') return [];
    
    const cleanData = data.slice(2);
    const balances: number[] = [];
    
    const offset = parseInt(cleanData.slice(0, 64), 16) * 2;
    const length = parseInt(cleanData.slice(offset, offset + 64), 16);
    
    for (let i = 0; i < length; i++) {
      const start = offset + 64 + (i * 64);
      const balance = parseInt(cleanData.slice(start, start + 64), 16);
      balances.push(balance);
    }
    
    return balances;
  }

  private async resolveENS(address: string): Promise<string | null> {
    try {
      const response = await fetch(ETHEREUM_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: '0x3671ae578e63fdf66ad4f3e12cc0c0d71ac7510c',
            data: `0x691f3431${address.slice(2).toLowerCase().padStart(64, '0')}`
          }, 'latest']
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.result && result.result !== '0x') {
          const hexString = result.result.slice(2);
          const length = parseInt(hexString.slice(128, 192), 16);
          const nameHex = hexString.slice(192, 192 + length * 2);
          const name = Buffer.from(nameHex, 'hex').toString('utf8');
          return name || null;
        }
      }
    } catch (error) {
      console.error('Error resolving ENS:', error);
    }
    return null;
  }

  private generateSampleMemes(): MemeCard[] {
    const memes: MemeCard[] = [];
    const artists = ["6529er", "Punk6529", "XCOPY", "Grant Yun", "ACK", "Deekay", "Killer Acid"];
    const themes = ["The Memes", "Open Metaverse", "GM", "WAGMI", "Diamond Hands", "Seize", "NFA"];
    
    for (let i = 1; i <= 403; i++) {
      const season = Math.floor((i - 1) / 100) + 1;
      memes.push({
        id: i,
        season,
        card_number: i,
        name: `${themes[i % themes.length]} #${i}`,
        artist: artists[i % artists.length],
        image: `https://i.seadn.io/gcs/files/c09da7e025b67dd79acd3a96e8024bfa.png?w=500`,
        thumbnail: `https://i.seadn.io/gcs/files/c09da7e025b67dd79acd3a96e8024bfa.png?w=200`,
        floor_price: 0.05 + Math.random() * 0.5,
        highest_offer: 0.04 + Math.random() * 0.4,
        total_supply: 1000 + Math.floor(Math.random() * 2000),
        unique_owners: 500 + Math.floor(Math.random() * 1000),
        volume_24h: Math.random() * 10,
        volume_7d: Math.random() * 50,
        listed_count: Math.floor(Math.random() * 20),
        last_sales: []
      });
    }
    
    return memes;
  }
}

export const sixFiveTwoNineService = SixFiveTwoNineService.getInstance();