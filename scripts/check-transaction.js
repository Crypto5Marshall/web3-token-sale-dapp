const { ethers } = require("hardhat");

async function main() {
    // Transaction hash from the purchase
    const txHash = "0xb866e9866597ff5ccdfdb74ebcba356474b2c7f7f7cb1712f1dbee638784d355";
    
    // Connect to Sepolia
    const provider = new ethers.providers.JsonRpcProvider("https://eth-sepolia.public.blastapi.io");
    
    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    // Contract interfaces
    const TokenSaleABI = [
        "function buy(uint256 usdtAmount) external",
        "event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 tokenAmount)"
    ];
    const ERC20ABI = [
        "function transfer(address to, uint256 amount) external returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    
    // Contract instances
    const tokenSale = new ethers.Contract("0xbc485534dab82189644377E2C6a0331EaD288812", TokenSaleABI, provider);
    const usdt = new ethers.Contract("0x973104fAa7F2B11787557e85953ECA6B4e262328", ERC20ABI, provider);
    
    // Parse logs
    const tokenSaleLogs = receipt.logs
        .filter(log => log.address.toLowerCase() === tokenSale.address.toLowerCase())
        .map(log => {
            try {
                return tokenSale.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        })
        .filter(Boolean);

    const usdtLogs = receipt.logs
        .filter(log => log.address.toLowerCase() === usdt.address.toLowerCase())
        .map(log => {
            try {
                return usdt.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        })
        .filter(Boolean);
    
    console.log("Transaction Details:");
    console.log("-------------------");
    console.log("From:", tx.from);
    console.log("To:", tx.to);
    console.log("Value:", ethers.utils.formatEther(tx.value), "ETH");
    console.log("\nTokenSale Events:");
    console.log("---------------");
    tokenSaleLogs.forEach(log => {
        console.log("Event:", log.name);
        console.log("USDT Amount:", ethers.utils.formatUnits(log.args.usdtAmount, 6));
        console.log("Token Amount:", ethers.utils.formatEther(log.args.tokenAmount));
    });
    
    console.log("\nUSDT Transfers:");
    console.log("--------------");
    usdtLogs.forEach(log => {
        console.log("From:", log.args.from);
        console.log("To:", log.args.to);
        console.log("Amount:", ethers.utils.formatUnits(log.args.value, 6), "USDT");
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
