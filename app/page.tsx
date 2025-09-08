'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { MemesTable } from './memes-table';
import { WalletTracker, WalletSales, WalletManager } from './wallet-tracker';
import { useToast } from '@/components/ui/toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Activity, 
  Image, 
  TrendingUp, 
  Eye,
  Download,
  RefreshCw,
  ExternalLink,
  Search,
  DollarSign,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MemeCard {
  id: number;
  season: number;
  card_number: number;
  name: string;
  artist: string;
  image?: string;
  floor_price?: number;
  total_supply?: number;
  unique_owners?: number;
}


interface CollectionStats {
  total_memes: number;
  total_collectors: number;
  total_volume: number;
  floor_price: number;
  market_cap?: number;
}

export default function SixFiveTwoNinePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [walletManagerOpen, setWalletManagerOpen] = useState(true); // Default to open
  const { showToast } = useToast();
  
  // Data states
  const [memes, setMemes] = useState<MemeCard[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [walletStats, setWalletStats] = useState<any>(null);

  // Check if there are wallets and set initial state accordingly
  useEffect(() => {
    const wallets = localStorage.getItem('6529_wallets');
    if (wallets) {
      const walletData = JSON.parse(wallets);
      // If there are wallets, close the manager; if no wallets, keep it open
      setWalletManagerOpen(walletData.length === 0);
    }
  }, []);

  // Load wallet stats from localStorage
  useEffect(() => {
    const loadWalletStats = () => {
      const wallets = localStorage.getItem('6529_wallets');
      const selectedWallets = localStorage.getItem('6529_selected_wallets');
      
      if (wallets && selectedWallets && memes.length > 0) {
        const walletData = JSON.parse(wallets);
        const selected = JSON.parse(selectedWallets);
        
        // Calculate owned memes
        const allOwnedMemes = new Set<number>();
        selected.forEach((address: string) => {
          const wallet = walletData.find((w: any) => w.address === address);
          if (wallet && wallet.ownedMemes) {
            wallet.ownedMemes.forEach((id: number) => allOwnedMemes.add(id));
          }
        });
        
        // Calculate portfolio value and cost to complete
        const ownedMemes = memes.filter(m => allOwnedMemes.has(m.id));
        const missingMemes = memes.filter(m => !allOwnedMemes.has(m.id));
        
        const portfolioValue = ownedMemes.reduce((sum, m) => sum + (m.floor_price || 0), 0);
        const costToComplete = missingMemes.reduce((sum, m) => sum + (m.floor_price || 0), 0);
        
        setWalletStats({
          ownedCount: allOwnedMemes.size,
          portfolioValue,
          costToComplete
        });
      }
    };
    
    loadWalletStats();
    // Poll for updates
    const interval = setInterval(loadWalletStats, 1000);
    return () => clearInterval(interval);
  }, [memes]);

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/6529');
      const data = await response.json();
      
      if (response.ok) {
        setMemes(data.memes || []);
        setStats(data.stats);
        setActivity(data.activity || []);
      } else {
        throw new Error(data.error || 'Failed to fetch data');
      }
    } catch (error: any) {
      console.error('Error fetching 6529 data:', error);
      showToast(error.message || 'Failed to load 6529 data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMemesBySeason = async (season: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/6529?action=memes&season=${season}`);
      const data = await response.json();
      
      if (response.ok) {
        setMemes(data.memes || []);
        setSelectedSeason(season);
      } else {
        throw new Error(data.error || 'Failed to fetch memes');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load memes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const searchMemes = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/6529?action=search&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (response.ok) {
        setMemes(data.results || []);
        showToast(`Found ${data.results?.length || 0} results`, 'success');
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error: any) {
      showToast(error.message || 'Search failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString();
  };

  return (
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">6529</h1>
          <p className="text-muted-foreground">The Memes by 6529</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('https://6529.io', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            6529.io
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Stats Cards - Single Line */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="py-2">
            <CardContent className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Memes</span>
              </div>
              <div className="text-lg font-bold">
                {walletStats ? `${walletStats.ownedCount}/403` : `0/403`}
              </div>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardContent className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Volume</span>
              </div>
              <div className="text-lg font-bold">{formatNumber(stats.total_volume)} ETH</div>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardContent className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Portfolio</span>
              </div>
              <div className="text-lg font-bold">
                {walletStats ? `${walletStats.portfolioValue.toFixed(2)} ETH` : '0 ETH'}
              </div>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardContent className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">To Complete</span>
              </div>
              <div className="text-lg font-bold">
                {walletStats ? `${walletStats.costToComplete.toFixed(2)} ETH` : '0 ETH'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wallet Manager - Collapsible */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setWalletManagerOpen(!walletManagerOpen)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Wallet Management</CardTitle>
            {walletManagerOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {walletManagerOpen && (
          <CardContent>
            <WalletManager allMemes={memes} onRefresh={fetchDashboardData} />
          </CardContent>
        )}
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memes">The Memes</TabsTrigger>
          <TabsTrigger value="activity">Wallet Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <WalletTracker allMemes={memes} onRefresh={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="memes" className="space-y-4">
          <MemesTable 
            memes={memes} 
            isLoading={isLoading}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <WalletSales allMemes={memes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}