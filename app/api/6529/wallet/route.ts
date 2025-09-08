import { NextRequest, NextResponse } from 'next/server';

// API endpoints
const OPENSEA_API = 'https://api.opensea.io/api/v2';
const ALCHEMY_API = 'https://eth-mainnet.g.alchemy.com/nft/v3';
const CONTRACT_ADDRESS = '0x33fd426905f149f8376e227d0c9d3340aad17af1'; // The Memes contract

async function fetchWalletNFTs(walletAddress: string) {
  try {
    // Try OpenSea API first
    const response = await fetch(
      `${OPENSEA_API}/chain/ethereum/account/${walletAddress}/nfts?collection=the-memes-by-6529&limit=200`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': process.env.OPENSEA_API_KEY || '',
        },
        next: { revalidate: 60 }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return transformOpenSeaData(data);
    }
  } catch (error) {
    console.error('Error fetching from OpenSea:', error);
  }

  // Try Alchemy as fallback
  if (process.env.ALCHEMY_API_KEY) {
    try {
      const response = await fetch(
        `${ALCHEMY_API}/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?` +
        `owner=${walletAddress}&contractAddresses[]=${CONTRACT_ADDRESS}&withMetadata=true`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return transformAlchemyData(data);
      }
    } catch (error) {
      console.error('Error fetching from Alchemy:', error);
    }
  }

  // If real APIs fail, return empty data
  return {
    ownedMemes: [],
    holdings: [],
    totalOwned: 0,
    totalValue: 0
  };
}

function transformOpenSeaData(data: any) {
  if (!data.nfts) return { ownedMemes: [], holdings: [], totalOwned: 0, totalValue: 0 };
  
  const ownedMemes = data.nfts.map((nft: any) => ({
    id: parseInt(nft.identifier),
    name: nft.name,
    image: nft.image_url,
    quantity: 1,
    floorPrice: nft.collection?.floor_price || 0
  }));

  return {
    ownedMemes: ownedMemes.map((m: any) => m.id),
    holdings: ownedMemes,
    totalOwned: ownedMemes.length,
    totalValue: ownedMemes.reduce((sum: number, m: any) => sum + m.floorPrice, 0)
  };
}

function transformAlchemyData(data: any) {
  if (!data.ownedNfts) return { ownedMemes: [], holdings: [], totalOwned: 0, totalValue: 0 };
  
  const ownedMemes = data.ownedNfts.map((nft: any) => ({
    id: parseInt(nft.tokenId),
    name: nft.name || nft.title || `Meme #${nft.tokenId}`,
    image: nft.image?.gateway || nft.media?.[0]?.gateway,
    quantity: parseInt(nft.balance || 1)
  }));

  return {
    ownedMemes: ownedMemes.map((m: any) => m.id),
    holdings: ownedMemes,
    totalOwned: ownedMemes.length
  };
}

async function resolveENS(address: string) {
  try {
    const response = await fetch(`https://api.ensideas.com/ens/resolve/${address}`);
    if (response.ok) {
      const data = await response.json();
      return data.name || null;
    }
  } catch (error) {
    console.error('Error resolving ENS:', error);
  }
  
  // Some known addresses for demo
  const knownENS: Record<string, string> = {
    "0x7f94e30381aA6657C45833EC7fcE2E493c1888EF": "punk6529.eth",
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045": "vitalik.eth"
  };
  
  return knownENS[address.toLowerCase()] || null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Fetch wallet data and ENS in parallel
    const [walletData, ensName] = await Promise.all([
      fetchWalletNFTs(wallet),
      resolveENS(wallet)
    ]);
    
    return NextResponse.json({
      wallet,
      ens: ensName,
      ownedMemes: walletData.ownedMemes,
      totalOwned: walletData.totalOwned,
      holdings: walletData.holdings,
      totalValue: walletData.totalValue,
      lastChecked: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Wallet API Error:', error);
    
    // Return empty data on error
    return NextResponse.json({
      wallet,
      ens: null,
      ownedMemes: [],
      totalOwned: 0,
      holdings: [],
      totalValue: 0,
      lastChecked: new Date().toISOString(),
      success: false,
      error: 'Failed to fetch wallet data'
    });
  }
}