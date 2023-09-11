import {BigNumber, BigNumberish, Contract, ContractFactory} from 'ethers'
import {IFactory, IOrderBook, Router} from 'typechain-types'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers} from 'hardhat'
import {ParseLINK, ParseUSDC, ParseWBTC, ParseWETH} from './amount'
import {CreateLimitOrderViaFallback} from './api'
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers'
import {expect} from 'chai'

import * as OrderBookDeployerLib from '@elliottech/lighter-v2-core/artifacts/contracts/libraries/OrderBookDeployer.sol/OrderBookDeployerLib.json'
import * as Factory from '@elliottech/lighter-v2-core/artifacts/contracts/Factory.sol/Factory.json'
import * as OrderBook from '@elliottech/lighter-v2-core/artifacts/contracts/OrderBook.sol/OrderBook.json'

export const mintAndApproveToken = async (
  token: any,
  recipientSigner: SignerWithAddress,
  approvalAddress: string,
  amount: BigNumberish | BigNumber
) => {
  amount = BigNumber.from(amount)
  const recipientAddress = recipientSigner.address
  await token.mint(recipientAddress, amount)
  await token.connect(recipientSigner).approve(approvalAddress, amount)
}

export const mintWethViaWrapAndApproveToken = async (
  token: any,
  recipientSigner: SignerWithAddress,
  approvalAddress: string,
  amount: BigNumberish | BigNumber
) => {
  amount = BigNumber.from(amount)
  const recipientAddress = recipientSigner.address
  await token.depositTo(recipientAddress, {value: amount})
  await token.connect(recipientSigner).approve(approvalAddress, amount)
}

export const createLimitOrder = async (
  router: any,
  marketMaker: SignerWithAddress,
  orderBookId: number,
  amount0Base: BigNumber,
  price0Base: BigNumber,
  isAsk: boolean,
  hintId: number
) => {
  await router.connect(marketMaker).createLimitOrder(orderBookId, amount0Base, price0Base, isAsk, hintId)
}

export const sendFallbackTransaction = async (account: any, target: string, data: any) => {
  return await account.sendTransaction({
    to: target,
    data: data,
  })
}

export async function deployFactory(owner: SignerWithAddress) {
  // Deploy heap libraries
  const linkedListLib = await (await ethers.getContractFactory('LinkedListLib')).deploy()
  const linkedListLibPlaceHolder = '__$b603b2724840a919bc003801c6552f6417$__'

  // Deploy Order Book Deploy Lib
  const orderBookDeployerLib = await (
    (await ethers.getContractFactory(
      OrderBookDeployerLib.abi,
      OrderBookDeployerLib.bytecode.replaceAll(linkedListLibPlaceHolder, linkedListLib.address.substring(2))
    )) as ContractFactory
  ).deploy()

  const orderBookDeployerPlaceHolder = '__$ca481fe5e6de4975f58f9a7e88a26f1e5a$__'

  const factory = (await (
    (await ethers.getContractFactory(
      Factory.abi,
      Factory.bytecode.replaceAll(orderBookDeployerPlaceHolder, orderBookDeployerLib.address.substring(2))
    )) as ContractFactory
  ).deploy(owner.address)) as IFactory

  return {factory, linkedListLib, orderBookDeployerLib}
}

