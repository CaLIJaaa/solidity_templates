const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://arbitrum-mainnet.infura.io/v3/8619545429ba4c39a099b52e74641b56");

const ReaderAbi = [
    "function getMarkets(address dataStore, uint256 start, uint256 end) view returns (tuple(address marketToken, address indexToken, address longToken, address shortToken)[])"
  ];

const contractAddresss = "0x23D4Da5C7C6902D4C86d551CaE60d5755820df9E"

const ReaderContract = new ethers.Contract(contractAddresss, ReaderAbi, provider);



async function getMarkets() {
    const markets = await ReaderContract.getMarkets("ETH/ETH", 0, 1000)
    console.log(markets)
}

getMarkets()
  