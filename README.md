# Web3 Token Sale dApp

A production-grade Web3 dApp for token sales using USDT payments and Merkle-based claims. Built with Solidity, Hardhat, and modern web technologies.

## Features

- ERC-20 token sale contract accepting USDT as payment
- Configurable token price, hard cap, and per-wallet limits
- Sale period with start and end times
- Merkle Tree-based whitelist for token claims
- Modern, responsive UI built with Tailwind CSS
- Web3Modal integration for multiple wallet support
- Support for both Ethereum mainnet and Sepolia testnet

## Project Structure

```
├── contracts/
│   ├── TokenSale.sol          # Main token sale contract
│   └── mocks/
│       └── MockERC20.sol      # Mock ERC20 for testing
├── scripts/
│   └── deploy.js              # Deployment script
├── test/
│   └── TokenSale.test.js      # Contract tests
├── marshall-infotechs/        # Frontend files
│   ├── index.html            # Landing page
│   ├── buy.html             # Token purchase page
│   ├── claim.html           # Token claim page
│   └── js/
│       └── web3.js          # Web3 utilities
└── hardhat.config.js         # Hardhat configuration
```

## Prerequisites

- Node.js v14+ and npm
- An Ethereum wallet (e.g., MetaMask)
- Infura API key or alternative RPC provider
- Etherscan API key (for contract verification)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web3-token-sale
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
- Add your RPC URLs (Infura or alternative provider)
- Add your deployment wallet's private key
- Add your Etherscan API key
- Configure sale parameters (token address, price, caps, etc.)

## Smart Contract Development

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Deploy Contracts

To Sepolia testnet:
```bash
npm run deploy:sepolia
```

To Ethereum mainnet:
```bash
npm run deploy:mainnet
```

### Verify Contracts

After deployment, verify the contract on Etherscan:
```bash
npm run verify:sepolia <contract-address>
# or
npm run verify:mainnet <contract-address>
```

## Frontend Development

The frontend is built with vanilla JavaScript and Tailwind CSS for simplicity and ease of deployment. To serve the frontend locally:

```bash
npm run serve
```

This will start a local server at http://localhost:8000

## Contract Configuration

The TokenSale contract accepts the following parameters during deployment:

- `USDT_ADDRESS`: Address of the USDT token contract
- `SALE_TOKEN_ADDRESS`: Address of the token being sold
- `TOKEN_PRICE`: Price per token in USDT (with 6 decimals)
- `HARD_CAP`: Maximum number of tokens that can be sold
- `PER_WALLET_LIMIT`: Maximum tokens that can be bought per wallet
- `SALE_START_TIME`: Unix timestamp when sale starts
- `SALE_END_TIME`: Unix timestamp when sale ends

## Security Considerations

- The contract uses OpenZeppelin's secure implementations of standard patterns
- ReentrancyGuard is implemented to prevent reentrancy attacks
- SafeERC20 is used for secure token transfers
- Merkle Tree verification for secure claims
- All state-changing functions have appropriate access controls
- Comprehensive test coverage for all contract functions

## Frontend Features

### Buy Page
- Wallet connection via Web3Modal
- Network selection (Mainnet/Sepolia)
- Real-time price calculations
- USDT approval and purchase in two steps
- Transaction status notifications
- Sale countdown timer

### Claim Page
- Merkle proof verification
- One-time claim function
- Real-time claim status updates
- Transaction status notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
