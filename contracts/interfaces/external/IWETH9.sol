// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@elliottech/lighter-v2-core/contracts/interfaces/external/IERC20Minimal.sol";

/// @title Interface for WETH9 on Arbitrum
/// @notice token functions to facilitate the wrap and unwrap functions during deposit and withdrawal of WETH token
interface IWETH9 is IERC20Minimal {
    /// @notice withdraws an amount of tokens from the contract and sends ether back to the sender.
    /// @param amount The amount of tokens to withdraw.
    function withdraw(uint256 amount) external;

    /// @notice deposits ether into the contract and mints corresponding tokens to the sender.
    function deposit() external payable;
}
