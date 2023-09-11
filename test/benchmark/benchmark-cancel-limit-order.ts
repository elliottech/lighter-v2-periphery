import {getSetupValuesAndCreateOrders} from '../shared/setup-master'
import {reportGasCost} from 'reports/generate-gas-cost-report'
import {CancelLimitOrderDirect, CancelLimitOrderViaFallback} from '../shared/api'
import {expectOrderBook} from '../shared/order-book'

describe('benchmark limit order cancellation', function () {
  describe('cancels 1 limit order', () => {
    it('via fallback', async function () {
      await test(CancelLimitOrderViaFallback, 'CANCEL_1_LIMIT_ORDER_VIA_FALLBACK')
    })
    it('direct', async function () {
      await test(CancelLimitOrderDirect, 'CANCEL_1_LIMIT_ORDER_DIRECT')
    })

    async function test(f: any, scenario: string) {
      const {router, acc1, orderBookInstance_weth_usdc} = await getSetupValuesAndCreateOrders()

      const tx = await f(acc1, router, orderBookInstance_weth_usdc, [6])
      await expectOrderBook(orderBookInstance_weth_usdc, [3, 2, 0], [4, 7, 5, 0])

      await reportGasCost(scenario, tx)
    }
  })

  describe('cancels 4 limit order', () => {
    it('via fallback', async function () {
      await test(CancelLimitOrderViaFallback, 'CANCEL_4_LIMIT_ORDERS_VIA_FALLBACK')
    })
    it('direct', async function () {
      await test(CancelLimitOrderDirect, 'CANCEL_4_LIMIT_ORDERS_DIRECT')
    })

    async function test(f: any, scenario: string) {
      const {router, acc1, orderBookInstance_weth_usdc} = await getSetupValuesAndCreateOrders()

      const tx = await f(acc1, router, orderBookInstance_weth_usdc, [6, 7, 3, 4])
      await expectOrderBook(orderBookInstance_weth_usdc, [2, 0], [5, 0])

      await reportGasCost(scenario, tx)
    }
  })
})
