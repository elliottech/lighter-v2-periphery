import {getSetupValuesAndCreateOrders} from '../shared/setup-master'
import {ParseLINK, ParseWBTC, ParseWETH} from '../shared/amount'
import {expect} from 'chai'
import {BaseContract, BigNumber} from 'ethers'
import {Router} from 'typechain-types'
import {ethers} from 'hardhat'

describe('GetQuoteForExactMulti', () => {
  // checkMultiQuote covers bot the case for getQuoteForExactOutputMulti and getQuoteForExactInputMulti
  // as they should return the same values if they are precise
  async function checkMultiQuote(r: {
    router: Router
    input: BigNumber
    output: BigNumber
    requests: {isAsk: boolean; orderBookId: number}[]
  }) {
    let buildResponse = await r.router.getQuoteForExactOutputMulti(r.requests, r.output)

    expect(buildResponse.quotedInput).to.equal(r.input)
    expect(buildResponse.quotedOutput).to.equal(r.output)

    buildResponse = await r.router.getQuoteForExactInputMulti(r.requests, r.input)

    expect(buildResponse.quotedInput).to.equal(r.input)
    expect(buildResponse.quotedOutput).to.equal(r.output)
  }

  it('2 paths weth -> usdc -> wbtc', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    await checkMultiQuote({
      router,
      input: ParseWETH(3.4038),
      output: ParseWBTC(0.18403),
      requests: [
        {isAsk: true, orderBookId: 0},
        {isAsk: false, orderBookId: 1},
      ],
    })
  })

  it('2 paths wbtc -> usdc -> weth', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    await checkMultiQuote({
      router,
      input: ParseWBTC(0.22346),
      output: ParseWETH(3.7084),
      requests: [
        {isAsk: true, orderBookId: 1},
        {isAsk: false, orderBookId: 0},
      ],
    })
  })

  it('3 paths weth -> usdc -> wbtc -> link', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    await checkMultiQuote({
      router,
      input: ParseWETH(3.4038),
      output: ParseLINK(900.0455),
      requests: [
        {isAsk: true, orderBookId: 0},
        {isAsk: false, orderBookId: 1},
        {isAsk: true, orderBookId: 2},
      ],
    })
  })

  it('3 paths link -> wbtc -> usdc -> weth', async () => {
    const {router} = await getSetupValuesAndCreateOrders()

    await checkMultiQuote({
      router,
      input: ParseLINK(1143.319),
      output: ParseWETH(3.7084),
      requests: [
        {isAsk: false, orderBookId: 2},
        {isAsk: true, orderBookId: 1},
        {isAsk: false, orderBookId: 0},
      ],
    })
  })
})
