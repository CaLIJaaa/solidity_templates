// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../vertex-contracts/contracts/interfaces/IEndpoint.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IEndpointExtended is IEndpoint {
    function executeSlowModeTransaction() external;
}

contract createDeposit {
    struct LinkSigner {
        bytes32 sender;
        bytes32 signer;
        uint64 nonce;
    }

    struct SwapAMM {
        bytes32 sender;
        uint32 productId;
        int128 amount;
        int128 priceX18;
    }

    address USDC20 = 0xD32ea1C76ef1c296F131DD4C5B2A0aac3b22485a;
    IEndpointExtended endpointInterface =
        IEndpointExtended(0xaDeFDE1A14B6ba4DA3e82414209408a49930E8DC);

    receive() external payable {}

    function depositUSDC(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        // Выполняем transferFrom от отправителя к контракту
        bool success = ERC20(USDC20).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(success, "USDC transfer failed");
    }

    function linkVertexSigner(
        address externalAccount,
        address usdcAddress
    ) external {
        // 1. a slow mode fee of 1 USDC needs to be avaliable and approved
        ERC20 usdcToken = ERC20(usdcAddress);

        // NOTE: should double check the USDC decimals in the corresponding chain.
        // e.g: it's 1e6 on arbitrum, whereas it's 1e18 on blast, etc.
        // on base it's 1e6
        uint256 SLOW_MODE_FEE = 1e6;
        usdcToken.approve(address(endpointInterface), SLOW_MODE_FEE);

        // 2. assamble the link signer slow mode transaction
        bytes12 defaultSubaccountName = bytes12(abi.encodePacked("default"));
        bytes32 contractSubaccount = bytes32(
            abi.encodePacked(uint160(address(this)), defaultSubaccountName)
        );
        bytes32 externalSubaccount = bytes32(
            uint256(uint160(externalAccount)) << 96
        );
        LinkSigner memory linkSigner = LinkSigner(
            contractSubaccount,
            externalSubaccount,
            endpointInterface.getNonce(externalAccount)
        );
        bytes memory txs = abi.encodePacked(uint8(19), abi.encode(linkSigner));

        // 3. submit slow mode transaction
        endpointInterface.submitSlowModeTransaction(txs);
    }

    function createShort(address usdcAddress) external {
        ERC20 usdcToken = ERC20(usdcAddress);
        usdcToken.approve(address(endpointInterface), 9999999999999999999);

        bytes12 defaultSubaccountName = bytes12(abi.encodePacked("default"));
        bytes32 contractSubaccount = bytes32(
            abi.encodePacked(uint160(address(this)), defaultSubaccountName)
        );

        uint32 productId = uint32(4);
        int128 amount = int128(10 ** 16);

        SwapAMM memory SwapAMM = SwapAMM(
            contractSubaccount,
            productId, //id для perp ETH
            amount,
            endpointInterface.getPriceX18(productId)
        );

        bytes memory txs = abi.encodePacked(uint8(11), abi.encode(SwapAMM));

        endpointInterface.submitSlowModeTransaction(txs);
    }

    function executeTransaction() external {
        endpointInterface.executeSlowModeTransaction();
    }
}
