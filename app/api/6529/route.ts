import { NextRequest, NextResponse } from 'next/server';

// 6529 API endpoints
const API_BASE = 'https://api.6529.io';
const SEIZE_API = 'https://api.seize.io';

async function fetchMemes() {
  try {
    // Try to fetch from the actual 6529 API
    const response = await fetch(`${API_BASE}/v1/memes`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': '6529-Tracker/1.0'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching from 6529 API:', error);
  }

  // Fallback to Seize.io API
  try {
    const response = await fetch(`${SEIZE_API}/api/v1/collections/the-memes-by-6529/nfts`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': '6529-Tracker/1.0'
      },
      next: { revalidate: 300 }
    });

    if (response.ok) {
      const data = await response.json();
      // Transform Seize data to match our format
      return transformSeizeData(data);
    }
  } catch (error) {
    console.error('Error fetching from Seize API:', error);
  }

  // If both APIs fail, return empty array
  return [];
}

async function fetchCollectionStats() {
  try {
    const response = await fetch(`${SEIZE_API}/api/v1/collections/the-memes-by-6529/stats`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': '6529-Tracker/1.0'
      },
      next: { revalidate: 300 }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        total_memes: data.totalSupply || 403,
        total_collectors: data.uniqueOwners || 0,
        total_volume: data.totalVolume || 0,
        floor_price: data.floorPrice || 0,
        market_cap: data.marketCap || 0
      };
    }
  } catch (error) {
    console.error('Error fetching collection stats:', error);
  }

  // Return default stats if API fails
  return {
    total_memes: 403,
    total_collectors: 0,
    total_volume: 0,
    floor_price: 0,
    market_cap: 0
  };
}

async function fetchWalletData(address: string) {
  try {
    const response = await fetch(`${API_BASE}/v1/wallets/${address}/memes`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': '6529-Tracker/1.0'
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching wallet data:', error);
  }

  return null;
}

function transformSeizeData(seizeData: any) {
  if (!seizeData || !Array.isArray(seizeData.nfts)) {
    return [];
  }

  return seizeData.nfts.map((nft: any) => ({
    id: nft.tokenId || nft.id,
    season: Math.floor((nft.tokenId - 1) / 100) + 1,
    card_number: nft.tokenId,
    name: nft.name || `Meme #${nft.tokenId}`,
    artist: nft.attributes?.find((a: any) => a.trait_type === 'Artist')?.value || 'Unknown',
    image: nft.image || nft.imageUrl,
    floor_price: nft.floorPrice || 0,
    highest_offer: nft.bestOffer || 0,
    total_supply: nft.totalSupply || 0,
    unique_owners: nft.uniqueOwners || 0,
    volume_24h: nft.volume24h || 0,
    volume_7d: nft.volume7d || 0,
    listed_count: nft.listedCount || 0
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const season = searchParams.get('season');
  const query = searchParams.get('q');
  const wallet = searchParams.get('wallet');

  try {
    if (action === 'wallet' && wallet) {
      const walletData = await fetchWalletData(wallet);
      return NextResponse.json({
        wallet: walletData,
        success: true
      });
    }

    const memes = await fetchMemes();
    
    if (action === 'memes') {
      const filteredMemes = season 
        ? memes.filter((m: any) => m.season === parseInt(season))
        : memes;
      
      return NextResponse.json({
        memes: filteredMemes,
        success: true
      });
    }

    if (action === 'search') {
      const searchResults = query 
        ? memes.filter((m: any) => 
            m.name.toLowerCase().includes(query.toLowerCase()) || 
            m.artist.toLowerCase().includes(query.toLowerCase())
          )
        : [];
      
      return NextResponse.json({
        results: searchResults,
        success: true
      });
    }

    // Default: return dashboard data
    const stats = await fetchCollectionStats();

    return NextResponse.json({
      stats,
      memes,
      activity: [], // TODO: Implement real activity fetching from APIs
      success: true
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch data',
      success: false
    }, { status: 500 });
  }
}