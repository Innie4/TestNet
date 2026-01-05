# Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Coinbase Wallet browser extension installed
- Git installed

### Installation & Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/Innie4/TestNet.git
   cd TestNet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Testing the Application

1. **Make sure Coinbase Wallet is installed**:
   - Install from [Coinbase Wallet Extension](https://www.coinbase.com/wallet)

2. **Connect your wallet**:
   - Click "Connect Coinbase Wallet" button
   - Approve the connection in your wallet popup

3. **Switch to BNB Smart Chain**:
   - If prompted, approve the network switch
   - The app will automatically switch to BSC (Chain ID: 56)

4. **View your TETH balance**:
   - Your balance will be displayed automatically
   - Price updates every 30 seconds
   - Click "Refresh Balance" to manually update

### Building for Production

```bash
npm run build
npm start
```

### Running Regression Tests

```bash
node test-regression.js
```

## 🧪 Testing Checklist

- [x] Project builds successfully
- [x] All dependencies installed
- [x] TypeScript compilation passes
- [x] ESLint passes
- [x] All regression tests pass
- [x] Wallet connection works
- [x] Network switching works
- [x] Balance fetching works
- [x] Price fetching works

## 📝 Notes

- The app uses DEXScreener API for price data
- Fallback price: $0.0001395
- Contract address: `0xc98cf0876b23fb1f574be5c59e4217c80b34d327`
- Network: BNB Smart Chain (BSC)

## 🐛 Troubleshooting

**Wallet not detected:**
- Ensure Coinbase Wallet extension is installed and enabled
- Refresh the page after installing

**Network switch failed:**
- Manually switch to BNB Smart Chain in your wallet
- Ensure you have BNB for gas fees

**Build errors:**
- Run `npm install` again
- Clear `.next` folder and rebuild

