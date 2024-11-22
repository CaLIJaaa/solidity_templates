import "dotenv/config"
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

import "./tasks/sample"

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    arbitrumSepolia: {
      url: `${process.env.ALCHEMY_ARBITRUM_SEPOLIA_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY_ARBITRUM_SEPOLIA}`],
    },
    // sepolia: {
    //   url: `${process.env.ALCHEMY_SEPOLIA_URL}`,
    //   accounts: [`0x${process.env.PRIVATE_KEY_SEPOLIA}`],
    // },
    hardhat: {
      chainId: 1337,
      initialBaseFeePerGas: 0,
    }
  },
  etherscan: {
    apiKey: {
      sepolia: `${process.env.ETHERSCAN_API_KEY}`,
      arbitrumSepolia: `${process.env.ARBSCAN_API_KEY}`,
    }
  }
};

export default config;
