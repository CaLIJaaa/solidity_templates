// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "gmx-synthetics/contracts/router/IExchangeRouter.sol";
import "gmx-synthetics/contracts/gas/GasUtils.sol";
import "gmx-synthetics/contracts/order/IBaseOrderUtils.sol";
import "gmx-synthetics/contracts/order/Order.sol";
import "gmx-synthetics/contracts/token/IWNT.sol";

contract createShortPosition { //arbitrum sepolia
    IExchangeRouter public exchangeRouter = IExchangeRouter(0xbbb774b00102e2866677b9d238b2Ee489779E532);
    IERC20 public usdcToken = IERC20(0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d); //Возиожно надо заменить на другой
    address public ethUsdMarket; // адрес ETH рынка на GMX
    IWNT public wntToken = IWNT(0xf7a20c37ca3612ac7a1de704114064b8b211d593); //wnt - wrapped native token (в нашем случае это wETH)
    //! не уверен что указал правильный адрес для wntToken
    address public orderVault = 0xD2A2044f62D7cD77470AC237408f9f59AcB5965E;

    function openShortPosition(
        uint256 amountUSDC, // t - сумма USDC для залога
        uint256 leverage,   // n - плечо
        uint256 acceptablePrice // приемлемая цена для контроля проскальзывания
    ) external payable {
        // Пользователь должен предварительно одобрить перевод USDC нашему контракту
        require(usdcToken.transferFrom(msg.sender, address(this), amountUSDC), "Transfer failed");

        // Одобряем ExchangeRouter тратить USDC от имени нашего контракта
        usdcToken.approve(address(exchangeRouter), amountUSDC);

        // Подготавливаем параметры для createOrder
        IBaseOrderUtils.CreateOrderParams memory params;

        params.addresses = IBaseOrderUtils.CreateOrderParamsAddresses({
            receiver: msg.sender, // Получатель выходных сумм
            cancellationReceiver: msg.sender, // Получатель при отмене ордера
            callbackContract: address(0), // Не используем callback
            uiFeeReceiver: address(0), // Не берем UI комиссию (можно настроить так чтобы нам приносило это прибыль)
            market: ethUsdMarket, // Рынок ETH/USD (надо его как-то достать, пока не разобрался как)
            initialCollateralToken: address(usdcToken), // USDC как залог
            swapPath: [] // Пустой массив, т.к. обмен не требуется (мы просто купим eth за usdc)
        });

        params.numbers = IBaseOrderUtils.CreateOrderParamsNumbers({
            sizeDeltaUsd: amountUSDC * leverage, // Размер позиции в USD
            initialCollateralDeltaAmount: amountUSDC, // Сумма залога USDC
            triggerPrice: 0, // Для рыночного ордера устанавливаем 0
            acceptablePrice: acceptablePrice, // Приемлемая цена
            executionFee: GasUtils.estimateExecuteOrderGasLimit, // Минимальная комиссия за исполнение
            callbackGasLimit: 0, // Не используем callback
            minOutputAmount: 0, // Нет обмена, можно установить 0
            validFromTime: 0 // Ордер действителен сразу
        });

        params.orderType = Order.OrderType.MarketIncrease; // Рыночный ордер на увеличение позиции
        params.isLong = false; // Открываем короткую позицию
        params.shouldUnwrapNativeToken = false; // Не разворачиваем нативный токен
        params.autoCancel = false; // Не используется для этого типа ордера
        params.referralCode = bytes32(0); // Если есть реферальный код, можно установить

        // Определяем сумму комиссии за исполнение в ETH
        uint256 executionFee = params.numbers.executionFee;
        require(msg.value >= executionFee, "Insufficient ETH for execution fee");
        wntToken.deposit{value: executionFee}();
        wntToken.approve(address(exchangeRouter), executionFee);

        //тут надо создать список транзакций которые будут по очереди выполняться, надо отправить деньги на OrderVault
        // и после вызвать функцию createOrder(), все это надо выполнить через exchangeRouter.multicall(txs); чтобы всё дошло
    }
}
