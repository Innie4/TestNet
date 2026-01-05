# Tethereum (T99) - Coinbase Wallet Integration

A Next.js application that integrates with Coinbase Wallet to interact with the Tethereum (T99) token on the BNB Smart Chain (BSC).

## Features

- 🔗 **Coinbase Wallet Handshake**: Secure connection to Coinbase Wallet
- 💰 **TETH Token Balance**: Display your Tethereum token balance
- 📊 **Real-time Price**: Fetch and display current TETH price from DEXScreener API
- 💵 **USD Valuation**: Calculate USD value of your TETH holdings
- 🔄 **Network Switching**: Automatic BSC network detection and switching
- 📱 **Responsive Design**: Modern, beautiful UI with gradient backgrounds

## Prerequisites

- Node.js 18+ installed
- Coinbase Wallet browser extension installed
- A wallet with BNB for gas fees (if you want to interact with the contract)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Innie4/TestNet.git
cd TestNet
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Connect Wallet**: Click the "Connect Coinbase Wallet" button
2. **Approve Connection**: Approve the connection request in your Coinbase Wallet
3. **Switch Network**: If you're not on BSC, the app will prompt you to switch
4. **View Balance**: Your TETH balance and USD value will be displayed automatically
5. **Refresh**: Click "Refresh Balance" to update your balance manually

## Technical Details

### Token Information
- **Contract Address**: `0xc98cf0876b23fb1f574be5c59e4217c80b34d327`
- **Network**: BNB Smart Chain (Chain ID: 56)
- **Token Standard**: BEP-20 (ERC-20 compatible)

### Technologies Used
- **Next.js 14**: React framework with App Router
- **Coinbase Wallet SDK**: Wallet connection and interaction
- **Ethers.js v5**: Blockchain interaction and contract calls
- **TypeScript**: Type-safe development
- **DEXScreener API**: Price data fetching

### Project Structure
```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── lib/
│   ├── constants.ts        # Contract addresses and network config
│   ├── coinbaseWallet.ts   # Coinbase Wallet initialization
│   ├── tethToken.ts        # TETH token interaction functions
│   └── priceFetcher.ts     # Price fetching utilities
└── package.json
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect Next.js and deploy

Or use Vercel CLI:
```bash
npm i -g vercel
vercel
```

## Security Notes

- Never commit private keys or sensitive information
- Always verify contract addresses before interacting
- The app uses read-only operations by default
- Network switching requires user approval

## Troubleshooting

### Wallet Not Detected
- Ensure Coinbase Wallet extension is installed and enabled
- Refresh the page after installing the extension

### Network Switch Failed
- Manually switch to BNB Smart Chain in your wallet
- Ensure you have BNB for gas fees

### Balance Not Loading
- Check that you're connected to BSC network
- Verify the contract address is correct
- Check browser console for errors

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
