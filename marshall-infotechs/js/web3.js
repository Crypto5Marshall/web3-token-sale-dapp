// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
    mainnet: {
        tokenSale: "YOUR_MAINNET_CONTRACT_ADDRESS",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    },
    sepolia: {
        tokenSale: "YOUR_SEPOLIA_CONTRACT_ADDRESS",
        usdt: "0x6175a8471C2122f4b44757c502CDf0C3D8F2E5d8"
    }
};

// Contract ABIs
const TOKEN_SALE_ABI = [
    // Buy function
    "function buy(uint256 usdtAmount) external nonReentrant",
    // Claim function
    "function claim(bytes32[] calldata proof, uint256 amount) external nonReentrant",
    // View functions
    "function tokenPrice() external view returns (uint256)",
    "function saleStartTime() external view returns (uint256)",
    "function saleEndTime() external view returns (uint256)",
    "function totalTokensSold() external view returns (uint256)",
    "function hardCap() external view returns (uint256)",
    "function perWalletLimit() external view returns (uint256)",
    // Events
    "event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 tokenAmount)",
    "event TokensClaimed(address indexed claimer, uint256 amount)"
];

const USDT_ABI = [
    // Standard ERC20 functions
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)"
];

class Web3Handler {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.network = 'mainnet';
        this.contracts = {};
        
        // Initialize Web3Modal
        this.web3Modal = new Web3Modal({
            cacheProvider: false,
            providerOptions: {} // Add more wallet options here
        });
    }

    /**
     * Connect to wallet and initialize contracts
     */
    async connect() {
        try {
            const instance = await this.web3Modal.connect();
            this.provider = new ethers.providers.Web3Provider(instance);
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();

            // Initialize contracts
            await this.initializeContracts();

            // Setup network change listener
            instance.on("chainChanged", this.handleChainChanged);
            instance.on("accountsChanged", this.handleAccountsChanged);

            return {
                address: this.userAddress,
                network: this.network
            };
        } catch (error) {
            console.error("Connection error:", error);
            throw error;
        }
    }

    /**
     * Initialize contract instances
     */
    async initializeContracts() {
        const chainId = (await this.provider.getNetwork()).chainId;
        this.network = chainId === 1 ? 'mainnet' : 'sepolia';

        const addresses = CONTRACT_ADDRESSES[this.network];
        
        this.contracts.tokenSale = new ethers.Contract(
            addresses.tokenSale,
            TOKEN_SALE_ABI,
            this.signer
        );

        this.contracts.usdt = new ethers.Contract(
            addresses.usdt,
            USDT_ABI,
            this.signer
        );
    }

    /**
     * Get sale status and configuration
     */
    async getSaleStatus() {
        try {
            const [
                startTime,
                endTime,
                price,
                totalSold,
                cap,
                walletLimit
            ] = await Promise.all([
                this.contracts.tokenSale.saleStartTime(),
                this.contracts.tokenSale.saleEndTime(),
                this.contracts.tokenSale.tokenPrice(),
                this.contracts.tokenSale.totalTokensSold(),
                this.contracts.tokenSale.hardCap(),
                this.contracts.tokenSale.perWalletLimit()
            ]);

            return {
                startTime: startTime.toNumber(),
                endTime: endTime.toNumber(),
                price: ethers.utils.formatUnits(price, 6),
                totalSold: ethers.utils.formatEther(totalSold),
                hardCap: ethers.utils.formatEther(cap),
                walletLimit: ethers.utils.formatEther(walletLimit)
            };
        } catch (error) {
            console.error("Error fetching sale status:", error);
            throw error;
        }
    }

    /**
     * Approve USDT spending
     */
    async approveUSDT(amount) {
        try {
            const usdtAmount = ethers.utils.parseUnits(amount.toString(), 6);
            const tx = await this.contracts.usdt.approve(
                CONTRACT_ADDRESSES[this.network].tokenSale,
                usdtAmount
            );
            return await tx.wait();
        } catch (error) {
            console.error("USDT approval error:", error);
            throw error;
        }
    }

    /**
     * Buy tokens with USDT
     */
    async buyTokens(amount) {
        try {
            const usdtAmount = ethers.utils.parseUnits(amount.toString(), 6);
            const tx = await this.contracts.tokenSale.buy(usdtAmount);
            return await tx.wait();
        } catch (error) {
            console.error("Token purchase error:", error);
            throw error;
        }
    }

    /**
     * Claim tokens with Merkle proof
     */
    async claimTokens(proof, amount) {
        try {
            const tx = await this.contracts.tokenSale.claim(proof, amount);
            return await tx.wait();
        } catch (error) {
            console.error("Token claim error:", error);
            throw error;
        }
    }

    /**
     * Check USDT allowance
     */
    async checkAllowance() {
        try {
            return await this.contracts.usdt.allowance(
                this.userAddress,
                CONTRACT_ADDRESSES[this.network].tokenSale
            );
        } catch (error) {
            console.error("Error checking allowance:", error);
            throw error;
        }
    }

    /**
     * Format error message for user display
     */
    static formatError(error) {
        if (error.code === 'ACTION_REJECTED') {
            return 'Transaction rejected by user';
        }
        if (error.code === 'INSUFFICIENT_FUNDS') {
            return 'Insufficient funds for transaction';
        }
        return error.message || 'Transaction failed';
    }

    /**
     * Handle chain/network changes
     */
    handleChainChanged() {
        window.location.reload();
    }

    /**
     * Handle wallet account changes
     */
    handleAccountsChanged() {
        window.location.reload();
    }
}

// Export for use in other files
window.Web3Handler = Web3Handler;
