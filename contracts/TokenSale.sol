// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract TokenSale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Immutable addresses
    IERC20 public immutable usdt;
    IERC20 public immutable saleToken;

    // Sale configuration
    uint256 public tokenPrice; // Price in USDT (with 6 decimals)
    uint256 public hardCap;
    uint256 public perWalletLimit;
    uint256 public saleStartTime;
    uint256 public saleEndTime;

    // State variables
    uint256 public totalTokensSold;
    mapping(address => uint256) public purchasedAmounts;
    mapping(address => bool) public hasClaimed;
    bytes32 public merkleRoot;

    // Events
    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 tokenAmount);
    event TokensClaimed(address indexed claimer, uint256 amount);
    event PriceUpdated(uint256 newPrice);
    event SaleTimingUpdated(uint256 startTime, uint256 endTime);
    event MerkleRootUpdated(bytes32 newRoot);

    constructor() Ownable() {
        usdt = IERC20(0x973104fAa7F2B11787557e85953ECA6B4e262328); // Sepolia USDT
        saleToken = IERC20(0x28e24aD822d811cB2af812f23DA2E92dBf8Bc290); // Sale Token
        tokenPrice = 20000; // 0.02 USDT (6 decimals)
        hardCap = 1000000 * 10**18; // 1 million tokens
        perWalletLimit = 10000 * 10**18; // 10k tokens
        saleStartTime = block.timestamp + 1 hours;
        saleEndTime = saleStartTime + 7 days;
    }

    /**
     * @dev Modifier to check if sale is active
     */
    modifier saleIsActive() {
        require(block.timestamp >= saleStartTime, "Sale has not started");
        require(block.timestamp <= saleEndTime, "Sale has ended");
        _;
    }

    /**
     * @dev Function to buy tokens with USDT
     * @param usdtAmount Amount of USDT to spend
     */
    function buy(uint256 usdtAmount) external nonReentrant saleIsActive {
        require(usdtAmount > 0, "Amount must be greater than 0");
        
        // Calculate token amount: (USDT amount * sale token decimals) / (token price)
        uint256 tokenAmount = (usdtAmount * (10**18)) / tokenPrice;
        
        // Check limits
        require(totalTokensSold + tokenAmount <= hardCap, "Would exceed hard cap");
        uint256 newUserAmount = purchasedAmounts[msg.sender] + tokenAmount;
        require(newUserAmount <= perWalletLimit, "Would exceed wallet limit");

        // Transfer USDT from buyer to contract
        usdt.safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // Transfer tokens to buyer
        saleToken.safeTransfer(msg.sender, tokenAmount);
        
        // Update state
        totalTokensSold += tokenAmount;
        purchasedAmounts[msg.sender] = newUserAmount;
        
        emit TokensPurchased(msg.sender, usdtAmount, tokenAmount);
    }

    function claim(bytes32[] calldata proof, uint256 amount) external nonReentrant {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(merkleRoot != bytes32(0), "Merkle root not set");
        
        // Verify the merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        hasClaimed[msg.sender] = true;
        saleToken.safeTransfer(msg.sender, amount);
        
        emit TokensClaimed(msg.sender, amount);
    }

    function updateMerkleRoot(bytes32 newRoot) external onlyOwner {
        require(newRoot != bytes32(0), "Invalid root");
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");
        tokenPrice = newPrice;
        emit PriceUpdated(newPrice);
    }

    function updateSaleTiming(uint256 newStartTime, uint256 newEndTime) external onlyOwner {
        require(newStartTime > block.timestamp, "Invalid start time");
        require(newEndTime > newStartTime, "Invalid end time");
        saleStartTime = newStartTime;
        saleEndTime = newEndTime;
        emit SaleTimingUpdated(newStartTime, newEndTime);
    }

    function withdrawUSDT() external onlyOwner {
        uint256 balance = usdt.balanceOf(address(this));
        require(balance > 0, "No USDT to withdraw");
        usdt.safeTransfer(msg.sender, balance);
    }

    function withdrawUnsoldTokens() external onlyOwner {
        require(block.timestamp > saleEndTime, "Sale not ended");
        uint256 balance = saleToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        saleToken.safeTransfer(msg.sender, balance);
    }
}
