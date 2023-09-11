// This adds support for typescript paths mappings
import 'tsconfig-paths/register'

import {HardhatUserConfig} from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-chai-matchers'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-gas-reporter'
import 'hardhat-contract-sizer'

const config: HardhatUserConfig = {
  solidity: '0.8.18',
}

export default config

module.exports = {
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000000000,
      },
    },
  },
  networks: {
    develop: {
      url: 'http://127.0.0.1:8545',
      allowUnlimitedContractSize: true,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: 'gas-report.txt',
    noColors: true,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
}
