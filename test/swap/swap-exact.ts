import {getSetupValuesAndCreateOrders} from '../shared/setup-master'
import {ParseUSDC, ParseWETH} from '../shared/amount'
import {expect} from 'chai'
import {BigNumber} from 'ethers'
import {
  SwapExactInputSingleDirect,
  SwapExactInputSingleViaFallback,
  SwapExactOutputSingleDirect,
  SwapExactOutputSingleViaFallback,
} from '../shared/api'
import {reportGasCost} from 'reports'

describe('SwapExact Input/Output', () => {
  const maxInput = BigNumber.from(2).pow(250)

  it('can pay with native token', async () => {
    const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

    // output of ExactInput if put as ExactOutput should return the initial value
    const tx = await SwapExactInputSingleViaFallback(acc2, router, orderBook, true, ParseWETH(0.7516), 0, true, false)

    await expect(tx).to.changeEtherBalance(acc2, ParseWETH(-0.7516))
    await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(0))
    await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC('1052.24'))
  })

  it('can receive unwrapped ETH', async () => {
    const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

    // output of ExactInput if put as ExactOutput should return the initial value
    const tx = await SwapExactOutputSingleViaFallback(
      acc2,
      router,
      orderBook,
      false,
      ParseWETH(0.7516),
      maxInput,
      false,
      true
    )

    await expect(tx).to.changeEtherBalance(acc2, ParseWETH(0.7516))
    await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(0))
    await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC('-1089.82'))
  })

  it('return values', async () => {
    const {router, orderBook, acc2} = await getSetupValuesAndCreateOrders()
    let r

    // ask swapExactInputSingle
    r = await router
      .connect(acc2)
      .callStatic.swapExactInputSingle(await orderBook.orderBookId(), true, ParseWETH('0.7516'), 0, acc2.address, false)

    expect(r.swappedInput).to.equal(ParseWETH('0.7516'))
    expect(r.swappedOutput).to.equal(ParseUSDC('1052.24'))

    // bid swapExactInputSingle
    r = await router
      .connect(acc2)
      .callStatic.swapExactInputSingle(
        await orderBook.orderBookId(),
        false,
        ParseUSDC('1089.82'),
        0,
        acc2.address,
        false
      )

    expect(r.swappedInput).to.equal(ParseUSDC('1089.82'))
    expect(r.swappedOutput).to.equal(ParseWETH('0.7516'))

    // ask swapExactOutputSingle
    r = await router
      .connect(acc2)
      .callStatic.swapExactOutputSingle(
        await orderBook.orderBookId(),
        true,
        ParseUSDC('1052.24'),
        maxInput,
        acc2.address,
        false
      )

    expect(r.swappedInput).to.equal(ParseWETH('0.7516'))
    expect(r.swappedOutput).to.equal(ParseUSDC('1052.24'))

    // bid swapExactOutputSingle
    r = await router
      .connect(acc2)
      .callStatic.swapExactOutputSingle(
        await orderBook.orderBookId(),
        false,
        ParseWETH('0.7516'),
        maxInput,
        acc2.address,
        false
      )

    expect(r.swappedInput).to.equal(ParseUSDC('1089.82'))
    expect(r.swappedOutput).to.equal(ParseWETH('0.7516'))
  })

  describe('weth-usdc book ask 1 match', () => {
    describe('input', () => {
      it('direct', async () => {
        await test(SwapExactInputSingleDirect, 'SWAP_EXACT_INPUT_ASK_1_MATCH_DIRECT')
      })
      it('fallback', async () => {
        await test(SwapExactInputSingleViaFallback, 'SWAP_EXACT_INPUT_ASK_1_MATCH_FALLBACK')
      })

      async function test(f: any, scenario: string) {
        const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

        // output of ExactInput if put as ExactOutput should return the initial value
        const tx = await f(acc2, router, orderBook, true, ParseWETH(0.7516), 0)

        await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(-0.7516))
        await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC('1052.24'))
        await reportGasCost(scenario, tx)
      }
    })
    describe('output', () => {
      it('direct', async () => {
        await test(SwapExactOutputSingleDirect, 'SWAP_EXACT_OUTPUT_ASK_1_MATCH_DIRECT')
      })
      it('fallback', async () => {
        await test(SwapExactOutputSingleViaFallback, 'SWAP_EXACT_OUTPUT_ASK_1_MATCH_FALLBACK')
      })

      async function test(f: any, scenario: string) {
        const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

        // output of ExactInput if put as ExactOutput should return the initial value
        const tx = await f(acc2, router, orderBook, true, ParseUSDC('1052.24'), maxInput)

        await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(-0.7516))
        await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC('1052.24'))
        await reportGasCost(scenario, tx)
      }
    })
  })

  describe('weth-usdc book bid 1 match', () => {
    describe('input', () => {
      it('direct', async () => {
        await test(SwapExactInputSingleDirect, 'SWAP_EXACT_INPUT_ASK_1_MATCH_DIRECT')
      })
      it('fallback', async () => {
        await test(SwapExactInputSingleViaFallback, 'SWAP_EXACT_INPUT_ASK_1_MATCH_FALLBACK')
      })

      async function test(f: any, scenario: string) {
        const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

        // output of ExactInput if put as ExactOutput should return the initial value
        const tx = await f(acc2, router, orderBook, false, ParseUSDC('1089.82'), 0)

        await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(0.7516))
        await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC('-1089.82'))
        await reportGasCost(scenario, tx)
      }
    })
    describe('output', () => {
      it('direct', async () => {
        await test(SwapExactOutputSingleDirect, 'SWAP_EXACT_OUTPUT_BID_1_MATCH_DIRECT')
      })
      it('fallback', async () => {
        await test(SwapExactOutputSingleViaFallback, 'SWAP_EXACT_OUTPUT_BID_1_MATCH_FALLBACK')
      })

      async function test(f: any, scenario: string) {
        const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

        // output of ExactInput if put as ExactOutput should return the initial value
        const tx = await f(acc2, router, orderBook, false, ParseWETH(0.7516), maxInput)

        await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(0.7516))
        await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC('-1089.82'))
        await reportGasCost(scenario, tx)
      }
    })
  })

  describe('weth-usdc book ask 2 matches', () => {
    it('input', async () => {
      const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

      // output of ExactInput if put as ExactOutput should return the initial value
      const tx = await SwapExactInputSingleViaFallback(acc2, router, orderBook, true, ParseWETH(2.5), 0)

      await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(-2.5))
      await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC(3475))
      await reportGasCost('SWAP_EXACT_INPUT_ASK_2_MATCHES_FALLBACK', tx)
    })
    it('output', async () => {
      const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

      // output of ExactInput if put as ExactOutput should return the initial value
      const tx = await SwapExactOutputSingleViaFallback(acc2, router, orderBook, true, ParseUSDC(3475), maxInput)

      await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(-2.5))
      await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC(3475))
      await reportGasCost('SWAP_EXACT_OUTPUT_ASK_2_MATCHES_FALLBACK', tx)
    })
  })

  describe('weth-usdc book bid 2 matches', () => {
    it('input', async () => {
      const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

      // output of ExactInput if put as ExactOutput should return the initial value
      const tx = await SwapExactInputSingleViaFallback(acc2, router, orderBook, false, ParseUSDC(3650), 0)

      await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(2.5))
      await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC(-3650))
      await reportGasCost('SWAP_EXACT_INPUT_BID_2_MATCHES_FALLBACK', tx)
    })
    it('output', async () => {
      const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

      // output of ExactInput if put as ExactOutput should return the initial value
      const tx = await SwapExactOutputSingleViaFallback(acc2, router, orderBook, false, ParseWETH(2.5), maxInput)

      await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(2.5))
      await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC(-3650))
      await reportGasCost('SWAP_EXACT_OUTPUT_BID_2_MATCHES_FALLBACK', tx)
    })
  })

  describe('weth-usdc book ask 3 matches', () => {
    it('input', async () => {
      const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

      // output of ExactInput if put as ExactOutput should return the initial value
      const tx = await SwapExactInputSingleViaFallback(acc2, router, orderBook, true, ParseWETH(3), 0)

      await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(-3))
      await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC(4156.25))
      await reportGasCost('SWAP_EXACT_INPUT_ASK_3_MATCHES_FALLBACK', tx)
    })
    it('output', async () => {
      const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

      // output of ExactInput if put as ExactOutput should return the initial value
      const tx = await SwapExactOutputSingleViaFallback(acc2, router, orderBook, true, ParseUSDC(4156.25), maxInput)

      await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(-3))
      await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC(4156.25))
      await reportGasCost('SWAP_EXACT_OUTPUT_ASK_3_MATCHES_FALLBACK', tx)
    })
  })

  describe('weth-usdc book bid 3 matches', () => {
    it('input', async () => {
      const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

      // output of ExactInput if put as ExactOutput should return the initial value
      const tx = await SwapExactInputSingleViaFallback(acc2, router, orderBook, false, ParseUSDC(4393.75), 0)

      await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(3))
      await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC(-4393.75))
      await reportGasCost('SWAP_EXACT_INPUT_BID_3_MATCHES_FALLBACK', tx)
    })
    it('output', async () => {
      const {router, orderBook, acc2, usdc, weth} = await getSetupValuesAndCreateOrders()

      // output of ExactInput if put as ExactOutput should return the initial value
      const tx = await SwapExactOutputSingleViaFallback(acc2, router, orderBook, false, ParseWETH(3), maxInput)

      await expect(tx).to.changeTokenBalance(weth, acc2, ParseWETH(3))
      await expect(tx).to.changeTokenBalance(usdc, acc2, ParseUSDC(-4393.75))
      await reportGasCost('SWAP_EXACT_OUTPUT_BID_3_MATCHES_FALLBACK', tx)
    })
  })

  it('reverts with NotEnoughLiquidity', async () => {
    const {router, acc2, orderBook} = await getSetupValuesAndCreateOrders()

    await expect(
      router.connect(acc2).swapExactOutputSingle(0, false, ParseWETH(4), maxInput, acc2.address, false)
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Swap_NotEnoughLiquidity')

    await expect(
      router.connect(acc2).swapExactInputSingle(0, true, ParseWETH(4), 0, acc2.address, false)
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Swap_NotEnoughLiquidity')

    await expect(
      router.connect(acc2).swapExactOutputSingle(0, true, ParseUSDC(10000), maxInput, acc2.address, false)
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Swap_NotEnoughLiquidity')

    await expect(
      router.connect(acc2).swapExactInputSingle(0, false, ParseUSDC(10000), 0, acc2.address, false)
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Swap_NotEnoughLiquidity')
  })

  it('reverts with NotEnoughOutput', async () => {
    const {router, acc2, orderBook} = await getSetupValuesAndCreateOrders()

    await expect(
      router.connect(acc2).swapExactInputSingle(0, true, ParseWETH(1), ParseUSDC(1500), acc2.address, false)
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Swap_NotEnoughOutput')

    await expect(
      router.connect(acc2).swapExactInputSingle(0, false, ParseUSDC(1400), ParseWETH(1), acc2.address, false)
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Swap_NotEnoughOutput')
  })

  it('reverts with TooMuchRequested', async () => {
    const {router, acc2, orderBook} = await getSetupValuesAndCreateOrders()

    await expect(
      router.connect(acc2).swapExactOutputSingle(0, false, ParseWETH(1), ParseUSDC(1400), acc2.address, false)
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Swap_TooMuchRequested')

    await expect(
      router.connect(acc2).swapExactOutputSingle(0, true, ParseUSDC(1500), ParseWETH(1), acc2.address, false)
    ).to.be.revertedWithCustomError(orderBook, 'LighterV2Swap_TooMuchRequested')
  })
})
