# 6529 Memes Tracker

A Next.js application for tracking and analyzing the 6529 NFT collection.

## API Implementation

The application connects to multiple data sources to fetch 6529 NFT data:

### Primary Data Sources

1. **6529 Official API** (`https://api.6529.io`)
   - Primary source for meme collection data
   - Wallet holdings and statistics
   - Real-time pricing information

2. **Seize.io API** (`https://api.seize.io`)
   - Fallback for collection statistics
   - NFT metadata and pricing
   - Market activity data

3. **OpenSea API** (optional, requires API key)
   - Enhanced wallet tracking
   - Real-time ownership data
   - Trading history

4. **Alchemy API** (optional, requires API key)
   - Alternative source for wallet NFTs
   - Metadata enrichment
   - On-chain data verification

### API Endpoints

The app exposes the following API routes:

- `GET /api/6529` - Main dashboard data (stats, memes, activity)
- `GET /api/6529?action=memes&season={1-4}` - Filter memes by season
- `GET /api/6529?action=search&q={query}` - Search memes by name/artist
- `GET /api/6529/wallet?wallet={address}` - Get wallet holdings

### Data Fallback Strategy

The app implements a multi-tier fallback system:

1. **Primary**: Real APIs (6529.io, Seize.io)
2. **Secondary**: Alternative APIs (OpenSea, Alchemy with API keys)

If all APIs fail, the app will return empty data rather than mock data, ensuring users only see real information.

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