'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpDown,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MemeCard {
  id: number;
  season: number;
  card_number: number;
  name: string;
  artist: string;
  image?: string;
  floor_price?: number;
  highest_offer?: number;
  last_sales?: Array<{
    price: number;
    date: string;
  }>;
  total_supply?: number;
  unique_owners?: number;
  volume_24h?: number;
  listed_count?: number;
}

interface MemesTableProps {
  memes: MemeCard[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function MemesTable({ memes, isLoading, onRefresh }: MemesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'floor' | 'offer'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [ownedMemes, setOwnedMemes] = useState<Set<number>>(new Set());

  // Load owned memes from localStorage
  useEffect(() => {
    const loadOwnedMemes = () => {
      const wallets = localStorage.getItem('6529_wallets');
      const selectedWallets = localStorage.getItem('6529_selected_wallets');
      
      if (wallets) {
        const walletData = JSON.parse(wallets);
        const selected = selectedWallets ? JSON.parse(selectedWallets) : [];
        
        const owned = new Set<number>();
        
        // If no wallets are selected, use all wallets
        const walletsToCheck = selected.length > 0 ? selected : walletData.map((w: any) => w.address);
        
        walletsToCheck.forEach((address: string) => {
          const wallet = walletData.find((w: any) => w.address === address);
          if (wallet && wallet.ownedMemes) {
            wallet.ownedMemes.forEach((id: number) => owned.add(id));
          }
        });
        
        console.log(`Loaded ${owned.size} owned NFTs from ${walletsToCheck.length} wallet(s)`);
        setOwnedMemes(owned);
      }
    };
    
    loadOwnedMemes();
    // Poll for updates
    const interval = setInterval(loadOwnedMemes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter memes based on search and season
  const filteredMemes = memes.filter((meme) => {
    const matchesSearch = 
      meme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meme.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meme.card_number.toString().includes(searchTerm);
    
    const matchesSeason = selectedSeason === 'all' || meme.season.toString() === selectedSeason;
    
    return matchesSearch && matchesSeason;
  });

  // Sort memes - this happens BEFORE pagination so it sorts ALL filtered memes
  const sortedMemes = [...filteredMemes].sort((a, b) => {
    let compareValue = 0;
    switch (sortBy) {
      case 'number':
        compareValue = a.card_number - b.card_number;
        break;
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'floor':
        compareValue = (a.floor_price || 0) - (b.floor_price || 0);
        break;
      case 'offer':
        compareValue = (a.highest_offer || 0) - (b.highest_offer || 0);
        break;
    }
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  // Paginate memes AFTER sorting - so pagination shows sorted results
  const totalPages = Math.ceil(sortedMemes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMemes = sortedMemes.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return `${price.toFixed(4)} ETH`;
  };


  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search by name, artist, or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              <SelectItem value="1">Season 1</SelectItem>
              <SelectItem value="2">Season 2</SelectItem>
              <SelectItem value="3">Season 3</SelectItem>
              <SelectItem value="4">Season 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(parseInt(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" disabled={isLoading}>
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableCaption>
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredMemes.length)} of {filteredMemes.length} memes
          </TableCaption>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
              <TableHead className="w-16">#</TableHead>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-medium"
                >
                  Name / Artist
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Season</TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('floor')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Floor Price</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('offer')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Highest Offer</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">Supply</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMemes.map((meme) => {
              const isOwned = ownedMemes.has(meme.id);
              return (
                <TableRow 
                  key={meme.id} 
                  className={`hover:bg-gray-100 dark:hover:bg-gray-800/50 ${isOwned ? 'bg-green-100 dark:bg-green-900/20' : ''}`}
                >
                  <TableCell className="font-medium">
                    #{meme.card_number}
                  </TableCell>
                  <TableCell>
                    {(meme.thumbnail || meme.image) ? (
                      <img
                        src={meme.thumbnail || meme.image}
                        alt={meme.name}
                        className="w-12 h-12 rounded-lg object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs text-gray-600 dark:text-gray-500">#{meme.card_number}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{meme.name}</p>
                        {isOwned && (
                          <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/30 border-green-600 dark:border-green-700 text-green-700 dark:text-green-400">
                            Owned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-500">by {meme.artist}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">S{meme.season}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{formatPrice(meme.floor_price)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {meme.highest_offer ? (
                      <span className="text-green-500">{formatPrice(meme.highest_offer)}</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{meme.total_supply || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://6529.io/the-memes/${meme.card_number}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://opensea.io/assets/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/${meme.id}`, '_blank')}
                      >
                        OS
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}