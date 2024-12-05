import { ethers } from 'ethers';
import ExchangeRouterJson from '../deploymentsGMX/arbitrum/ExchangeRouter.json';
import RouterJson from '../deploymentsGMX/arbitrum/Router.json';
import OrderVaultJson from '../deploymentsGMX/arbitrum/OrderVault.json';
import Reader from "../deploymentsGMX/arbitrum/Reader.json"
import dataStore from "../deploymentsGMX/arbitrum/DataStore.json"


const EXCHANGE_ROUTER_ADDRESS = ExchangeRouterJson.address; // Адрес ExchangeRouter
const EXCHANGE_ROUTER_ABI = ExchangeRouterJson.abi;

const ROUTER_ADDRESS = RouterJson.address; // Адрес Router
const ROUTER_ABI = RouterJson.abi;

const READER_ADDRESS = Reader.address;
const READER_ABI = Reader.abi;

const DATA_STORE_ADDRESS = dataStore.address;

const ORDER_VAULT_ADDRESS = OrderVaultJson.address;

// Адреса токенов
const WAVAX_ADDRESS = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'; // WETH
const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // USDC

// Адрес маркета
const MARKET_ADDRESS = '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336'; // WAVAX/USDC Market

async function main() {
  // Подключаемся к Avalanche Fuji Testnet
  const provider = new ethers.JsonRpcProvider('');

  // Ваш приватный ключ
  const privateKey = '';
  const wallet = new ethers.Wallet(privateKey, provider);

  // Инициализируем контракты
  const exchangeRouterWallet = new ethers.Contract(EXCHANGE_ROUTER_ADDRESS, EXCHANGE_ROUTER_ABI, wallet);
  const exchangeRouterProvider = new ethers.Contract(EXCHANGE_ROUTER_ADDRESS, EXCHANGE_ROUTER_ABI, provider);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

  // Проверяем балансы
  const usdcAbi = ['function balanceOf(address owner) view returns (uint256)'];
  const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, wallet);
  const usdcBalance = await usdcContract.balanceOf(wallet.address);
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);

  const avaxBalance = await provider.getBalance(wallet.address);
  console.log(`AVAX Balance: ${ethers.formatUnits(avaxBalance, 18)} ETH`);

  // Получаем минимальный executionFee (если функция доступна)
  try {
    const minExecutionFee = await exchangeRouterProvider.minExecutionFee();
    console.log(`Minimum execution fee required: ${ethers.formatUnits(minExecutionFee, 18)} ETH`);
  } catch (error) {
    console.log('Unable to fetch minimum execution fee from contract.');
  }

  // Параметры ордера
  const withdrawOrderParams = {
    addresses: {
      receiver: wallet.address,
      cancellationReceiver: wallet.address,
      callbackContract: ethers.ZeroAddress,
      uiFeeReceiver: ethers.ZeroAddress,
      market: MARKET_ADDRESS,
      initialCollateralToken: WAVAX_ADDRESS,
      swapPath: [],
    },
    numbers: {
      sizeDeltaUsd: ethers.parseUnits('3', 30), // Размер позиции в USD
      initialCollateralDeltaAmount: 541683999999999, // Сумма залога в USDC
      triggerPrice: 0,
      acceptablePrice: ethers.parseUnits('5000', 12),
      executionFee: ethers.parseUnits('0.001', 18), // Увеличиваем executionFee
      callbackGasLimit: 200000,
      minOutputAmount: 5,
      validFromTime: 0,
    },
    orderType: 4, // Тип ордера
    decreasePositionSwapType: 1,
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
    ethers.parseUnits('0.001', 18),
  ]);

  const withdrawOrderCalldata = exchangeRouterInterface.encodeFunctionData('createOrder', [
    withdrawOrderParams,
  ]);

  const executionFee = ethers.parseUnits('0.001', 18); // Увеличили до 0.1 AVAX

  const tx = await exchangeRouterWallet.multicall([sentWnt, withdrawOrderCalldata], {
    value: executionFee,
  });

  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log('Short position opened successfully');


  // читаем позиции с нашего кошелька
  const readerContract = new ethers.Contract(READER_ADDRESS, READER_ABI, provider);
  const positions = await readerContract.getAccountOrders(DATA_STORE_ADDRESS, wallet.address, 0, 100);
  positions.forEach((position: any) => {
    console.log(`Позиция: ${position}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
