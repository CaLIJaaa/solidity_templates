const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const provider = new ethers.JsonRpcProvider("https://arb-sepolia.g.alchemy.com/v2/3fZE8g3WdRYEWTk2guGpWNgSeqnNo0Q7");

    const contractAddr = "0x8aB7926DB1f4BD324ef46cD4ab80025a8b7ad9E8"

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_ARBITRUM_SEPOLIA, provider);

     // Одобрение USDC
  const erc20Abi = [
        "function approve(address spender, uint256 amount) public returns (bool)"
    ];
    const usdcContract = new ethers.Contract("0xD32ea1C76ef1c296F131DD4C5B2A0aac3b22485a", erc20Abi, wallet);
    await usdcContract.approve("0xa91176BD792a6Ce23132eeaa73CB17b5fe417B62", 50000000);
    console.log("Одобрено!");

    const contractABI = [
        "function depositUSDC(uint256 amount) external"
    ];

    // Создайте объект контракта
    const depositContract = new ethers.Contract("0xa91176BD792a6Ce23132eeaa73CB17b5fe417B62", contractABI, wallet);
    await depositContract.depositUSDC(50000000);
    console.log("USDC успешно переведены на контракт!");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });