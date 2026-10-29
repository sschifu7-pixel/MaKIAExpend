// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * IAFantasma — pagos NFC en USDC.
 *
 * Cada tarjeta/pulsera NFC se identifica por keccak256(UID). El usuario recarga
 * saldo USDC a su tarjeta con `deposit`. Al acercar la tarjeta, la máquina
 * (cuenta `operator`) llama a `pay`, que descuenta el precio y emite `Paid`.
 */
contract VendingPayments {
    IERC20 public immutable usdc;
    address public owner;
    address public operator;

    mapping(bytes32 => uint256) public balanceOf; // cardId => USDC (6 decimales)
    mapping(uint8 => uint256) public priceOf;     // productId => USDC (6 decimales)

    event Deposited(bytes32 indexed cardId, address indexed from, uint256 amount);
    event Paid(bytes32 indexed cardId, uint8 indexed productId, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier onlyOperator() { require(msg.sender == operator, "not operator"); _; }

    constructor(address usdc_, address operator_) {
        usdc = IERC20(usdc_);
        owner = msg.sender;
        operator = operator_;
        priceOf[0] = 1_500_000; // Soda Web3     1.50 USDC
        priceOf[1] =   800_000; // Cyber Snack   0.80 USDC
        priceOf[2] = 2_200_000; // Crypto Energy 2.20 USDC
    }

    function deposit(bytes32 cardId, uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "transfer failed");
        balanceOf[cardId] += amount;
        emit Deposited(cardId, msg.sender, amount);
    }

    function pay(bytes32 cardId, uint8 productId) external onlyOperator {
        uint256 price = priceOf[productId];
        require(price > 0, "unknown product");
        require(balanceOf[cardId] >= price, "insufficient balance");
        balanceOf[cardId] -= price;
        emit Paid(cardId, productId, price);
    }

    function setPrice(uint8 productId, uint256 price) external onlyOwner { priceOf[productId] = price; }
    function setOperator(address operator_) external onlyOwner { operator = operator_; }
    function withdraw(address to, uint256 amount) external onlyOwner { require(usdc.transfer(to, amount), "transfer failed"); }
}
