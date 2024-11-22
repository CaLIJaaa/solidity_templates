import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY_SEPOLIA = process.env.PRIVATE_KEY_SEPOLIA;
const ARBITRUM_SEPOLIA_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL;

if (!PRIVATE_KEY_SEPOLIA || !ARBITRUM_SEPOLIA_RPC_URL) {
  throw new Error(
    "Пожалуйста, установите PRIVATE_KEY_SEPOLIA и ARBITRUM_SEPOLIA_RPC_URL в вашем .env файле"
  );
}


const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC_URL);

const signer = new ethers.Wallet(PRIVATE_KEY_SEPOLIA, provider);

const vertexEndpointAddress = "0xaDeFDE1A14B6ba4DA3e82414209408a49930E8DC"; // Vertex Endpoint

const extendedVertexEndpointAbi = [
  "function depositCollateral(bytes12 subaccountName, uint32 productId, uint128 amount) external",
  "function getPriceX18(uint32 productId) external view returns (int128)",
  "function updatePrice(uint32 productId, int128 priceX18) external",
  "function clearinghouse() external view returns (address)",
];

const vertexEndpointContract = new ethers.Contract(
  vertexEndpointAddress,
  extendedVertexEndpointAbi,
  signer
);

async function depositToken() {
  try {
    const clearinghouseAddress = await vertexEndpointContract.clearinghouse();
    console.log(`Адрес Clearinghouse: ${clearinghouseAddress}`);

    const clearinghouseAbi = [
      "function getEngineByType(uint8 engineType) external view returns (address)",
    ];
    const clearinghouseContract = new ethers.Contract(
      clearinghouseAddress,
      clearinghouseAbi,
      signer
    );

    const EngineType = {
      SPOT: 0,
      PERP: 1,
    };
    const spotEngineAddress = await clearinghouseContract.getEngineByType(
      EngineType.SPOT
    );
    console.log(`Адрес SpotEngine: ${spotEngineAddress}`);

    const spotEngineAbi = [
      "function getProductIds() external view returns (uint32[])",
      "function getToken(uint32 productId) external view returns (address)",
    ];
    const spotEngineContract = new ethers.Contract(
      spotEngineAddress,
      spotEngineAbi,
      signer
    );

    const productId = 0;

    const tokenAddress = await spotEngineContract.getToken(productId);
    console.log(`Адрес токена для productId ${productId}: ${tokenAddress}`);

    const tokenAbi = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)",
      "function decimals() public view returns (uint8)",
    ];

    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

    const decimals = await tokenContract.decimals();
    console.log(`Token Decimals: ${decimals}`);

    const depositAmountString = "10";
    const depositAmount = ethers.parseUnits(depositAmountString, decimals);

    const balance = await tokenContract.balanceOf(signer.address);
    console.log(
      `Token Balance: ${ethers.formatUnits(balance, decimals)} tokens`
    );

    if (balance < depositAmount) {
      throw new Error("Недостаточный баланс токена");
    }

    const maxUint256 = ethers.MaxUint256;
    console.log(
      `Устанавливаем максимальный allowance для Vertex Endpoint...`
    );
    const approveTx = await tokenContract.approve(
      vertexEndpointAddress,
      maxUint256
    );
    console.log(`Approve transaction hash: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("Allowance успешно установлен на максимальное значение");

    console.log(
      `Депонируем ${ethers.formatUnits(
        depositAmount,
        decimals
      )} токенов в Vertex Endpoint...`
    );

    const subaccountName = "";
    const subaccountNameBytes = ethers.toUtf8Bytes(subaccountName);
    if (subaccountNameBytes.length > 12) {
      throw new Error(
        "subaccountName слишком длинное, должно быть не более 12 байт"
      );
    }
    const subaccountNameBytes12 = ethers.zeroPadBytes(
      subaccountNameBytes,
      12
    );

    const depositTx = await vertexEndpointContract.depositCollateral(
      subaccountNameBytes12,
      productId,
      depositAmount
    );

    console.log(`Deposit transaction hash: ${depositTx.hash}`);
    await depositTx.wait();
    console.log("Депозит успешно выполнен");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Ошибка при депозите:", error.message);

      if ((error as any).reason) {
        console.error("Причина ошибки:", (error as any).reason);
      }
    } else {
      console.error("Неизвестная ошибка:", error);
    }
  }
}

depositToken();
