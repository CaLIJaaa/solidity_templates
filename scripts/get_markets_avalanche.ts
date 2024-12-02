import { ethers } from "ethers";


const PROVIDER_URL = "";
const READER_ADDRESS = "0x16Fb5b8846fbfAe09c034fCdF3D3F9492484DA80"; // Reader 
const DATASTORE_ADDRESS = "0xEA1BFb4Ea9A412dCCd63454AbC127431eBB0F0d4"; // DataStore 

const READER_ABI = [
  "function getMarkets(address dataStore, uint256 start, uint256 end) view returns (tuple(address marketToken, address indexToken, address longToken, address shortToken)[])"
];

async function getMarkets() {
  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

  const readerContract = new ethers.Contract(READER_ADDRESS, READER_ABI, provider);

  try {
    const markets = await readerContract.getMarkets(DATASTORE_ADDRESS, 0, 1000);

    console.log("Markets:", markets);

    const ethUsdcMarket = markets.find(
      (market: any) =>
        market.indexToken.toLowerCase() === "0x82F0b3695Ed2324e55bbD9A9554cB4192EC3a514".toLowerCase() && // WETH
        market.shortToken.toLowerCase() === "0x3eBDeaA0DB3FfDe96E7a0DBBAFEC961FC50F725F".toLowerCase() // USDC
    );

    if (ethUsdcMarket) {
      console.log("ETH/USDC Market:", ethUsdcMarket);
    } else {
      console.log("ETH/USDC Market not found");
    }
  } catch (error) { 
    console.error("Error fetching markets:", error);
  }
}

getMarkets().catch(console.error);
