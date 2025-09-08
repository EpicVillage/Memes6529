'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  AlertCircle,
  Check,
  X,
  ExternalLink
} from 'lucide-react';

interface WalletData {
  address: string;
  ens?: string;
  ownedMemes: number[];
  totalOwned: number;
  lastChecked?: string;
}

interface MemeCard {
  id: number;
  season: number;
  card_number: number;
  name: string;
  artist: string;
  image?: string;
  floor_price?: number;
  highest_offer?: number;
  total_supply?: number;
}

interface WalletTrackerProps {
  allMemes: MemeCard[];
  onRefresh?: () => void;
}

export function WalletTracker({ allMemes, onRefresh }: WalletTrackerProps) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [newWallet, setNewWallet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [selectedMissingMemes, setSelectedMissingMemes] = useState<number[]>([]);

  // Load wallets from localStorage and selected wallets
  useEffect(() => {
    const savedWallets = localStorage.getItem('6529_wallets');
    const savedSelected = localStorage.getItem('6529_selected_wallets');
    if (savedWallets) {
      const loadedWallets = JSON.parse(savedWallets);
      setWallets(loadedWallets);
      // Load selected wallets or auto-select all if not saved
      if (savedSelected) {
        setSelectedWallets(JSON.parse(savedSelected));
      } else {
        setSelectedWallets(loadedWallets.map((w: WalletData) => w.address));
      }
    }
  }, []);

  // Save wallets to localStorage
  useEffect(() => {
    if (wallets.length > 0) {
      localStorage.setItem('6529_wallets', JSON.stringify(wallets));
    }
  }, [wallets]);

  const addWallet = async () => {
    if (!newWallet || wallets.find(w => w.address.toLowerCase() === newWallet.toLowerCase())) {
      return;
    }

    setIsLoading(true);
    try {
      // Check wallet ownership
      const ownedMemes = await checkWalletOwnership(newWallet);
      
      const walletData: WalletData = {
        address: newWallet,
        ownedMemes,
        totalOwned: ownedMemes.length,
        lastChecked: new Date().toISOString()
      };

      setWallets([...wallets, walletData]);
      setNewWallet('');
    } catch (error) {
      console.error('Error adding wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeWallet = (address: string) => {
    setWallets(wallets.filter(w => w.address !== address));
    setSelectedWallets(selectedWallets.filter(w => w !== address));
  };

  const toggleWalletSelection = (address: string) => {
    if (selectedWallets.includes(address)) {
      setSelectedWallets(selectedWallets.filter(w => w !== address));
    } else {
      setSelectedWallets([...selectedWallets, address]);
    }
  };

  const refreshWallet = async (address: string) => {
    setIsLoading(true);
    try {
      const ownedMemes = await checkWalletOwnership(address);
      
      setWallets(wallets.map(w => 
        w.address === address 
          ? { ...w, ownedMemes, totalOwned: ownedMemes.length, lastChecked: new Date().toISOString() }
          : w
      ));
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check wallet NFT ownership via API
  const checkWalletOwnership = async (address: string): Promise<number[]> => {
    try {
      const response = await fetch(`/api/6529/wallet?wallet=${address}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.ownedMemes || [];
      } else {
        console.error('Error checking wallet:', data.error);
        // Return empty array instead of mock data
        return [];
      }
    } catch (error) {
      console.error('Error calling wallet API:', error);
      // Return empty array on error
      return [];
    }
  };

  // Calculate missing memes and costs for multiple wallets
  const getCombinedMissingMemesData = (walletAddresses: string[]) => {
    if (walletAddresses.length === 0) return null;

    // Combine all owned memes from selected wallets
    const allOwnedMemes = new Set<number>();
    let totalOwnedCount = 0;

    walletAddresses.forEach(address => {
      const wallet = wallets.find(w => w.address === address);
      if (wallet) {
        wallet.ownedMemes.forEach(id => allOwnedMemes.add(id));
      }
    });

    totalOwnedCount = allOwnedMemes.size;
    const ownedMemes = allMemes.filter(meme => allOwnedMemes.has(meme.id));
    const missingMemes = allMemes.filter(meme => !allOwnedMemes.has(meme.id));
    
    // Calculate owned portfolio value
    const ownedFloorValue = ownedMemes.reduce((sum, meme) => sum + (meme.floor_price || 0), 0);
    const ownedOfferValue = ownedMemes.reduce((sum, meme) => sum + (meme.highest_offer || 0), 0);
    
    // Calculate missing costs
    const totalFloorCost = missingMemes.reduce((sum, meme) => sum + (meme.floor_price || 0), 0);
    const totalOfferCost = missingMemes.reduce((sum, meme) => sum + (meme.highest_offer || 0), 0);
    
    const seasonBreakdown = missingMemes.reduce((acc, meme) => {
      acc[meme.season] = (acc[meme.season] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Get duplicate ownership info
    const duplicates: Record<number, number> = {};
    walletAddresses.forEach(address => {
      const wallet = wallets.find(w => w.address === address);
      if (wallet) {
        wallet.ownedMemes.forEach(id => {
          duplicates[id] = (duplicates[id] || 0) + 1;
        });
      }
    });

    const duplicateCount = Object.values(duplicates).filter(count => count > 1).length;

    // Get top 5 NFTs by floor price and by offer
    const topByFloor = [...ownedMemes]
      .sort((a, b) => (b.floor_price || 0) - (a.floor_price || 0))
      .slice(0, 5);
    
    const topByOffer = [...ownedMemes]
      .filter(meme => meme.highest_offer && meme.highest_offer > 0)
      .sort((a, b) => (b.highest_offer || 0) - (a.highest_offer || 0))
      .slice(0, 5);

    return {
      ownedMemes,
      missingMemes,
      missingCount: missingMemes.length,
      totalFloorCost,
      totalOfferCost,
      ownedFloorValue,
      ownedOfferValue,
      seasonBreakdown,
      completionPercentage: ((totalOwnedCount / allMemes.length) * 100).toFixed(1),
      totalOwned: totalOwnedCount,
      duplicateCount,
      selectedWalletCount: walletAddresses.length,
      topByFloor,
      topByOffer
    };
  };

  const missingData = getCombinedMissingMemesData(selectedWallets);

  // Calculate total price for selected missing memes
  const getSelectedMissingTotal = () => {
    if (!missingData || selectedMissingMemes.length === 0) return { floor: 0, offer: 0 };
    
    const selectedMemes = missingData.missingMemes.filter(meme => 
      selectedMissingMemes.includes(meme.id)
    );
    
    const totalFloor = selectedMemes.reduce((sum, meme) => sum + (meme.floor_price || 0), 0);
    const totalOffer = selectedMemes.reduce((sum, meme) => sum + (meme.highest_offer || 0), 0);
    
    return { floor: totalFloor, offer: totalOffer };
  };

  const selectedTotals = getSelectedMissingTotal();

  const toggleMissingMemeSelection = (memeId: number) => {
    if (selectedMissingMemes.includes(memeId)) {
      setSelectedMissingMemes(selectedMissingMemes.filter(id => id !== memeId));
    } else {
      setSelectedMissingMemes([...selectedMissingMemes, memeId]);
    }
  };

  const handleMissingMemeClick = (e: React.MouseEvent, meme: MemeCard) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + Click opens OpenSea
      window.open(`https://opensea.io/assets/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/${meme.id}`, '_blank');
    } else {
      // Regular click toggles selection
      toggleMissingMemeSelection(meme.id);
    }
  };

  // Sync with selected wallets from localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const savedSelected = localStorage.getItem('6529_selected_wallets');
      if (savedSelected) {
        const parsed = JSON.parse(savedSelected);
        if (JSON.stringify(parsed) !== JSON.stringify(selectedWallets)) {
          setSelectedWallets(parsed);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [selectedWallets]);

  return (
    <div className="space-y-4">

      {/* Missing Memes Analysis */}
      {missingData && (
        <>
          {/* Portfolio Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value (Floor)</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{missingData.ownedFloorValue.toFixed(2)} ETH</div>
                <p className="text-xs text-gray-400 mt-1">
                  Based on floor prices of {missingData.totalOwned} owned NFTs
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value (Offers)</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-400">{missingData.ownedOfferValue.toFixed(2)} ETH</div>
                <p className="text-xs text-gray-400 mt-1">
                  Based on highest offers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Valuable NFTs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Top 5 by Floor Price
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {missingData.topByFloor.length > 0 ? (
                  missingData.topByFloor.map((meme, index) => (
                    <div key={meme.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg group hover:bg-gray-750 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-4">{index + 1}</span>
                        {(meme.thumbnail || meme.image) ? (
                          <img 
                            src={meme.thumbnail || meme.image} 
                            alt={meme.name}
                            className="w-8 h-8 rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                            <span className="text-xs">#{meme.card_number}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">#{meme.card_number} {meme.name}</p>
                          <p className="text-xs text-gray-500">S{meme.season}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-green-400">{(meme.floor_price || 0).toFixed(3)} ETH</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(`https://opensea.io/assets/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/${meme.id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No owned NFTs with floor prices</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                  Top 5 by Highest Offer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {missingData.topByOffer.length > 0 ? (
                  missingData.topByOffer.map((meme, index) => (
                    <div key={meme.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg group hover:bg-gray-750 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-4">{index + 1}</span>
                        {(meme.thumbnail || meme.image) ? (
                          <img 
                            src={meme.thumbnail || meme.image} 
                            alt={meme.name}
                            className="w-8 h-8 rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                            <span className="text-xs">#{meme.card_number}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">#{meme.card_number} {meme.name}</p>
                          <p className="text-xs text-gray-500">S{meme.season}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-purple-400">{(meme.highest_offer || 0).toFixed(3)} ETH</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(`https://opensea.io/assets/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/${meme.id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No owned NFTs with offers</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Progress</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missingData.completionPercentage}%</div>
                <p className="text-xs text-gray-500">
                  {missingData.totalOwned} of {allMemes.length} memes
                </p>
                {selectedWallets.length > 1 && (
                  <p className="text-xs text-blue-500 mt-1">
                    {selectedWallets.length} wallets combined
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missing Memes</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missingData.missingCount}</div>
                <p className="text-xs text-gray-500">
                  Need to acquire
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost to Complete</CardTitle>
                <ShoppingCart className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missingData.totalFloorCost.toFixed(2)} ETH</div>
                <p className="text-xs text-gray-500">
                  Floor price total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duplicates</CardTitle>
                <Package className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missingData.duplicateCount}</div>
                <p className="text-xs text-gray-500">
                  NFTs owned multiple times
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Season Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Missing by Season</CardTitle>
              <CardDescription>
                Breakdown of missing memes by season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(missingData.seasonBreakdown).map(([season, count]) => (
                  <div key={season} className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">Season {season}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Missing Memes List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Missing Memes</CardTitle>
                  <CardDescription>
                    Click to select • Ctrl+Click to open OpenSea
                  </CardDescription>
                </div>
                {selectedMissingMemes.length > 0 && (
                  <div className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedMissingMemes([])}
                      className="mb-2"
                    >
                      Clear Selection ({selectedMissingMemes.length})
                    </Button>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-gray-500">Floor Total:</span>{' '}
                        <span className="font-bold text-green-400">{selectedTotals.floor.toFixed(3)} ETH</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Offer Total:</span>{' '}
                        <span className="font-bold text-purple-400">{selectedTotals.offer.toFixed(3)} ETH</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[36rem] overflow-y-auto">
                {missingData.missingMemes.map((meme) => {
                  const isSelected = selectedMissingMemes.includes(meme.id);
                  return (
                    <div 
                      key={meme.id} 
                      className={`border rounded-lg p-2 transition-colors cursor-pointer group relative ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-900/20' 
                          : 'border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                      }`}
                      onClick={(e) => handleMissingMemeClick(e, meme)}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-1 left-1 z-10">
                          <div className="h-4 w-4 rounded bg-blue-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                      
                      <div className="relative">
                        {(meme.thumbnail || meme.image) ? (
                          <img 
                            src={meme.thumbnail || meme.image} 
                            alt={meme.name}
                            className={`aspect-square rounded mb-1 object-cover ${
                              isSelected ? 'opacity-90' : 'group-hover:opacity-90'
                            }`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="aspect-square bg-gray-700 rounded mb-1 flex items-center justify-center">
                            <span className="text-xs">#{meme.card_number}</span>
                          </div>
                        )}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1 bg-black/50 rounded px-1 py-0.5">
                            <span className="text-xs text-white">Ctrl+</span>
                            <ExternalLink className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-semibold truncate">#{meme.card_number}</p>
                      <p className="text-xs text-gray-500 truncate">{meme.name}</p>
                      {meme.floor_price && (
                        <p className="text-xs font-medium text-green-500">
                          {meme.floor_price.toFixed(3)} ETH
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {missingData.missingCount > 0 && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  Showing all {missingData.missingCount} missing memes
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Wallet Manager Component
export function WalletManager({ allMemes, onRefresh }: WalletTrackerProps) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [newWallet, setNewWallet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);

  // Load wallets from localStorage and auto-select all
  useEffect(() => {
    const savedWallets = localStorage.getItem('6529_wallets');
    if (savedWallets) {
      const loadedWallets = JSON.parse(savedWallets);
      setWallets(loadedWallets);
      // Auto-select all wallets by default
      setSelectedWallets(loadedWallets.map((w: WalletData) => w.address));
    }
  }, []);

  // Save wallets to localStorage
  useEffect(() => {
    if (wallets.length > 0) {
      localStorage.setItem('6529_wallets', JSON.stringify(wallets));
      // Also save selected wallets
      localStorage.setItem('6529_selected_wallets', JSON.stringify(selectedWallets));
    }
  }, [wallets, selectedWallets]);

  const addWallet = async () => {
    if (!newWallet || wallets.find(w => w.address.toLowerCase() === newWallet.toLowerCase())) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/6529/wallet?wallet=${newWallet}`);
      const data = await response.json();
      
      const walletData: WalletData = {
        address: newWallet,
        ens: data.ens,
        ownedMemes: data.ownedMemes || [],
        totalOwned: data.totalOwned || 0,
        lastChecked: new Date().toISOString()
      };

      const newWallets = [...wallets, walletData];
      setWallets(newWallets);
      // Auto-select the new wallet
      setSelectedWallets([...selectedWallets, newWallet]);
      setNewWallet('');
    } catch (error) {
      console.error('Error adding wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeWallet = (address: string) => {
    setWallets(wallets.filter(w => w.address !== address));
    setSelectedWallets(selectedWallets.filter(w => w !== address));
  };

  const toggleWalletSelection = (address: string) => {
    if (selectedWallets.includes(address)) {
      setSelectedWallets(selectedWallets.filter(w => w !== address));
    } else {
      setSelectedWallets([...selectedWallets, address]);
    }
  };

  const refreshWallet = async (address: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/6529/wallet?wallet=${address}`);
      const data = await response.json();
      
      setWallets(wallets.map(w => 
        w.address === address 
          ? { 
              ...w, 
              ens: data.ens,
              ownedMemes: data.ownedMemes || [], 
              totalOwned: data.totalOwned || 0, 
              lastChecked: new Date().toISOString() 
            }
          : w
      ));
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate combined stats
  const getCombinedStats = () => {
    if (selectedWallets.length === 0) return null;

    const allOwnedMemes = new Set<number>();
    selectedWallets.forEach(address => {
      const wallet = wallets.find(w => w.address === address);
      if (wallet) {
        wallet.ownedMemes.forEach(id => allOwnedMemes.add(id));
      }
    });

    const ownedMemes = allMemes.filter(meme => allOwnedMemes.has(meme.id));
    const ownedFloorValue = ownedMemes.reduce((sum, meme) => sum + (meme.floor_price || 0), 0);
    const ownedOfferValue = ownedMemes.reduce((sum, meme) => sum + (meme.highest_offer || 0), 0);

    // Get duplicate ownership info
    const duplicates: Record<number, number> = {};
    selectedWallets.forEach(address => {
      const wallet = wallets.find(w => w.address === address);
      if (wallet) {
        wallet.ownedMemes.forEach(id => {
          duplicates[id] = (duplicates[id] || 0) + 1;
        });
      }
    });
    const duplicateCount = Object.values(duplicates).filter(count => count > 1).length;

    return {
      totalOwned: allOwnedMemes.size,
      duplicateCount,
      floorValue: ownedFloorValue,
      offerValue: ownedOfferValue
    };
  };

  const stats = getCombinedStats();

  return (
    <div className="space-y-4">
      {/* Add Wallet */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter wallet address or ENS..."
          value={newWallet}
          onChange={(e) => setNewWallet(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addWallet()}
          disabled={isLoading}
        />
        <Button onClick={addWallet} disabled={isLoading || !newWallet}>
          <Plus className="h-4 w-4 mr-2" />
          Add Wallet
        </Button>
      </div>

      {/* Wallet List */}
      {wallets.length > 0 && (
        <div className="space-y-2">
          {wallets.map((wallet) => (
            <div 
              key={wallet.address}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedWallets.includes(wallet.address)
                  ? 'bg-blue-900/20 border-blue-700' 
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
              }`}
              onClick={() => toggleWalletSelection(wallet.address)}
            >
              <div className="flex items-center gap-3">
                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                  selectedWallets.includes(wallet.address)
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-500'
                }`}>
                  {selectedWallets.includes(wallet.address) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <Wallet className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-mono text-sm">
                    {wallet.ens || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {wallet.totalOwned} / {allMemes.length} owned
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {((wallet.totalOwned / allMemes.length) * 100).toFixed(0)}%
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshWallet(wallet.address);
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWallet(wallet.address);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Combined Stats */}
      {stats && selectedWallets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-800 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Selected Wallets</p>
            <p className="text-sm font-semibold">{selectedWallets.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Unique NFTs</p>
            <p className="text-sm font-semibold">{stats.totalOwned}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Floor Value</p>
            <p className="text-sm font-semibold text-green-500">{stats.floorValue.toFixed(3)} ETH</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Offer Value</p>
            <p className="text-sm font-semibold text-blue-500">{stats.offerValue.toFixed(3)} ETH</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Wallet Sales Activity Component
export function WalletSales({ allMemes }: { allMemes: MemeCard[] }) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('6529_wallets');
    if (stored) {
      setWallets(JSON.parse(stored));
    }
  }, []);

  // Fetch sales data for tracked wallets
  const fetchSalesData = async () => {
    if (wallets.length === 0) return;
    
    setIsLoading(true);
    try {
      // For now, we'll show potential sales based on owned memes with last_sales data
      const potentialSales: any[] = [];
      
      wallets.forEach(wallet => {
        wallet.ownedMemes.forEach(memeId => {
          const meme = allMemes.find(m => m.id === memeId);
          if (meme && meme.floor_price) {
            potentialSales.push({
              wallet: wallet.ens || wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4),
              walletAddress: wallet.address,
              meme: meme.name,
              memeId: meme.id,
              cardNumber: meme.card_number,
              currentFloor: meme.floor_price,
              highestOffer: meme.highest_offer || 0,
              potentialProfit: meme.highest_offer ? (meme.highest_offer - (meme.floor_price * 0.8)) : 0 // Assuming 80% of floor as cost basis
            });
          }
        });
      });
      
      // Sort by potential profit
      potentialSales.sort((a, b) => b.potentialProfit - a.potentialProfit);
      setSalesData(potentialSales);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [wallets, allMemes]);

  const formatPrice = (price: number) => {
    return price.toFixed(4) + ' ETH';
  };

  if (wallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Sales Activity</CardTitle>
          <CardDescription>
            Add wallets in the Overview tab to see sales opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No wallets tracked. Add wallets to see potential sales.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Opportunities</CardTitle>
        <CardDescription>
          Potential sales based on current offers and floor prices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : salesData.length > 0 ? (
            <>
              <div className="grid grid-cols-6 gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-700">
                <div>Wallet</div>
                <div>Meme</div>
                <div className="text-right">Floor</div>
                <div className="text-right">Offer</div>
                <div className="text-right">Potential</div>
                <div className="text-center">Action</div>
              </div>
              {salesData.slice(0, 20).map((sale, index) => (
                <div 
                  key={`${sale.walletAddress}-${sale.memeId}`}
                  className="grid grid-cols-6 gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center">
                    <Wallet className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="text-sm truncate">{sale.wallet}</span>
                  </div>
                  <div className="text-sm truncate">
                    #{sale.cardNumber} {sale.meme}
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatPrice(sale.currentFloor)}</p>
                  </div>
                  <div className="text-right">
                    {sale.highestOffer > 0 ? (
                      <p className="text-sm text-green-500">{formatPrice(sale.highestOffer)}</p>
                    ) : (
                      <p className="text-sm text-gray-500">-</p>
                    )}
                  </div>
                  <div className="text-right">
                    {sale.potentialProfit > 0 ? (
                      <p className="text-sm text-green-400">+{formatPrice(sale.potentialProfit)}</p>
                    ) : (
                      <p className="text-sm text-gray-500">-</p>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`https://opensea.io/assets/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/${sale.memeId}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Opportunities</span>
                  <span className="text-sm font-medium">{salesData.length} items</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">Total Potential Value</span>
                  <span className="text-sm font-medium text-green-500">
                    {formatPrice(salesData.reduce((sum, s) => sum + (s.highestOffer || s.currentFloor), 0))}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No sales opportunities found for tracked wallets.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}