async function _getSetupValues() {
  const [owner, acc1, acc2] = await ethers.getSigners()

  let {factory} = await deployFactory(owner)

  const token_weth = await deployToken('WETH', 'WETH', 18)

  // Deploy router
  const routerFactory = await ethers.getContractFactory('Router')
  const router = (await routerFactory.deploy(factory.address, token_weth.address)) as Router
  await router.deployed()

  const token_usdc = await deployToken('USD Coin', 'USDC', 6)

  // Create the order book WETH(18) - USDC(6)
  const logSizeTick_weth_usdc = 14 // decimal=14 so multiples of 0.0001 (10^-4)
  const sizeTick_weth_usdc = 10 ** logSizeTick_weth_usdc //10**14
  const logPriceTick_weth_usdc = 4 // decimal=4 so multiples of 0.01
  const priceTick_weth_usdc = 10 ** logPriceTick_weth_usdc //10^4
  const minBaseAmount_weth_usdc: number = 100
  const minQuoteAmount_weth_usdc: number = 1
  const priceMultiplier_weth_usdc = 10 ** (logSizeTick_weth_usdc + logPriceTick_weth_usdc - 18)

  let {orderBookAddress, orderBookInstance} = await deployOrderBook(
    factory,
    0,
    logSizeTick_weth_usdc,
    logPriceTick_weth_usdc,
    minBaseAmount_weth_usdc,
    minQuoteAmount_weth_usdc,
    token_weth,
    token_usdc
  )

  const token_wbtc = await deployToken('WBTC', 'WBTC', 8)

  const orderBookAddress_weth_usdc = orderBookAddress
  const orderBookInstance_weth_usdc = orderBookInstance

  // WBTC(8) - USDC(6)
  const logSizeTick_wbtc_usdc = 3 // decimal=3 so multiples of 0.000001 = (10^(3-8)) = 10^-5
  const sizeTick_wbtc_usdc = 10 ** logSizeTick_wbtc_usdc //10**3
  const logPriceTick_wbtc_usdc = 5 // decimal=5 so multiples of 0.1 (10^(5-6)) = 10^-1
  const priceTick_wbtc_usdc = 10 ** logPriceTick_wbtc_usdc //10^5
  const minBaseAmount_wbtc_usdc: number = 100
  const minQuoteAmount_wbtc_usdc: number = 1
  const priceMultiplier_wbtc_usdc = 10 ** (logSizeTick_wbtc_usdc + logPriceTick_wbtc_usdc - 8)

  const orderBookSetupRsp_wbtc_usdc = await deployOrderBook(
    factory,
    1,
    logSizeTick_wbtc_usdc,
    logPriceTick_wbtc_usdc,
    minBaseAmount_wbtc_usdc,
    minQuoteAmount_wbtc_usdc,
    token_wbtc,
    token_usdc
  )
  const orderBookAddress_wbtc_usdc = orderBookSetupRsp_wbtc_usdc.orderBookAddress
  const orderBookInstance_wbtc_usdc = orderBookSetupRsp_wbtc_usdc.orderBookInstance

  // WBTC(8) - LINK(18)
  const token_link = await deployToken('LINK', 'LINK', 18)

  const logSizeTick_wbtc_link = 3 // decimal=5 so multiples of 0.0001 (10^3-8) = 10^-5
  const sizeTick_wbtc_link = 10 ** logSizeTick_wbtc_link //10**3
  const logPriceTick_wbtc_link = 16 // decimal=2 so multiples of 0.00000000000000001 = (10^(2-18)) = 10^-16
  const priceTick_wbtc_link = 10 ** logPriceTick_wbtc_link //10^16
  const minBaseAmount_wbtc_link: number = 100
  const minQuoteAmount_wbtc_link: number = 1
  const priceMultiplier_wbtc_link = 10 ** (logSizeTick_wbtc_link + logPriceTick_wbtc_link - 8)

  const orderBookSetupRsp_wbtc_link = await deployOrderBook(
    factory,
    2,
    logSizeTick_wbtc_link,
    logPriceTick_wbtc_link,
    minBaseAmount_wbtc_link,
    minQuoteAmount_wbtc_link,
    token_wbtc,
    token_link
  )
  const orderBookAddress_wbtc_link = orderBookSetupRsp_wbtc_link.orderBookAddress
  const orderBookInstance_wbtc_link = orderBookSetupRsp_wbtc_link.orderBookInstance

  // owner transfers to Router and order books, to pay for storage on ERC20 in advance, in order to optimize swaps & order creations
  for (const token of [token_weth, token_wbtc, token_usdc, token_link]) {
    await token.mint(owner.address, 100)
    for (const contractAddress of [
      router.address,
      orderBookAddress_weth_usdc,
      orderBookAddress_wbtc_usdc,
      orderBookAddress_wbtc_link,
    ]) {
      await token.connect(owner).transfer(contractAddress, 1)
    }
  }

  return {
    router,
    weth: token_weth,
    usdc: token_usdc,
    wbtc: token_wbtc,
    link: token_link,
    token_weth,
    token_usdc,
    token_link,
    token_wbtc,
    owner,
    acc1: acc1 as SignerWithAddress,
    acc2: acc2 as SignerWithAddress,
    logSizeTick_weth_usdc,
    sizeTick_weth_usdc,
    logPriceTick_weth_usdc,
    priceTick_weth_usdc,
    priceMultiplier_weth_usdc,
    logSizeTick_wbtc_usdc,
    sizeTick_wbtc_usdc,
    logPriceTick_wbtc_usdc,
    priceTick_wbtc_usdc,
    priceMultiplier_wbtc_usdc,
    logSizeTick_wbtc_link,
    sizeTick_wbtc_link,
    logPriceTick_wbtc_link,
    priceTick_wbtc_link,
    priceMultiplier_wbtc_link,
    orderBook: orderBookInstance_weth_usdc,
    orderBookAddress_weth_usdc,
    orderBookInstance_weth_usdc,
    orderBookAddress_wbtc_usdc,
    orderBookInstance_wbtc_usdc,
    orderBookAddress_wbtc_link,
    orderBookInstance_wbtc_link,
  }
}

