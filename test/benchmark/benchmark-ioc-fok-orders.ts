import {getSetupValuesAndCreateOrders} from '../shared/setup-master'
import {ParseUSDC, ParseWETH} from '../shared/amount'
import {
  CreateFOKOrderDirect,
  CreateFOKOrderViaFallback,
  CreateIOCOrderDirect,
  CreateIOCOrderViaFallback,
} from '../shared/api'
import {expect} from 'chai'
import {reportGasCost} from 'reports'

describe('benchmark IoC & FoK order', () => {
  describe('Ask; 2 full 1 one partial match', () => {
    it('IoC direct', async () => {
      await test(CreateIOCOrderDirect, 'IOC_ASK_CREATE_2.5_FILLS_DIRECT')
    })
    it('IoC fallback', async () => {
      await test(CreateIOCOrderViaFallback, 'IOC_ASK_CREATE_2.5_FILLS_FALLBACK')
    })
    it('FoK direct', async () => {
      await test(CreateFOKOrderDirect, 'FOK_ASK_CREATE_2.5_FILLS_DIRECT')
    })
    it('FoK fallback', async () => {
      await test(CreateFOKOrderViaFallback, 'FOK_ASK_CREATE_2.5_FILLS_FALLBACK')
    })

    async function test(f: any, scenario: string) {
      const {router, acc2, orderBookInstance_weth_usdc, weth, usdc} = await getSetupValuesAndCreateOrders()

      const tx = await f(acc2, router, orderBookInstance_weth_usdc, {
        amount0: ParseWETH('3'),
        price: ParseUSDC('1300'),
        isAsk: true,
      })
      await expect(tx).to.changeTokenBalance(usdc, acc2.address, ParseUSDC(1.5 * 1400 + 1.25 * 1375 + 0.25 * 1350))
      await reportGasCost(scenario, tx)
    }
  })
  describe('Bid; 2 full 1 one partial match', () => {
    it('IoC direct', async () => {
      await test(CreateIOCOrderDirect, 'IOC_CREATE_2.5_FILLS_DIRECT')
    })
    it('IOF fallback', async () => {
      await test(CreateIOCOrderViaFallback, 'IOC_CREATE_2.5_FILLS_FALLBACK')
    })
    it('FoK direct', async () => {
      await test(CreateFOKOrderDirect, 'FOK_CREATE_2.5_FILLS_DIRECT')
    })
    it('FoK fallback', async () => {
      await test(CreateFOKOrderViaFallback, 'FOK_CREATE_2.5_FILLS_FALLBACK')
    })

    async function test(f: any, scenario: string) {
      const {router, acc2, orderBook, weth} = await getSetupValuesAndCreateOrders()

      const tx = await f(acc2, router, orderBook, {
        amount0: ParseWETH('3.5'),
        price: ParseUSDC('1550'),
        isAsk: false,
      })
      await expect(tx).to.changeTokenBalance(weth, acc2.address, ParseWETH('3.5'))
      await reportGasCost(scenario, tx)
    }
  })
})
