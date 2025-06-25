const ethers = require('ethers');

async function checkSaleTime() {
    // Connect to Sepolia using Alchemy's public RPC URL
    const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
    
    // TokenSale contract address on Sepolia
    const tokenSaleAddress = "0x07305b106a19e2de7d51f57305c0dc9e0d54f3c8";
    
    // Contract ABI (only the functions we need)
    const abi = [
        "function saleStartTime() external view returns (uint256)",
        "function saleEndTime() external view returns (uint256)"
    ];
    
    // Create contract instance
    const tokenSale = new ethers.Contract(tokenSaleAddress, abi, provider);
    
    try {
        // Get sale timing
        const startTime = await tokenSale.saleStartTime();
        const endTime = await tokenSale.saleEndTime();
        
        console.log('Sale Start Time:', new Date(startTime * 1000).toLocaleString());
        console.log('Sale End Time:', new Date(endTime * 1000).toLocaleString());
        
        // Check if sale is active
        const now = Math.floor(Date.now() / 1000);
        if (now < startTime) {
            console.log('\nSale has not started yet. Time until start:', formatTimeRemaining(startTime - now));
        } else if (now > endTime) {
            console.log('\nSale has ended');
        } else {
            console.log('\nSale is active! Time remaining:', formatTimeRemaining(endTime - now));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function formatTimeRemaining(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

checkSaleTime();
