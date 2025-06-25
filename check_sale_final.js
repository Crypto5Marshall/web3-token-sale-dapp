const { Web3 } = require('web3');

async function checkSaleTime() {
    // Connect to Sepolia using public RPC
    const web3 = new Web3('https://eth-sepolia.public.blastapi.io');
    
    // TokenSale contract address on Sepolia
    const tokenSaleAddress = "0x07305b106a19e2de7d51f57305c0dc9e0d54f3c8";
    
    // Contract ABI (only the functions we need)
    const abi = [
        {
            "inputs": [],
            "name": "saleStartTime",
            "outputs": [{"type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "saleEndTime",
            "outputs": [{"type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    // Create contract instance
    const tokenSale = new web3.eth.Contract(abi, tokenSaleAddress);
    
    try {
        // Get sale timing
        const startTime = await tokenSale.methods.saleStartTime().call();
        const endTime = await tokenSale.methods.saleEndTime().call();
        
        console.log('Sale Start Time:', new Date(Number(startTime) * 1000).toLocaleString());
        console.log('Sale End Time:', new Date(Number(endTime) * 1000).toLocaleString());
        
        // Check if sale is active
        const now = Math.floor(Date.now() / 1000);
        if (now < Number(startTime)) {
            console.log('\nSale has not started yet. Time until start:', formatTimeRemaining(Number(startTime) - now));
        } else if (now > Number(endTime)) {
            console.log('\nSale has ended');
        } else {
            console.log('\nSale is active! Time remaining:', formatTimeRemaining(Number(endTime) - now));
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
