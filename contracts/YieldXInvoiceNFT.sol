// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title YieldXInvoiceNFT
 * @notice NFT contract for tokenized African export invoices with IPFS integration
 * @dev Each NFT represents a real-world trade invoice with embedded metadata
 */
contract YieldXInvoiceNFT {
    string public name = "YieldX Invoice NFT";
    string public symbol = "YXNFT";
    
    uint256 private _tokenIdCounter = 1;
    address public protocol;
    
    // IPFS metadata structure for Pinata integration
    struct IPFSMetadata {
        string imageHash;      // IPFS hash for NFT image
        string metadataHash;   // IPFS hash for complete metadata JSON
        string documentHash;   // IPFS hash for original invoice document
        uint256 lastUpdated;
        bool isUploaded;
    }
    
    // Core NFT data mappings
    mapping(uint256 => address) public tokenOwner;
    mapping(uint256 => string) public commodity;
    mapping(uint256 => uint256) public amount;
    mapping(uint256 => string) public exporterName;
    mapping(uint256 => string) public buyerName;
    mapping(uint256 => string) public destination;
    mapping(uint256 => uint256) public dueDate;
    mapping(uint256 => uint8) public status; 
    // Status: 0=Pending, 1=Chainlink Verified, 2=Committee Approved, 3=Investment Live, 4=Funded, 5=Completed
    mapping(uint256 => uint256) public createdAt;
    mapping(uint256 => uint256) public riskScore;
    mapping(uint256 => uint256) public finalAPR;
    
    // IPFS data mapping
    mapping(uint256 => IPFSMetadata) public ipfsData;
    
    // Approval mappings for ERC721 compatibility
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    // Events
    event InvoiceNFTMinted(uint256 indexed tokenId, address indexed to, string commodity, uint256 amount);
    event InvoiceStatusUpdated(uint256 indexed tokenId, uint8 newStatus);
    event InvoiceVerified(uint256 indexed tokenId, uint256 riskScore, uint256 apr);
    event IPFSMetadataUpdated(uint256 indexed tokenId, string imageHash, string metadataHash);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    modifier onlyProtocol() {
        require(msg.sender == protocol, "Not protocol");
        _;
    }
    
    modifier onlyTokenOwner(uint256 tokenId) {
        require(tokenOwner[tokenId] == msg.sender, "Not token owner");
        _;
    }
    
    constructor() {}
    
    // UPDATED: Added setProtocolAddress function for YieldXCore compatibility
    function setProtocolAddress(address _protocol) external {
        require(protocol == address(0), "Protocol already set");
        protocol = _protocol;
    }
    
    // Keep the old function for backward compatibility
    function setProtocol(address _protocol) external {
        require(protocol == address(0), "Protocol already set");
        protocol = _protocol;
    }
    
    function getProtocol() external view returns (address) {
        return protocol;
    }
    
    /**
     * @notice Convert uint256 to string (MOVED TO TOP)
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @notice Generate fallback metadata if IPFS not available (MOVED UP)
     */
    function _generateFallbackMetadata(uint256 tokenId) internal view returns (string memory) {
        return string(abi.encodePacked(
            "data:application/json,{",
            '"name":"YieldX Invoice #', _toString(tokenId), '",',
            '"description":"Tokenized African trade finance invoice - ', commodity[tokenId], '",',
            '"image":"data:image/svg+xml;base64,..."',
            "}"
        ));
    }
    
    /**
     * @notice Check if spender is approved or owner (MOVED UP)
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        address owner = tokenOwner[tokenId];
        return (spender == owner || 
                _tokenApprovals[tokenId] == spender || 
                _operatorApprovals[owner][spender]);
    }
    
    /**
     * @notice Mint a new invoice NFT with document hash - Original function
     */
    function mintInvoiceNFT(
        address to,
        string memory _commodity,
        uint256 _amount,
        string memory _exporterName,
        string memory _buyerName,
        string memory _destination,
        uint256 _dueDate,
        string memory _documentHash
    ) external onlyProtocol returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        // Store core data
        tokenOwner[tokenId] = to;
        commodity[tokenId] = _commodity;
        amount[tokenId] = _amount;
        exporterName[tokenId] = _exporterName;
        buyerName[tokenId] = _buyerName;
        destination[tokenId] = _destination;
        dueDate[tokenId] = _dueDate;
        status[tokenId] = 0; // Pending
        createdAt[tokenId] = block.timestamp;
        riskScore[tokenId] = 0;
        finalAPR[tokenId] = 0;
        
        // Initialize IPFS data with document hash
        ipfsData[tokenId] = IPFSMetadata({
            imageHash: "",
            metadataHash: "",
            documentHash: _documentHash,
            lastUpdated: block.timestamp,
            isUploaded: false
        });
        
        emit Transfer(address(0), to, tokenId);
        emit InvoiceNFTMinted(tokenId, to, _commodity, _amount);
        return tokenId;
    }
    
    // ADDED: Additional mint function that matches the YieldXCore contract call signature
    function mintToSupplier(
        address to,
        uint256 invoiceId,
        string memory _commodity,
        uint256 _amount,
        string memory _exporterName,
        string memory _buyerName,
        string memory _destination,
        uint256 _dueDate,
        uint8 _status,
        uint256 _createdAt,
        uint256 _riskScore,
        uint256 _finalAPR
    ) external onlyProtocol returns (uint256) {
        uint256 tokenId = invoiceId; // Use invoiceId as tokenId for consistency
        
        // Store core data
        tokenOwner[tokenId] = to;
        commodity[tokenId] = _commodity;
        amount[tokenId] = _amount;
        exporterName[tokenId] = _exporterName;
        buyerName[tokenId] = _buyerName;
        destination[tokenId] = _destination;
        dueDate[tokenId] = _dueDate;
        status[tokenId] = _status;
        createdAt[tokenId] = _createdAt;
        riskScore[tokenId] = _riskScore;
        finalAPR[tokenId] = _finalAPR;
        
        // Initialize IPFS data
        ipfsData[tokenId] = IPFSMetadata({
            imageHash: "",
            metadataHash: "",
            documentHash: "",
            lastUpdated: block.timestamp,
            isUploaded: false
        });
        
        // Update counter if needed
        if (tokenId >= _tokenIdCounter) {
            _tokenIdCounter = tokenId + 1;
        }
        
        emit Transfer(address(0), to, tokenId);
        emit InvoiceNFTMinted(tokenId, to, _commodity, _amount);
        return tokenId;
    }
    
    /**
     * @notice Update IPFS metadata after Pinata upload
     */
    function updateIPFSMetadata(
        uint256 tokenId,
        string memory _imageHash,
        string memory _metadataHash
    ) external onlyProtocol {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        ipfsData[tokenId].imageHash = _imageHash;
        ipfsData[tokenId].metadataHash = _metadataHash;
        ipfsData[tokenId].lastUpdated = block.timestamp;
        ipfsData[tokenId].isUploaded = true;
        
        emit IPFSMetadataUpdated(tokenId, _imageHash, _metadataHash);
    }
    
    /**
     * @notice Update invoice verification data
     */
    function updateInvoiceVerification(
        uint256 tokenId,
        uint256 _riskScore,
        uint256 _finalAPR
    ) external onlyProtocol {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        riskScore[tokenId] = _riskScore;
        finalAPR[tokenId] = _finalAPR;
        
        emit InvoiceVerified(tokenId, _riskScore, _finalAPR);
    }
    
    /**
     * @notice Update invoice status
     */
    function updateStatus(uint256 tokenId, uint8 newStatus) external onlyProtocol {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        status[tokenId] = newStatus;
        emit InvoiceStatusUpdated(tokenId, newStatus);
    }
    
    /**
     * @notice ERC721 transfer function
     */
    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");
        require(from == tokenOwner[tokenId], "From address incorrect");
        require(to != address(0), "Cannot transfer to zero address");
        
        // Clear approvals
        _tokenApprovals[tokenId] = address(0);
        
        // Update ownership
        tokenOwner[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    /**
     * @notice ERC721 safe transfer function
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        this.transferFrom(from, to, tokenId);
    }
    
    /**
     * @notice ERC721 approve function
     */
    function approve(address to, uint256 tokenId) external {
        require(tokenOwner[tokenId] == msg.sender || _operatorApprovals[tokenOwner[tokenId]][msg.sender], 
                "Not owner or operator");
        
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner[tokenId], to, tokenId);
    }
    
    /**
     * @notice ERC721 set approval for all
     */
    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    // ADDED: Enhanced view functions to match YieldXCore expectations
    
    /**
     * @notice Get basic invoice information - Split to avoid stack too deep
     */
    function getInvoiceBasicData(uint256 tokenId) external view returns (
        string memory commodityType,
        uint256 invoiceAmount,
        string memory exporter,
        string memory buyer
    ) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        return (
            commodity[tokenId],
            amount[tokenId],
            exporterName[tokenId],
            buyerName[tokenId]
        );
    }
    
    /**
     * @notice Get invoice timing and status data
     */
    function getInvoiceStatusData(uint256 tokenId) external view returns (
        string memory dest,
        uint256 due,
        uint8 currentStatus,
        uint256 created
    ) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        return (
            destination[tokenId],
            dueDate[tokenId],
            status[tokenId],
            createdAt[tokenId]
        );
    }
    
    /**
     * @notice Get invoice risk and financial data
     */
    function getInvoiceRiskData(uint256 tokenId) external view returns (
        uint256 risk,
        uint256 apr
    ) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        return (
            riskScore[tokenId],
            finalAPR[tokenId]
        );
    }
    
    /**
     * @notice Get basic invoice information - Original function (KEPT FOR COMPATIBILITY)
     */
    function getInvoiceData(uint256 tokenId) external view returns (
        string memory commodityType,
        uint256 invoiceAmount,
        string memory exporter,
        string memory buyer,
        string memory dest,
        uint256 due,
        uint8 currentStatus,
        uint256 created,
        uint256 risk,
        uint256 apr
    ) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        return (
            commodity[tokenId],
            amount[tokenId],
            exporterName[tokenId],
            buyerName[tokenId],
            destination[tokenId],
            dueDate[tokenId],
            status[tokenId],
            createdAt[tokenId],
            riskScore[tokenId],
            finalAPR[tokenId]
        );
    }
    
    /**
     * @notice Get IPFS metadata for a token
     */
    function getIPFSData(uint256 tokenId) external view returns (
        string memory imageHash,
        string memory metadataHash,
        string memory documentHash,
        uint256 lastUpdated,
        bool isUploaded
    ) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        IPFSMetadata memory ipfs = ipfsData[tokenId];
        return (
            ipfs.imageHash,
            ipfs.metadataHash,
            ipfs.documentHash,
            ipfs.lastUpdated,
            ipfs.isUploaded
        );
    }
    
    /**
     * @notice ERC721 tokenURI function - returns IPFS metadata URL
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        string memory metadataHash = ipfsData[tokenId].metadataHash;
        if (bytes(metadataHash).length > 0) {
            return string(abi.encodePacked("ipfs://", metadataHash));
        }
        
        // Fallback to generated metadata if IPFS not set
        return _generateFallbackMetadata(tokenId);
    }
    
    /**
     * @notice Get approved address for token
     */
    function getApproved(uint256 tokenId) external view returns (address) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }
    
    /**
     * @notice Check if operator is approved for all tokens of owner
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    
    /**
     * @notice Check if a token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return tokenOwner[tokenId] != address(0);
    }
    
    /**
     * @notice Get the owner of a token
     */
    function ownerOf(uint256 tokenId) external view returns (address) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        return tokenOwner[tokenId];
    }
    
    /**
     * @notice Get balance of owner
     */
    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "Zero address");
        
        uint256 count = 0;
        uint256 totalTokens = _tokenIdCounter - 1;
        
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (tokenOwner[i] == owner) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @notice Get total number of tokens minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @notice ERC165 support interface
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x80ac58cd || // ERC721
               interfaceId == 0x5b5e139f || // ERC721Metadata
               interfaceId == 0x01ffc9a7;   // ERC165
    }
}