import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const MEMES_CONTRACT = '0x33FD426905F149f8376e227d0C9D3340AaD17aF1';
const ETHEREUM_RPC = 'https://eth.llamarpc.com';

// ERC1155 ABI - only the methods we need
const ERC1155_ABI = [
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
];

async function fetchWalletData(wallet: string) {
  try {
    // Initialize provider and contract
    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
    const contract = new ethers.Contract(MEMES_CONTRACT, ERC1155_ABI, provider);
    
    const ownedMemes: number[] = [];
    const batchSize = 50; // Check 50 NFTs at a time
    const totalTokens = 404; // Total 6529 Memes NFTs
    
    // Check NFTs in batches
    for (let i = 1; i <= totalTokens; i += batchSize) {
      const batch: string[] = [];
      const ids: number[] = [];
      
      // Build batch arrays
      for (let j = i; j < Math.min(i + batchSize, totalTokens + 1); j++) {
        batch.push(wallet);
        ids.push(j);
      }
      
      try {
        // Single RPC call checks up to 50 NFTs
        const balances = await contract.balanceOfBatch(batch, ids);
        
        // Process results
        balances.forEach((balance: bigint, index: number) => {
          if (balance > 0n) {
            ownedMemes.push(ids[index]);
          }
        });
      } catch (batchError) {
        console.error(`Error checking batch starting at ${i}:`, batchError);
        // Continue with next batch even if one fails
      }
    }
    
    // Try to resolve ENS name
    let ensName = null;
    try {
      ensName = await provider.lookupAddress(wallet);
    } catch (ensError) {
      console.log('ENS lookup failed:', ensError);
    }
    
    return {
      address: wallet,
      ens: ensName,
      ownedMemes: ownedMemes.sort((a, b) => a - b),
      totalOwned: ownedMemes.length,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return {
      address: wallet,
      ens: null,
      ownedMemes: [],
      totalOwned: 0,
      lastChecked: new Date().toISOString(),
      error: 'Failed to fetch wallet data'
    };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Validate wallet address
    if (!ethers.isAddress(wallet)) {
      return NextResponse.json({
        error: 'Invalid wallet address',
        success: false
      }, { status: 400 });
    }

    // Fetch wallet data using ethers.js
    const walletData = await fetchWalletData(wallet);
    
    return NextResponse.json({
      ...walletData,
      success: true
    });
  } catch (error) {
    console.error('Wallet API Error:', error);
    
    return NextResponse.json({
      wallet,
      ens: null,
      ownedMemes: [],
      totalOwned: 0,
      lastChecked: new Date().toISOString(),
      success: false,
      error: 'Failed to fetch wallet data'
    });
  }
}