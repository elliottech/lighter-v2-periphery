# Lighter Exchange V2

[![npm version](https://badge.fury.io/js/@elliottech%2Flighter-v2-periphery.svg)](https://badge.fury.io/js/@elliottech%2Flighter-v2-periphery)

Lighter is fully decentralized order book exchange protocol designed for permission-less, zero slippage and MEV-protected trades.

Periphery contracts interact with one or more Core contracts but are not part of the core. 
They are an abstraction layer that enhance the security and the extensibility of the protocol without introducing upgradability.

## Router

The Router contract simplifies user interactions with order books. 
It presents a straightforward interface for creating, updating, and cancelling both single and batch orders. 
The contract accommodates both "Immediate or Cancel" and "Fill or Kill" order types, as well as basic swaps. 
Additionally, it enhances order book capabilities with multi-path swaps, 
allowing for a sequence of swaps over multiple order books in a single transaction.

#### Transfer Callback
The Router is essential because it incorporates the callback mechanism needed to engage with the order book, whether for successful trades or order creations.
This means that users, whether they're a smart contract address or an Externally-owned Account (EOA, represented by a public/private key pair), 
can transact on the exchange by approving the router to utilize their tokens. 
This negates the need for users to implement the fallback on their own.

#### Calldata Compression
The Router utilizes calldata compression, leading to a reduction in total gas consumption. 
To take advantage of this calldata compression, we advise using the TypeScript SDK available in our [Lighter V2 example repository](https://github.com/elliottech/lighter-v2-example). 
This repository provides a clear demonstration of this interaction. 
Additionally, the `tasks` in the SDK introduce a Command-Line Interface (CLI) feature, 
making it an ideal foundation for those keen on exploring the SDK's functionalities.

#### Extra functionality
The Router introduces features not present in the order books, such as multi-path swaps. 
An example of this is the ability to sell WETH for WBTC through a two-step process: WETH -> USDC -> WBTC. 

Additionally, the Quoter functionality facilitates the simulation of swaps without actual execution, serving as a valuable tool for 
estimating potential token returns from swaps without making a commitment. 
This includes both single swaps and multi-path swaps involving various order books.
While this feature will show the results of a hypothetical swap, it doesn't guide users on the optimal path for multi-path swaps.

## Methods

#### Interacting with orders

1. createLimitOrder
2. createLimitOrderBatch
3. createIoCOrder
4. createFoKOrder
5. updateLimitOrder
6. updateLimitOrderBatch
7. cancelLimitOrder
8. cancelLimitOrderBatch

#### Swap-Exact-Amount operations on a single order book

1. swapExactInputSingle
2. swapExactOutputSingle

#### Swap-Exact-Amount operations across multiple order book

1. swapExactInputMulti
2. swapExactOutputMulti

#### Getting Quotes

1. getQuoteForExactInput
2. getQuoteForExactOutput
3. getQuoteForExactInputMulti
4. getQuoteForExactOutputMulti

## Wrap and Unwrap

The order books are designed exclusively for ERC20 token pairs, excluding direct support for native ETH. 
However, the Router bridges this gap by facilitating automatic wrapping when the input token is WETH and 
selective unwrapping during swaps when the output token is WETH.

### Wrap

- Native token get automatically wrapped to offer smooth interoperability 
- Any Excess native sent by taker will be refunded at end of transaction

### Unwrap

- User can choose to receive native-eth instead of WETH (when swap is with WETH as output token)
- WETH will be unwrapped and transferred to the recipient of the swap

### Structure
```bash
contracts
├── Router.sol
├── interfaces
│   ├── IRouter.sol
│   ├── ISwapMultiRequest.sol
│   └── external
│       └── IWETH9.sol
└── libraries
    ├── PeripheryErrors.sol
    ├── Quoter.sol
    └── SafeTransfer.sol

```

## Extend this locally

```
npm install
npm compile
npm test
```

## License

- The primary license for Lighter V2 is the Business Source License 1.1 (`BUSL-1.1`)
- `contracts/interfaces/IWETH9.sol` and `contracts/libraries/SafeTransfer.sol` are licensed under `SPDX-License-Identifier: MIT`
