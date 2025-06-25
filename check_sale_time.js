const ethers = require('ethers');

async function checkSaleTime() {
    // Connect to Sepolia
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/');
    
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
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSaleTime();
