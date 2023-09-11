import {getSetupValuesAndCreateOrders} from './shared/setup-master'
import {expectOrderBook} from './shared/order-book'
import {CancelLimitOrderDirect, UpdateLimitOrderDirect, UpdateLimitOrderViaFallback} from './shared/api'
import {ParseUSDC, ParseWETH} from './shared/amount'
import {expect} from 'chai'
import {reportGasCost} from '../reports'

describe('updateLimitOrder', function () {
  // Order with ID 6
  // {
  //   amount0: ParseWETH('1.25'),
  //   price: ParseUSDC(1475),
  //   isAsk: true,
  // },

  describe('benchmark updates limit order', () => {
    it('via fallback', async function () {
      await test(UpdateLimitOrderViaFallback, 'UPDATE_LIMIT_ORDER_VIA_FALLBACK')
    })
    it('direct', async function () {
      await test(UpdateLimitOrderDirect, 'UPDATE_LIMIT_ORDER_DIRECT')
    })

    async function test(f: any, scenario: string) {
      const {router, acc1, orderBook} = await getSetupValuesAndCreateOrders()

      const tx = await f(acc1, router, orderBook, [
        {
          orderId: 6,
          newAmount0: ParseWETH('0.1'),
          newPrice: ParseUSDC('1525'),
          hintId: 2,
        },
      ])

      await reportGasCost(scenario, tx)
    }
  })

  it('updates limit order and returns updated order book', async () => {
    const {router, acc1, orderBook, weth} = await getSetupValuesAndCreateOrders()
    await expectOrderBook(orderBook, [3, 6, 2, 0], [])

    const tx = await UpdateLimitOrderDirect(acc1, router, orderBook, [
      {
        orderId: 6,
        newAmount0: ParseWETH('0.1'),
        newPrice: ParseUSDC('1525'),
        hintId: 0,
      },
    ])

    // remove 1.25 ETH from order book and insert back 0.1
    await expect(tx).to.changeTokenBalance(weth, orderBook.address, ParseWETH('-1.15'))
    await expectOrderBook(orderBook, [3, 2, 8, 0], [])
  })

  it('can match updated orders fully aggressively', async () => {
    const {router, acc1, orderBook, weth} = await getSetupValuesAndCreateOrders()

    const tx = await UpdateLimitOrderDirect(acc1, router, orderBook, [
      {
        orderId: 6,
        newAmount0: ParseWETH('0.1'),
        newPrice: ParseUSDC('1400'),
        hintId: 0,
      },
    ])

    // order was not inserted, so WETH balance of OB just decreases by prev order
    await expect(tx).to.changeTokenBalance(weth, orderBook.address, ParseWETH(-1.25))
    await expectOrderBook(orderBook, [3, 2, 0], [])
  })

  it('can match updated order partially before inserting', async () => {
    const {router, acc1, orderBook, weth} = await getSetupValuesAndCreateOrders()
    await expectOrderBook(orderBook, [3, 6, 2, 0], [])

    const tx = await UpdateLimitOrderDirect(acc1, router, orderBook, [
      {
        orderId: 6,
        newAmount0: ParseWETH('2'),
        newPrice: ParseUSDC('1380'),
        hintId: 0,
      },
    ])

    // remove 1.25 ETH from order book and insert back the remainder of (0.5) after the match
    await expect(tx).to.changeTokenBalance(weth, orderBook.address, ParseWETH(-1.25 + 0.5))
    await expectOrderBook(orderBook, [8, 3, 2, 0], [7, 5, 0])
  })

  it('cant update other users orders', async () => {
    const {router, acc2, orderBook} = await getSetupValuesAndCreateOrders()

    await expect(
      UpdateLimitOrderDirect(acc2, router, orderBook, [
        {
          orderId: 6,
          newAmount0: ParseWETH('0.1'),
          newPrice: ParseUSDC('1400'),
          hintId: 0,
        },
      ])
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Owner_CallerCannotCancel')
  })

  it('cant update order which is inactive', async () => {
    const {router, acc1, orderBook} = await getSetupValuesAndCreateOrders()

    // cancel order 6
    await CancelLimitOrderDirect(acc1, router, orderBook, [6])

    // try to update order 6, which fails (but does not revert)
    await UpdateLimitOrderDirect(acc1, router, orderBook, [
      {
        orderId: 6,
        newAmount0: ParseWETH('0.1'),
        newPrice: ParseUSDC('1525'),
        hintId: 0,
      },
    ])

    await expectOrderBook(orderBook, [3, 2, 0], [])
  })
})
