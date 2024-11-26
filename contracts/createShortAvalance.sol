// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExchangeRouter {
    function multicall(bytes[] calldata data) external payable returns (bytes[] memory results);
    function sendTokens(address token, address to, uint256 amount) external;
    function createOrder(OrderParams calldata params) external;
    function sendWnt(address receiver, uint256 amount) external payable;
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}


struct OrderParams {
    address receiver;
    address callbackContract;
    address uiFeeReceiver;
    address market;
    address initialCollateralToken;
    address[] swapPath;
    uint256 sizeDeltaUsd;
    uint256 triggerPrice;
    uint256 acceptablePrice;
    uint256 executionFee;
    uint256 callbackGasLimit;
    uint256 minOutputAmount;
    uint256 initialCollateralDeltaAmount;
    uint8 orderType;
    bool isLong;
    bool shouldUnwrapNativeToken;
    uint8 decreasePositionSwapType;
}

contract createShort {
    IExchangeRouter public exchangeRouter;
    IERC20 public usdc;
    address public orderVault;

    constructor(address _exchangeRouter, address _usdc, address _orderVault) {
        exchangeRouter = IExchangeRouter(_exchangeRouter);
        usdc = IERC20(_usdc);
        orderVault = _orderVault;
    }

    function createShortPosition(
        address marketAddress,
        uint256 collateralAmount,
        uint256 sizeDeltaUsd,
        uint256 executionFee
    ) external {
        // Approve USDC 
        uint256 allowance = usdc.allowance(address(this), address(exchangeRouter));
        if (allowance < collateralAmount) {
            usdc.approve(address(exchangeRouter), type(uint256).max);
        }

        // Set up order parameters
        OrderParams memory orderParams = OrderParams({
            receiver: msg.sender,
            callbackContract: address(0),
            uiFeeReceiver: address(0),
            market: marketAddress,
            initialCollateralToken: address(usdc),
            swapPath: new address[](0), 
            sizeDeltaUsd: sizeDeltaUsd,
            triggerPrice: 0,
            acceptablePrice: 0,
            executionFee: executionFee,
            callbackGasLimit: 0,
            minOutputAmount: 0,
            initialCollateralDeltaAmount: collateralAmount,
            orderType: 2, 
            isLong: false, // Short position
            shouldUnwrapNativeToken: false,
            decreasePositionSwapType: 0
        });

        // Prepare multicall data
        bytes[] memory multicallData = new bytes[](3);
        multicallData[0] = abi.encodeWithSelector(
            exchangeRouter.sendWnt.selector,
            orderVault,
            executionFee
        );
        multicallData[1] = abi.encodeWithSelector(
            exchangeRouter.sendTokens.selector,
            address(usdc),
            orderVault,
            collateralAmount
        );
        multicallData[2] = abi.encodeWithSelector(
            exchangeRouter.createOrder.selector,
            orderParams
        );

        exchangeRouter.multicall{value: executionFee}(multicallData);
    }
}

/*
    Addresses:
    exchangeRouter: 0x52A1c10c462ca4e5219d0Eb4da5052cc73F9050D
    usdc: 0x3eBDeaA0DB3FfDe96E7a0DBBAFEC961FC50F725F
    orderVault: 0x25D23e8E655727F2687CC808BB9589525A6F599B
    WAVAX: 0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3
    Market: 0xbf338a6C595f06B7Cfff2FA8c958d49201466374
*/
