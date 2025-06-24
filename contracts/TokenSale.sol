// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title TokenSale
 * @dev A contract for token sales with USDT payments and merkle-based claims
 */
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
    bytes32 public merkleRoot;

    // State variables
    uint256 public totalTokensSold;
    mapping(address => uint256) public purchasedAmounts;
    mapping(address => bool) public hasClaimed;

    // Events
    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 tokenAmount);
    event TokensClaimed(address indexed claimer, uint256 amount);
    event PriceUpdated(uint256 newPrice);
    event MerkleRootUpdated(bytes32 newRoot);
    event SaleTimingUpdated(uint256 startTime, uint256 endTime);

    /**
     * @dev Constructor to initialize the token sale contract
     * @param initialOwner Address of the contract owner
     * @param _usdt Address of the USDT token contract
     * @param _saleToken Address of the token being sold
     * @param _tokenPrice Initial price per token in USDT (6 decimals)
     * @param _hardCap Maximum number of tokens that can be sold
     * @param _perWalletLimit Maximum tokens that can be bought per wallet
     * @param _saleStartTime Unix timestamp when sale starts
     * @param _saleEndTime Unix timestamp when sale ends
     */
    constructor(
        address initialOwner,
        address _usdt,
        address _saleToken,
        uint256 _tokenPrice,
        uint256 _hardCap,
        uint256 _perWalletLimit,
        uint256 _saleStartTime,
        uint256 _saleEndTime
    ) Ownable(initialOwner) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_saleToken != address(0), "Invalid sale token address");
        require(_tokenPrice > 0, "Invalid token price");
        require(_hardCap > 0, "Invalid hard cap");
        require(_perWalletLimit > 0 && _perWalletLimit <= _hardCap, "Invalid wallet limit");
        require(_saleStartTime > block.timestamp, "Invalid start time");
        require(_saleEndTime > _saleStartTime, "Invalid end time");

        usdt = IERC20(_usdt);
        saleToken = IERC20(_saleToken);
        tokenPrice = _tokenPrice;
        hardCap = _hardCap;
        perWalletLimit = _perWalletLimit;
        saleStartTime = _saleStartTime;
        saleEndTime = _saleEndTime;
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

    /**
     * @dev Function to claim tokens using Merkle proof
     * @param proof Merkle proof of inclusion
     * @param amount Amount of tokens to claim
     */
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

    // Admin functions

    /**
     * @dev Update token price (only owner)
     * @param newPrice New price per token in USDT
     */
    function setPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");
        tokenPrice = newPrice;
        emit PriceUpdated(newPrice);
    }

    /**
     * @dev Update merkle root (only owner)
     * @param newRoot New merkle root
     */
    function updateMerkleRoot(bytes32 newRoot) external onlyOwner {
        require(newRoot != bytes32(0), "Invalid root");
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    /**
     * @dev Update sale timing (only owner)
     * @param newStartTime New start time
     * @param newEndTime New end time
     */
    function updateSaleTiming(uint256 newStartTime, uint256 newEndTime) external onlyOwner {
        require(newStartTime > block.timestamp, "Invalid start time");
        require(newEndTime > newStartTime, "Invalid end time");
        saleStartTime = newStartTime;
        saleEndTime = newEndTime;
        emit SaleTimingUpdated(newStartTime, newEndTime);
    }

    /**
     * @dev Withdraw collected USDT (only owner)
     */
    function withdrawUSDT() external onlyOwner {
        uint256 balance = usdt.balanceOf(address(this));
        require(balance > 0, "No USDT to withdraw");
        usdt.safeTransfer(msg.sender, balance);
    }

    /**
     * @dev Withdraw unsold tokens (only owner)
     */
    function withdrawUnsoldTokens() external onlyOwner {
        require(block.timestamp > saleEndTime, "Sale not ended");
        uint256 balance = saleToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        saleToken.safeTransfer(msg.sender, balance);
    }
}
