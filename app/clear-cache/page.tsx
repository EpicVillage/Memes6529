'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, CheckCircle } from 'lucide-react';

export default function ClearCachePage() {
  const [cleared, setCleared] = useState(false);

  const clearCache = () => {
    // Clear all 6529 related data from localStorage
    localStorage.removeItem('6529_wallets');
    localStorage.removeItem('6529_selected_wallets');
    localStorage.removeItem('6529_memes_cache');
    localStorage.removeItem('6529_memes_cache_time');
    
    setCleared(true);
    
    // Redirect to home page after 2 seconds
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Clear Wallet Cache
          </CardTitle>
          <CardDescription>
            Remove cached wallet data to fetch fresh data from blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!cleared ? (
            <>
              <p className="text-sm text-gray-400">
                This will clear all cached wallet data. You'll need to re-add your wallets after clearing.
              </p>
              <Button 
                onClick={clearCache}
                className="w-full"
                variant="destructive"
              >
                Clear Cache
              </Button>
            </>
          ) : (
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-green-500 font-semibold">Cache Cleared!</p>
              <p className="text-sm text-gray-400">Redirecting to main app...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}