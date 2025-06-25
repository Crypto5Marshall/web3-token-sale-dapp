// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenSaleLocked is Ownable, ReentrancyGuard {
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
    uint256 public constant LOCK_PERIOD = 360 days;

    // State variables
    uint256 public totalTokensSold;
    mapping(address => uint256) public purchasedAmounts;
    mapping(address => uint256) public purchaseTimestamps;
    mapping(address => uint256) public claimedAmounts;

    // Events
    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 tokenAmount);
    event TokensClaimed(address indexed claimer, uint256 amount);
    event PriceUpdated(uint256 newPrice);
    event SaleTimingUpdated(uint256 startTime, uint256 endTime);

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
        
        // Update state
        totalTokensSold += tokenAmount;
        purchasedAmounts[msg.sender] = newUserAmount;
        purchaseTimestamps[msg.sender] = block.timestamp;
        
        emit TokensPurchased(msg.sender, usdtAmount, tokenAmount);
    }

    /**
     * @dev Function to claim purchased tokens after lock period
     */
    function claim() external nonReentrant {
        uint256 purchasedAmount = purchasedAmounts[msg.sender];
        uint256 alreadyClaimed = claimedAmounts[msg.sender];
        uint256 remainingAmount = purchasedAmount - alreadyClaimed;
        
        require(remainingAmount > 0, "No tokens to claim");
        require(block.timestamp >= purchaseTimestamps[msg.sender] + LOCK_PERIOD, "Tokens are still locked");

        claimedAmounts[msg.sender] = purchasedAmount;
        saleToken.safeTransfer(msg.sender, remainingAmount);
        
        emit TokensClaimed(msg.sender, remainingAmount);
    }

    /**
     * @dev Function to check claimable amount and remaining lock time
     */
    function getClaimInfo(address user) external view returns (uint256 claimable, uint256 timeRemaining) {
        uint256 purchasedAmount = purchasedAmounts[user];
        uint256 alreadyClaimed = claimedAmounts[user];
        claimable = purchasedAmount - alreadyClaimed;
        
        uint256 unlockTime = purchaseTimestamps[user] + LOCK_PERIOD;
        if (block.timestamp < unlockTime) {
            timeRemaining = unlockTime - block.timestamp;
        } else {
            timeRemaining = 0;
        }
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
        uint256 requiredBalance = totalTokensSold;
        require(balance > requiredBalance, "No excess tokens to withdraw");
        saleToken.safeTransfer(msg.sender, balance - requiredBalance);
    }
}
