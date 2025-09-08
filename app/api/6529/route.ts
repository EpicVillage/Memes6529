import { NextRequest, NextResponse } from 'next/server';
import { sixFiveTwoNineService } from '@/lib/6529-service';
import type { MemeCard } from './types';

async function fetchMemes(): Promise<MemeCard[]> {
  return await sixFiveTwoNineService.fetchMemesCollection();
}


async function fetchCollectionStats() {
  return await sixFiveTwoNineService.fetchCollectionStats();
}

async function fetchWalletData(address: string) {
  return await sixFiveTwoNineService.fetchWalletHoldings(address);
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