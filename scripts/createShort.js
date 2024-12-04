import { ethers } from 'ethers';
import ExchangeRouterJson from '../gmx-synthetics/deployments/avalancheFuji/ExchangeRouter.json';
import RouterJson from '../gmx-synthetics/deployments/avalancheFuji/Router.json';
import OrderVaultJson from '../gmx-synthetics/deployments/avalancheFuji/OrderVault.json';
import Reader from "../gmx-synthetics/deployments/avalancheFuji/Reader.json"
import dataStore from "../gmx-synthetics/deployments/avalancheFuji/DataStore.json"


const EXCHANGE_ROUTER_ADDRESS = ExchangeRouterJson.address; // Адрес ExchangeRouter
const EXCHANGE_ROUTER_ABI = ExchangeRouterJson.abi;

const ROUTER_ADDRESS = RouterJson.address; // Адрес Router
const ROUTER_ABI = RouterJson.abi;

const READER_ADDRESS = Reader.address;
const READER_ABI = Reader.abi;

const DATA_STORE_ADDRESS = dataStore.address;

const ORDER_VAULT_ADDRESS = OrderVaultJson.address;

// Адреса токенов
const WAVAX_ADDRESS = '0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3'; // WAVAX
const USDC_ADDRESS = '0x3eBDeaA0DB3FfDe96E7a0DBBAFEC961FC50F725F'; // USDC

// Адрес маркета
const MARKET_ADDRESS = '0xD996ff47A1F763E1e55415BC4437c59292D1F415'; // WAVAX/USDC Market

async function main() {
  // Подключаемся к Avalanche Fuji Testnet
  const provider = new ethers.JsonRpcProvider('');

  // Ваш приватный ключ
  const privateKey = '';
  const wallet = new ethers.Wallet(privateKey, provider);

  // Инициализируем контракты
  const exchangeRouter = new ethers.Contract(EXCHANGE_ROUTER_ADDRESS, EXCHANGE_ROUTER_ABI, wallet);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

  // Проверяем балансы
  const usdcAbi = ['function balanceOf(address owner) view returns (uint256)'];
  const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, wallet);
  const usdcBalance = await usdcContract.balanceOf(wallet.address);
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);

  const avaxBalance = await provider.getBalance(wallet.address);
  console.log(`AVAX Balance: ${ethers.formatUnits(avaxBalance, 18)} AVAX`);

  // Получаем минимальный executionFee (если функция доступна)
  try {
    const minExecutionFee = await exchangeRouter.minExecutionFee();
    console.log(`Minimum execution fee required: ${ethers.formatUnits(minExecutionFee, 18)} AVAX`);
  } catch (error) {
    console.log('Unable to fetch minimum execution fee from contract.');
  }

  // Параметры ордера
  const createOrderParams = {
    addresses: {
      receiver: wallet.address,
      cancellationReceiver: wallet.address,
      callbackContract: ethers.ZeroAddress,
      uiFeeReceiver: ethers.ZeroAddress,
      market: MARKET_ADDRESS,
      initialCollateralToken: USDC_ADDRESS,
      swapPath: [],
    },
    numbers: {
      sizeDeltaUsd: ethers.parseUnits('200000', 30), // Размер позиции в USD
      initialCollateralDeltaAmount: 0, // Сумма залога в USDC
      triggerPrice: 0,
      acceptablePrice: ethers.parseUnits('3520', 12), // выставляем цену немного выше нашей
      executionFee: ethers.parseUnits('1', 18), // Увеличиваем executionFee
      callbackGasLimit: 200000,
      minOutputAmount: 0,
      validFromTime: 0,
    },
    orderType: 2, // Тип ордера
    decreasePositionSwapType: 0,
    isLong: false,
    shouldUnwrapNativeToken: true,
    autoCancel: false,
    referralCode: ethers.encodeBytes32String(''),
  };

  // Одобрение токенов обеспечения (USDC)
  const collateralTokenAbi = [
    'function approve(address spender, uint256 amount) public returns (bool)',
  ];
  const collateralToken = new ethers.Contract(USDC_ADDRESS, collateralTokenAbi, wallet);

  const approveAmount = ethers.parseUnits('100000000000', 6); // Одобряем 100 USDC
  const approveTx = await collateralToken.approve(ROUTER_ADDRESS, approveAmount);
  await approveTx.wait();
  console.log('Tokens approved');

  // Вызов функции createOrder через multicall
  const exchangeRouterInterface = new ethers.Interface(EXCHANGE_ROUTER_ABI);
  const sentWnt = exchangeRouterInterface.encodeFunctionData('sendWnt', [
    ORDER_VAULT_ADDRESS,
    ethers.parseUnits('1', 18),
  ]);

  const sendTokens = exchangeRouterInterface.encodeFunctionData('sendTokens', [
    USDC_ADDRESS,
    ORDER_VAULT_ADDRESS,
    ethers.parseUnits('5000', 6),
  ]);

  const createOrderCalldata = exchangeRouterInterface.encodeFunctionData('createOrder', [
    createOrderParams,
  ]);

  const executionFee = ethers.parseUnits('1', 18); // Увеличили до 0.1 AVAX

  const tx = await exchangeRouter.multicall([sentWnt, sendTokens, createOrderCalldata], {
    value: executionFee,
  });

  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log('Short position opened successfully');


  // читаем позиции с нашего кошелька
  const readerContract = new ethers.Contract(READER_ADDRESS, READER_ABI, wallet);
  const positions = await readerContract.getAccountOrders(DATA_STORE_ADDRESS, wallet.address, 0, 100);
  positions.forEach((position: any) => {
    console.log(`Позиция: ${position}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
