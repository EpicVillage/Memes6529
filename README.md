# The Memes by 6529 - Collection Tracker

A web application for tracking The Memes by 6529 NFT collection on Ethereum. View collection stats, track wallet holdings, and monitor your progress toward completing the collection.

## Features

- **Collection Overview**: Browse all 403 Memes with real-time pricing data
- **Wallet Tracking**: Add multiple wallets to track your NFT holdings
- **Portfolio Analytics**: View total portfolio value and cost to complete collection
- **Real-time Data**: Fresh pricing data from Seize.io API
- **Dark/Light Mode**: Full theme support for comfortable viewing
- **Smart Caching**: Metadata cached for performance, prices always fresh
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Blockchain**: Ethers.js for Ethereum interactions
- **Data Source**: Seize.io API for NFT collection data
- **UI Components**: Radix UI primitives with custom styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/EpicVillage/Memes6529.git
cd Memes6529
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:4567](http://localhost:4567) in your browser

## Usage

### Adding Wallets
1. Click on "Wallet Management" section
2. Enter wallet address or ENS name
3. Click "Check Wallet" to fetch NFT holdings
4. Select wallets to include in portfolio tracking

### Viewing Collection
- **Overview Tab**: See your wallet holdings and missing NFTs
- **The Memes Tab**: Browse entire collection with sorting and filtering
- Owned NFTs are highlighted in green

### Features
- **Search**: Find specific memes by name, artist, or number
- **Sort**: Order by card number, name, floor price, or highest offer
- **Filter**: View specific seasons (1-4)
- **Refresh**: Update prices and wallet holdings with refresh button

## API Endpoints

- `/api/6529` - Main collection data and stats
- `/api/6529/wallet` - Wallet holdings checker

## Caching Strategy

- **Metadata** (images, names, artists): Cached for 7 days
- **Prices & Stats**: Always fetched fresh
- **Wallet Holdings**: Refreshed on demand

## Links

- [The Memes Collection](https://6529.io)
- [OpenSea Collection](https://opensea.io/collection/the-memes-by-6529)
- [GitHub Repository](https://github.com/EpicVillage/Memes6529)

## Credits

Made with ❤️ by [EpicVillage](https://x.com/Epicvillages)

## License

MIT