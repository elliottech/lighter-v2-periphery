# Lighter Exchange V2

Lighter is fully decentralized order book exchange protocol designed for permission-less, zero slippage and MEV-protected trades.

## Contract Structure

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

## Installing the dependencies

```
npm install
```

## Compiling the contracts

```shell
npm compile
```

## Running the tests

```
npm test
```

## License

- The primary license for Lighter V2 is the Business Source License 1.1 (`BUSL-1.1`)
- `contracts/interfaces/IWETH9.sol` and `contracts/libraries/SafeTransfer.sol` are licensed under `SPDX-License-Identifier: MIT`