export async function getSetupValues() {
  return await loadFixture(_getSetupValues)
}

async function createOrders(s: any) {
  let {acc1, router, orderBookInstance_weth_usdc, orderBookInstance_wbtc_usdc, orderBookInstance_wbtc_link} = s
  await CreateLimitOrderViaFallback(acc1, router, orderBookInstance_weth_usdc, [
    {
      amount0: ParseWETH('1.0'),
      price: ParseUSDC(1500),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWETH('1.5'),
      price: ParseUSDC(1450),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWETH('1.5'),
      price: ParseUSDC(1400),
      isAsk: false,
      hintId: 0,
    },
    {
      amount0: ParseWETH('1'),
      price: ParseUSDC(1350),
      isAsk: false,
      hintId: 0,
    },
    {
      amount0: ParseWETH('1.25'),
      price: ParseUSDC(1475),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWETH('1.25'),
      price: ParseUSDC(1375),
      isAsk: false,
      hintId: 0,
    },
  ])

  // assume fair WBTC price of $25000
  await CreateLimitOrderViaFallback(acc1, router, orderBookInstance_wbtc_usdc, [
    {
      amount0: ParseWBTC('0.1'),
      price: ParseUSDC(26000),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.15'),
      price: ParseUSDC(25500),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.15'),
      price: ParseUSDC(24500),
      isAsk: false,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.1'),
      price: ParseUSDC(24000),
      isAsk: false,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.125'),
      price: ParseUSDC(25750),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.125'),
      price: ParseUSDC(24250),
      isAsk: false,
      hintId: 0,
    },
  ])

  // assume fair LINK price of $5
  await CreateLimitOrderViaFallback(acc1, router, orderBookInstance_wbtc_link, [
    {
      amount0: ParseWBTC('0.1'),
      price: ParseLINK(5200),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.15'),
      price: ParseLINK(5100),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.15'),
      price: ParseLINK(4900),
      isAsk: false,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.1'),
      price: ParseLINK(4800),
      isAsk: false,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.125'),
      price: ParseLINK(5150),
      isAsk: true,
      hintId: 0,
    },
    {
      amount0: ParseWBTC('0.125'),
      price: ParseLINK(4850),
      isAsk: false,
      hintId: 0,
    },
  ])
}

async function fundAccounts(s: any) {
  for (const user of [s.acc1, s.acc2]) {
    await mintWethViaWrapAndApproveToken(s.token_weth, user, s.router.address, ParseWETH('1000'))
    await mintAndApproveToken(s.token_usdc, user, s.router.address, ParseUSDC('1000000'))
    await mintAndApproveToken(s.token_wbtc, user, s.router.address, ParseWBTC('100'))
    await mintAndApproveToken(s.token_link, user, s.router.address, ParseLINK('200000'))
  }
}

export async function _getSetupValuesAndCreateOrders() {
  const s = await loadFixture(_getSetupValues)
  await fundAccounts(s)
  await createOrders(s)
  return s
}
export async function getSetupValuesAndCreateOrders() {
  return await loadFixture(_getSetupValuesAndCreateOrders)
}

export const deployToken = async (tokenName: string, tokenSymbol: string, decimals: number) => {
  const token_factory = await ethers.getContractFactory('TestERC20Token')
  let token = await token_factory.deploy(tokenName, tokenSymbol, decimals)
  await token.deployed()
  return token
}

export const deployOrderBook = async (
  factory: any,
  orderBookId: number,
  sizeTick: number,
  priceTick: number,
  minBaseAmount: number,
  minQuoteAmount: number,
  token0: any,
  token1: any
) => {
  // Create the order book
  const tx = await factory.createOrderBook(
    token0.address,
    token1.address,
    sizeTick,
    priceTick,
    minBaseAmount,
    minQuoteAmount
  )

  const orderBookAddress = await factory.getOrderBookFromId(orderBookId)
  await expect(tx)
    .to.emit(factory, 'OrderBookCreated')
    .withArgs(
      orderBookAddress,
      orderBookId,
      token0.address,
      token1.address,
      sizeTick,
      priceTick,
      minBaseAmount,
      minQuoteAmount
    )

  const [owner] = await ethers.getSigners()
  const orderBookInstance = new Contract(orderBookAddress, OrderBook.abi, owner) as IOrderBook

  return {orderBookAddress, orderBookInstance}
}
