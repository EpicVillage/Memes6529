# 6529 Memes Tracker

A Next.js application for tracking and analyzing the 6529 NFT collection.

## API Implementation

**Important Note:** The 6529 project does not provide a public API. The official 6529.io website uses private server-side APIs that are not accessible to third-party applications.

### Available Data Sources

Since there's no official 6529 public API, the application uses:

1. **OpenSea API** (optional, requires API key)
   - Collection data and NFT metadata
   - Real-time ownership data
   - Trading history and floor prices
   - Get API key from: https://docs.opensea.io/reference/api-keys

2. **Alchemy API** (optional, requires API key)
   - Alternative source for wallet NFTs
   - Direct blockchain data access
   - On-chain verification
   - Get API key from: https://www.alchemy.com/

3. **Sample Data** (default when no API keys)
   - Mimics the real 6529 Memes collection structure
   - 100 sample NFTs with realistic metadata
   - Allows testing without API access

### API Endpoints

The app exposes the following API routes:

- `GET /api/6529` - Main dashboard data (stats, memes, activity)
- `GET /api/6529?action=memes&season={1-4}` - Filter memes by season
- `GET /api/6529?action=search&q={query}` - Search memes by name/artist
- `GET /api/6529/wallet?wallet={address}` - Get wallet holdings

### Why No Direct 6529 API?

The 6529 ecosystem is built as a closed system where:
- The official website (6529.io) uses private backend APIs
- Data is rendered server-side and not exposed via public endpoints
- The community relies on blockchain data and third-party aggregators

This is why we use OpenSea/Alchemy APIs - they index the blockchain and provide the same data that 6529.io displays, just through different channels.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Configure API keys:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4567](http://localhost:4567)

## Features

- **Real-time Data**: Fetches live data from multiple sources
- **Wallet Tracking**: Monitor multiple wallets and their holdings
- **Collection Stats**: View floor prices, volume, and market metrics
- **Search & Filter**: Find specific memes by name, artist, or season
- **Responsive Design**: Works on desktop and mobile devices
- **Data Caching**: Implements smart caching to reduce API calls

## API Rate Limits

- Data is cached for 5 minutes (collection data)
- Wallet data is cached for 1 minute
- Respects rate limits of external APIs
- Implements exponential backoff for failed requests

## Environment Variables

Create a `.env.local` file with the following optional variables:

```env
OPENSEA_API_KEY=your_opensea_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
CUSTOM_6529_API=custom_endpoint_if_available
```

The app works without these keys but provides enhanced functionality when configured.