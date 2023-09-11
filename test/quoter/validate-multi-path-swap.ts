import {expect} from 'chai'
import {getSetupValuesAndCreateOrders} from '../shared/setup-master'

describe('ValidateMultiPathSwap', function () {
  async function setup() {
    const {router} = await getSetupValuesAndCreateOrders()

    return {
      validateMultiPathSwap: (swaps: any) => {
        return router.validateMultiPathSwap(swaps)
      },
      router,
    }
  }

  it('should validate request for swap-exact-output WETH (input) -> LINK (output)', async function () {
    const {validateMultiPathSwap} = await setup()

    const swapRequest_weth_usdc = {isAsk: true, orderBookId: 0}
    const swapRequest_wbtc_usdc = {isAsk: false, orderBookId: 1}
    const swapRequest_wbtc_link = {isAsk: true, orderBookId: 2}

    await validateMultiPathSwap([swapRequest_weth_usdc, swapRequest_wbtc_usdc, swapRequest_wbtc_link])
  })

  it('checks middle tokens match ', async function () {
    const {validateMultiPathSwap, router} = await setup()

    const swapRequest_weth_usdc = {isAsk: true, orderBookId: 0}
    const swapRequest_wbtc_usdc = {isAsk: true, orderBookId: 1}
    const swapRequest_wbtc_link = {isAsk: true, orderBookId: 2}

    await expect(
      validateMultiPathSwap([swapRequest_weth_usdc, swapRequest_wbtc_usdc, swapRequest_wbtc_link])
    ).to.be.revertedWithCustomError(router, 'LighterV2Quoter_InvalidSwapExactMultiRequestCombination')
  })
})
