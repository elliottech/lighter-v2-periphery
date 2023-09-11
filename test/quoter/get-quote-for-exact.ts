import {getSetupValuesAndCreateOrders} from '../shared/setup-master'
import {ParseUSDC, ParseWETH} from '../shared/amount'
import {expect} from 'chai'
import {BigNumber} from 'ethers'

describe('GetQuoteForExact', () => {
  it('weth-usdc book ask 1 match', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    // output of ExactInput if put as ExactOutput should return the initial value
    expect((await router.getQuoteForExactInput(0, true, ParseWETH(0.7516))).quotedOutput).to.equal(ParseUSDC('1052.24'))
    expect((await router.getQuoteForExactOutput(0, true, ParseUSDC('1052.24'))).quotedInput).to.equal(ParseWETH(0.7516))
  })

  it('weth-usdc book bid 1 match', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    // output of ExactInput if put as ExactOutput should return the initial value
    expect((await router.getQuoteForExactOutput(0, false, ParseWETH(0.7516))).quotedInput).to.equal(
      ParseUSDC('1089.82')
    )
    expect((await router.getQuoteForExactInput(0, false, ParseUSDC('1089.82'))).quotedOutput).to.equal(
      ParseWETH(0.7516)
    )
  })

  it('weth-usdc book ask 2 matches', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    // output of ExactInput if put as ExactOutput should return the initial value
    expect((await router.getQuoteForExactInput(0, true, ParseWETH(2.5))).quotedOutput).to.equal(ParseUSDC(3475.0))
    expect((await router.getQuoteForExactOutput(0, true, ParseUSDC(3475.0))).quotedInput).to.equal(ParseWETH(2.5))
  })

  it('weth-usdc book bid 2 matches', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    // output of ExactInput if put as ExactOutput should return the initial value
    expect((await router.getQuoteForExactOutput(0, false, ParseWETH(2.5))).quotedInput).to.equal(ParseUSDC(3650))
    expect((await router.getQuoteForExactInput(0, false, ParseUSDC(3650))).quotedOutput).to.equal(ParseWETH(2.5))
  })

  it('weth-usdc book ask 3 matches', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    // output of ExactInput if put as ExactOutput should return the initial value
    expect((await router.getQuoteForExactInput(0, true, ParseWETH(3))).quotedOutput).to.equal(ParseUSDC(4156.25))

    // requesting a bit less should result in the same returned value, as the user will receive *at least* exact output
    // due to the mechanics of the token0 ticks
    const output = await router.getQuoteForExactOutput(0, true, ParseUSDC('4156.249999'))
    expect(output.quotedInput).to.equal(ParseWETH(3))
    expect(output.quotedOutput).to.equal(ParseUSDC(4156.25))
  })

  it('weth-usdc book bid 3 matches', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    // output of ExactInput if put as ExactOutput should return the initial value
    expect((await router.getQuoteForExactOutput(0, false, ParseWETH(3))).quotedInput).to.equal(ParseUSDC(4393.75))
    expect((await router.getQuoteForExactInput(0, false, ParseUSDC(4393.75))).quotedOutput).to.equal(ParseWETH(3))
  })

  it('reverts with NotEnoughLiquidity', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    await expect(router.getQuoteForExactOutput(0, false, ParseWETH(4))).to.be.revertedWithCustomError(
      router,
      'LighterV2Quoter_NotEnoughLiquidity'
    )

    await expect(router.getQuoteForExactInput(0, true, ParseWETH(4))).to.be.revertedWithCustomError(
      router,
      'LighterV2Quoter_NotEnoughLiquidity'
    )

    await expect(router.getQuoteForExactOutput(0, true, ParseUSDC(10000))).to.be.revertedWithCustomError(
      router,
      'LighterV2Quoter_NotEnoughLiquidity'
    )

    await expect(router.getQuoteForExactInput(0, false, ParseUSDC(10000))).to.be.revertedWithCustomError(
      router,
      'LighterV2Quoter_NotEnoughLiquidity'
    )
  })
})
