import {getSetupValues, getSetupValuesAndCreateOrders} from '../shared/setup-master'
import {reportGasCost} from 'reports/generate-gas-cost-report'
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers'
import {ParseUSDC, ParseWETH} from '../shared/amount'
import {CancelLimitOrderDirect, CreateLimitOrderDirect, CreateLimitOrderViaFallback} from '../shared/api'
import {mintAndApproveToken} from '../shared/setup-master'

describe('benchmark limit order creation', function () {
  async function setupFixture() {
    const {router, token_weth, token_usdc, acc1, orderBookInstance_weth_usdc} = await getSetupValues()

    await mintAndApproveToken(token_weth, acc1, router.address, ParseWETH('5'))
    await mintAndApproveToken(token_usdc, acc1, router.address, ParseUSDC('5000'))

    // create one order from acc1 and cancel it so we pay the gas to register our customer ID upfront
    await CreateLimitOrderDirect(acc1, router, orderBookInstance_weth_usdc, [
      {
        amount0: ParseWETH('1.0'),
        price: ParseUSDC(1425),
        isAsk: true,
        hintId: 0,
      },
    ])
    await CancelLimitOrderDirect(acc1, router, orderBookInstance_weth_usdc, [2])

    return {
      router,
      acc1,
      orderBookInstance_weth_usdc,
      token_usdc,
      token_weth,
    }
  }

  describe('creates 1 limit order', () => {
    it('via fallback; ask', async function () {
      await test(CreateLimitOrderViaFallback, 'CREATE_1_ASK_LIMIT_ORDER_VIA_FALLBACK', true)
    })
    it('direct; ask', async function () {
      await test(CreateLimitOrderDirect, 'CREATE_1_ASK_LIMIT_ORDER_DIRECT', true)
    })
    it('via fallback; bid', async function () {
      await test(CreateLimitOrderViaFallback, 'CREATE_1_BID_LIMIT_ORDER_VIA_FALLBACK', false)
    })
    it('direct; bid', async function () {
      await test(CreateLimitOrderDirect, 'CREATE_1_BID_LIMIT_ORDER_DIRECT', false)
    })

    async function test(f: any, scenario: string, isAsk: boolean) {
      const {router, acc1, orderBookInstance_weth_usdc, token_weth, token_usdc} = await loadFixture(
        getSetupValuesAndCreateOrders
      )

      const tx = await f(acc1, router, orderBookInstance_weth_usdc, [
        {
          amount0: ParseWETH('1.0'),
          price: ParseUSDC(1425),
          isAsk: isAsk,
          hintId: 0,
        },
      ])

      await reportGasCost(scenario, tx)
    }
  })

  describe('creates 4 limit order', () => {
    it('via fallback', async function () {
      await test(CreateLimitOrderViaFallback, 'CREATE_4_LIMIT_ORDERS_VIA_FALLBACK')
    })
    it('direct', async function () {
      await test(CreateLimitOrderDirect, 'CREATE_4_LIMIT_ORDERS_DIRECT')
    })

    async function test(f: any, scenario: string) {
      const {router, acc1, orderBookInstance_weth_usdc} = await setupFixture()

      const tx = await f(acc1, router, orderBookInstance_weth_usdc, [
        {
          amount0: ParseWETH('1.0'),
          price: ParseUSDC(1440),
          isAsk: true,
          hintId: 0,
        },
        {
          amount0: ParseWETH('1.5'),
          price: ParseUSDC(1430),
          isAsk: true,
          hintId: 0,
        },
        {
          amount0: ParseWETH('1.5'),
          price: ParseUSDC(1420),
          isAsk: false,
          hintId: 0,
        },
        {
          amount0: ParseWETH('1'),
          price: ParseUSDC(1410),
          isAsk: false,
          hintId: 0,
        },
      ])

      await reportGasCost(scenario, tx)
    }
  })
})
