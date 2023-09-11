import {expect} from '../shared/expect'
import {getSetupValuesAndCreateOrders} from '../shared/setup-master'
import {BaseContract, BigNumber} from 'ethers'
import {ethers} from 'hardhat'
import {
  PerformSwapExactInputMultiFunction,
  PerformSwapExactOutputMultiFunction,
  SwapExactInputMultiDirect,
  SwapExactInputMultiViaFallback,
  SwapExactOutputMultiDirect,
  SwapExactOutputMultiViaFallback,
} from '../shared/api'
import {reportGasCost} from 'reports'
import {ISwapMultiRequest} from 'typechain-types/contracts/Router'
import {ParseWETH, ParseUSDC, ParseWBTC, ParseLINK} from 'test/shared/amount'

describe('SwapExact Input/Output Multi', async () => {
  async function swapExactInputMultiSuccess(
    s: any,
    scenario: string,
    f: PerformSwapExactInputMultiFunction,
    multiPathExactInputRequest: ISwapMultiRequest.MultiPathExactInputRequestStruct,
    wrap: boolean,
    unwrap: boolean,
    exactInputToken: BaseContract,
    exactInputAmountChange: BigNumber,
    minOutputToken: BaseContract,
    minOutputAmountChange: BigNumber,
    refundToken?: BaseContract,
    refundAmount?: BigNumber
  ) {
    const tx = await swapExactInputMulti(s, f, multiPathExactInputRequest, wrap)
    await assertPostSwapBalances(
      tx,
      scenario,
      s.acc2.address,
      wrap,
      unwrap,
      multiPathExactInputRequest.recipient.toString(),
      exactInputToken,
      exactInputAmountChange,
      minOutputToken,
      minOutputAmountChange,
      refundToken,
      refundAmount
    )
    return tx
  }

  async function swapExactInputMulti(
    s: any,
    f: PerformSwapExactInputMultiFunction,
    multiPathExactInputRequest: ISwapMultiRequest.MultiPathExactInputRequestStruct,
    wrap: boolean
  ) {
    const value: BigNumber = wrap ? BigNumber.from(multiPathExactInputRequest.exactInput.toString()) : BigNumber.from(0)

    return await f(s.acc2, s.router, multiPathExactInputRequest, value)
  }

  async function swapExactOutputMultiSuccess(
    s: any,
    scenario: string,
    f: PerformSwapExactOutputMultiFunction,
    multiPathExactOutputRequest: ISwapMultiRequest.MultiPathExactOutputRequestStruct,
    wrap: boolean,
    unwrap: boolean,
    maxInputToken: BaseContract,
    inputAmountChange: BigNumber,
    minOutputToken: BaseContract,
    outputAmountChange: BigNumber,
    refundToken?: BaseContract,
    refundAmount?: BigNumber
  ) {
    const tx = await swapExactOutputMulti(s, f, multiPathExactOutputRequest, wrap)
    await assertPostSwapBalances(
      tx,
      scenario,
      s.acc2.address,
      wrap,
      unwrap,
      multiPathExactOutputRequest.recipient.toString(),
      maxInputToken,
      inputAmountChange,
      minOutputToken,
      outputAmountChange,
      refundToken,
      refundAmount
    )
    return tx
  }

  async function swapExactOutputMulti(
    s: any,
    f: PerformSwapExactOutputMultiFunction,
    multiPathExactOutputRequest: ISwapMultiRequest.MultiPathExactOutputRequestStruct,
    wrap: boolean
  ) {
    const value: BigNumber = wrap ? BigNumber.from(multiPathExactOutputRequest.maxInput.toString()) : BigNumber.from(0)

    return await f(s.acc2, s.router, multiPathExactOutputRequest, value)
  }

  async function assertPostSwapBalances(
    tx: any,
    scenario: string,
    takerAddress: string,
    wrap: boolean,
    unwrap: boolean,
    recipient: string,
    inputToken: BaseContract,
    inputAmountChange: BigNumber,
    outputToken: BaseContract,
    outputAmountChange: BigNumber,
    refundToken?: BaseContract,
    refundAmount?: BigNumber
  ) {
    if (!wrap) {
      await expect(tx).to.changeTokenBalance(inputToken, takerAddress, inputAmountChange)
    } else {
      await expect(tx).to.changeTokenBalance(inputToken, takerAddress, 0)
    }

    if (unwrap) {
      await expect(tx).to.changeTokenBalance(outputToken, recipient, 0)

      // typescript wants an actual signer not the address
      const recipientSigner = await ethers.getSigner(recipient)
      await expect(tx).to.changeEtherBalance(recipientSigner, outputAmountChange)
    } else {
      await expect(tx).to.changeTokenBalance(outputToken, recipient, outputAmountChange)
    }

    if (refundAmount && refundAmount.gt(BigNumber.from(0))) {
      await expect(tx).to.changeTokenBalance(refundToken, recipient, refundAmount)
    }

    await reportGasCost(scenario, tx)
  }

  describe('SwapExactMulti with 1 hop', async () => {
    let s: any, acc2: any, token_weth: BaseContract, token_usdc: BaseContract
    let multiPathExactInputRequest: ISwapMultiRequest.MultiPathExactInputRequestStruct
    let multiPathExactInputUnwrapRequest: ISwapMultiRequest.MultiPathExactInputRequestStruct
    let multiPathExactOutputRequest: ISwapMultiRequest.MultiPathExactOutputRequestStruct
    let multiPathExactOutputUnwrapRequest: ISwapMultiRequest.MultiPathExactOutputRequestStruct

    beforeEach(async () => {
      s = await getSetupValuesAndCreateOrders()
      ;({acc2, token_weth, token_usdc} = s)

      multiPathExactInputRequest = {
        swapRequests: [{isAsk: true, orderBookId: 0}],
        exactInput: ParseWETH(2.5),
        minOutput: ParseUSDC(3475.0),
        recipient: acc2.address,
        unwrap: false,
      }

      multiPathExactInputUnwrapRequest = {
        swapRequests: [{isAsk: false, orderBookId: 0}],
        exactInput: ParseUSDC(3475.0),
        minOutput: ParseWETH(2.3813),
        recipient: acc2.address,
        unwrap: true,
      }

      multiPathExactOutputRequest = {
        swapRequests: [{isAsk: true, orderBookId: 0}],
        maxInput: ParseWETH(2.5),
        exactOutput: ParseUSDC(3475.0),
        recipient: acc2.address,
        unwrap: false,
      }

      multiPathExactOutputUnwrapRequest = {
        swapRequests: [{isAsk: false, orderBookId: 0}],
        maxInput: ParseUSDC(3475.0),
        exactOutput: ParseWETH(2.3813),
        recipient: acc2.address,
        unwrap: true,
      }
    })

    // the call when there is just one hop is forwarded to swapExactInputSingle,
    // so it's required to check for 1 and 2 hops in order to cover all scenarios
    it('return values', async () => {
      let r
      r = await s.router.connect(acc2).callStatic.swapExactInputMulti(multiPathExactInputRequest)
      expect(r.swappedInput).to.equal(ParseWETH(2.5))
      expect(r.swappedOutput).to.equal(ParseUSDC(3475.0))

      r = await s.router.connect(acc2).callStatic.swapExactOutputMulti(multiPathExactOutputRequest)
      expect(r.swappedInput).to.equal(ParseWETH(2.5))
      expect(r.swappedOutput).to.equal(ParseUSDC(3475.0))
    })

    describe('input', () => {
      it('direct', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_MULTI_ON_1_ROUTE_PATH',
          SwapExactInputMultiDirect,
          multiPathExactInputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('wrap direct', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_WRAP_MULTI_ON_1_ROUTE_PATH',
          SwapExactInputMultiDirect,
          multiPathExactInputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('fallback', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_MULTI_ON_1_ROUTE_PATH_FALLBACK',
          SwapExactInputMultiViaFallback,
          multiPathExactInputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('wrap fallback', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_WRAP_MULTI_ON_1_ROUTE_PATH_FALLBACK',
          SwapExactInputMultiViaFallback,
          multiPathExactInputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('fallback different recipient', async () => {
        const [, , , recipient] = await ethers.getSigners()
        multiPathExactInputRequest.recipient = recipient.address
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_MULTI_ON_1_ROUTE_PATH_FALLBACK_DIFFERENT_RECIPIENT',
          SwapExactInputMultiViaFallback,
          multiPathExactInputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('unwrap direct', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_UNWRAP_MULTI_ON_1_ROUTE_PATH',
          SwapExactInputMultiDirect,
          multiPathExactInputUnwrapRequest,
          false,
          true,
          token_usdc,
          ParseUSDC('-3474.9175'),
          token_weth,
          ParseWETH('2.3813')
        )
      })

      it('unwrap fallback', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_UNWRAP_MULTI_ON_1_ROUTE_PATH_FALLBACK',
          SwapExactInputMultiViaFallback,
          multiPathExactInputUnwrapRequest,
          false,
          true,
          token_usdc,
          ParseUSDC('-3474.9175'),
          token_weth,
          ParseWETH('2.3813')
        )
      })
    })

    describe('output', () => {
      it('direct', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_ON_1_ROUTE_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC('3475.0')
        )
      })

      it('wrap-direct', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_WRAP_ON_1_ROUTE_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('wrap-fallback', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_WRAP_ON_1_ROUTE_PATH_FALLBACK',
          SwapExactOutputMultiViaFallback,
          multiPathExactOutputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('fallback', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_ON_1_ROUTE_PATH_FALLBACK',
          SwapExactOutputMultiViaFallback,
          multiPathExactOutputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('different-recipient-direct', async () => {
        const [, , , recipient] = await ethers.getSigners()
        multiPathExactOutputRequest.recipient = recipient.address
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_DIFF_RECIPIENT_ON_1_ROUTE_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_usdc,
          ParseUSDC(3475.0)
        )
      })

      it('unwrap-direct', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_UNWRAP_ON_1_ROUTE_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputUnwrapRequest,
          false,
          true,
          token_usdc,
          ParseUSDC('-3474.9175'),
          token_weth,
          ParseWETH('2.3813')
        )
      })
    })
  })

  describe('SwapExactMulti with 2 hops', async () => {
    let s: any, acc2: any, token_weth: BaseContract, token_usdc: BaseContract, token_wbtc: BaseContract
    let multiPathExactInputRequest: ISwapMultiRequest.MultiPathExactInputRequestStruct
    let multiPathExactOutputRequest: ISwapMultiRequest.MultiPathExactOutputRequestStruct

    beforeEach(async () => {
      s = await getSetupValuesAndCreateOrders()
      ;({acc2, token_weth, token_wbtc, token_usdc} = s)

      multiPathExactInputRequest = {
        swapRequests: [
          {isAsk: true, orderBookId: 0},
          {isAsk: false, orderBookId: 1},
        ],
        exactInput: ParseWETH(2.5),
        minOutput: ParseWBTC(0.13627),
        recipient: acc2.address,
        unwrap: false,
      }
      multiPathExactOutputRequest = {
        swapRequests: [
          {isAsk: true, orderBookId: 0},
          {isAsk: false, orderBookId: 1},
        ],
        maxInput: ParseWETH(2.5),
        exactOutput: ParseWBTC(0.13627),
        recipient: acc2.address,
        unwrap: false,
      }
    })

    it('return values', async () => {
      let r
      r = await s.router.connect(acc2).callStatic.swapExactInputMulti(multiPathExactInputRequest)
      expect(r.swappedInput).to.equal(ParseWETH(2.5))
      expect(r.swappedOutput).to.equal(ParseWBTC(0.13627))

      r = await s.router.connect(acc2).callStatic.swapExactOutputMulti(multiPathExactOutputRequest)
      expect(r.swappedInput).to.equal(ParseWETH(2.5))
      expect(r.swappedOutput).to.equal(ParseWBTC(0.13627))
    })

    describe('input', () => {
      it('direct', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_MULTI_ON_2_ROUTES_PATH',
          SwapExactInputMultiDirect,
          multiPathExactInputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('wrap', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_WRAP_MULTI_ON_2_ROUTES_PATH',
          SwapExactInputMultiDirect,
          multiPathExactInputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('direct-fallback', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_MULTI_ON_2_ROUTES_PATH_FALLBACK',
          SwapExactInputMultiViaFallback,
          multiPathExactInputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('wrap-fallback', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_WRAP_MULTI_ON_2_ROUTES_PATH_FALLBACK',
          SwapExactInputMultiViaFallback,
          multiPathExactInputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('direct-different-recipient', async () => {
        //assert refund amount on orderbook-WBTC_USDC (orderBookId: 1)
        //token_USDC should be refunded by 115000
        const [, , , recipient] = await ethers.getSigners()
        multiPathExactInputRequest.recipient = recipient.address
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_MULTI_ON_2_ROUTES_PATH_DIFFERENT_RECIPIENT',
          SwapExactInputMultiDirect,
          multiPathExactInputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })
    })

    describe('output', async () => {
      it('direct', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_ON_2_ROUTES_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('direct-wrap', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_WRAP_ON_2_ROUTES_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('direct-fallback', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_ON_2_ROUTES_PATH_FALLBACK',
          SwapExactOutputMultiViaFallback,
          multiPathExactOutputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('wrap-fallback', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_WRAP_ON_2_ROUTES_PATH_FALLBACK',
          SwapExactOutputMultiViaFallback,
          multiPathExactOutputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('diff-recipient', async () => {
        const [, , , recipient] = await ethers.getSigners()
        multiPathExactOutputRequest.recipient = recipient.address
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_DIFF_RECIPIENT_ON_2_ROUTES_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_wbtc,
          ParseWBTC(0.13627),
          token_usdc,
          BigNumber.from('115000')
        )
      })
    })
  })

  describe('SwapExactMulti with 3 hops', async () => {
    let acc2: any, token_weth: BaseContract, token_usdc: BaseContract, token_link: BaseContract, s: any
    let router: any,
      orderBookInstance_weth_usdc: any,
      orderBookInstance_wbtc_usdc: any,
      orderBookInstance_wbtc_link: any
    let multiPathExactInputRequest: ISwapMultiRequest.MultiPathExactInputRequestStruct
    let multiPathExactOutputRequest: ISwapMultiRequest.MultiPathExactOutputRequestStruct

    beforeEach(async () => {
      s = await getSetupValuesAndCreateOrders()
      ;({
        acc2,
        router,
        token_weth,
        token_usdc,
        token_link,
        orderBookInstance_weth_usdc,
        orderBookInstance_wbtc_usdc,
        orderBookInstance_wbtc_link,
      } = s)
      multiPathExactInputRequest = {
        swapRequests: [
          {isAsk: true, orderBookId: 0},
          {isAsk: false, orderBookId: 1},
          {isAsk: true, orderBookId: 2},
        ],
        exactInput: ParseWETH(2.5),
        minOutput: ParseLINK('667.723'),
        recipient: acc2.address,
        unwrap: false,
      }
      multiPathExactOutputRequest = {
        swapRequests: [
          {isAsk: true, orderBookId: 0},
          {isAsk: false, orderBookId: 1},
          {isAsk: true, orderBookId: 2},
        ],
        maxInput: ParseWETH(2.5),
        exactOutput: ParseLINK('667.723'),
        recipient: acc2.address,
        unwrap: false,
      }
    })

    describe('input', () => {
      it('direct', async () => {
        const tx = await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_MULTI_ON_3_ROUTES_PATH',
          SwapExactInputMultiDirect,
          multiPathExactInputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_link,
          ParseLINK('667.723'),
          token_usdc,
          BigNumber.from('115000')
        )

        await expect(tx)
          .to.emit(orderBookInstance_weth_usdc, 'SwapExactAmount')
          .withArgs(
            router.address,
            router.address,
            true,
            true,
            BigNumber.from('2500000000000000000'),
            BigNumber.from('3475000000')
          )
          .to.emit(orderBookInstance_wbtc_usdc, 'SwapExactAmount')
          .withArgs(
            router.address,
            router.address,
            true,
            false,
            BigNumber.from('13627000'),
            BigNumber.from('3474885000')
          )
          .to.emit(orderBookInstance_wbtc_link, 'SwapExactAmount')
          .withArgs(
            router.address,
            acc2.address,
            true,
            true,
            BigNumber.from('13627000'),
            BigNumber.from('667723000000000000000')
          )
      })

      it('wrap', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_WRAP_MULTI_ON_3_ROUTES_PATH',
          SwapExactInputMultiDirect,
          multiPathExactInputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_link,
          ParseLINK('667.723'),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('fallback', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_MULTI_ON_3_ROUTES_PATH_FALLBACK',
          SwapExactInputMultiViaFallback,
          multiPathExactInputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_link,
          ParseLINK('667.723'),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('wrap-fallback', async () => {
        await swapExactInputMultiSuccess(
          s,
          'SWAP_EXACT_INPUT_WRAP_MULTI_ON_3_ROUTES_PATH_FALLBACK',
          SwapExactInputMultiViaFallback,
          multiPathExactInputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_link,
          ParseLINK('667.723'),
          token_usdc,
          BigNumber.from('115000')
        )
      })
    })

    describe('output', () => {
      it('direct', async () => {
        const tx = await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_ON_3_ROUTES_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_link,
          ParseLINK('667.723'),
          token_usdc,
          BigNumber.from('115000')
        )

        await expect(tx)
          .to.emit(orderBookInstance_weth_usdc, 'SwapExactAmount')
          .withArgs(
            router.address,
            router.address,
            true,
            true,
            BigNumber.from('2500000000000000000'),
            BigNumber.from('3475000000')
          )
          .to.emit(orderBookInstance_wbtc_usdc, 'SwapExactAmount')
          .withArgs(
            router.address,
            router.address,
            true,
            false,
            BigNumber.from('13627000'),
            BigNumber.from('3474885000')
          )
          .to.emit(orderBookInstance_wbtc_link, 'SwapExactAmount')
          .withArgs(
            router.address,
            acc2.address,
            true,
            true,
            BigNumber.from('13627000'),
            BigNumber.from('667723000000000000000')
          )
      })

      it('fallback', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_ON_3_ROUTES_PATH_FALLBACK',
          SwapExactOutputMultiViaFallback,
          multiPathExactOutputRequest,
          false,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_link,
          ParseLINK('667.723'),
          token_usdc,
          BigNumber.from('115000')
        )
      })

      it('wrap-direct', async () => {
        await swapExactOutputMultiSuccess(
          s,
          'SWAP_EXACT_OUTPUT_MULTI_WRAP_ON_3_ROUTES_PATH',
          SwapExactOutputMultiDirect,
          multiPathExactOutputRequest,
          true,
          false,
          token_weth,
          ParseWETH('-2.5'),
          token_link,
          ParseLINK('667.723'),
          token_usdc,
          BigNumber.from('115000')
        )
      })
    })
  })

  describe('SwapExactMulti failure scenarios', async () => {
    let acc2: any, token_weth: BaseContract, token_usdc: BaseContract, token_link: BaseContract, s: any
    let orderBookInstance_weth_usdc: any, orderBookInstance_wbtc_link: any, router: any
    let multiPathExactInputRequest: ISwapMultiRequest.MultiPathExactInputRequestStruct

    beforeEach(async () => {
      s = await getSetupValuesAndCreateOrders()
      ;({acc2, token_weth, token_usdc, token_link, router, orderBookInstance_weth_usdc, orderBookInstance_wbtc_link} =
        s)
    })

    it('Should fail to swap for ExactInputMulti on 3 routes - with NotEnoughLiquidity', async () => {
      multiPathExactInputRequest = {
        swapRequests: [
          {isAsk: true, orderBookId: 0},
          {isAsk: false, orderBookId: 1},
          {isAsk: true, orderBookId: 2},
        ],
        exactInput: ParseWETH(5.6),
        minOutput: ParseLINK('667.723'),
        recipient: acc2.address,
        unwrap: false,
      }

      //wrap is false via direct-swap
      await expect(
        swapExactInputMulti(s, SwapExactInputMultiDirect, multiPathExactInputRequest, false)
      ).to.be.revertedWithCustomError(orderBookInstance_weth_usdc, 'LighterV2Swap_NotEnoughLiquidity')
    })

    it('Should fail to swap for ExactInputMulti on 3 routes - with NotEnoughOutput', async () => {
      let multiPathExactInputRequest = {
        swapRequests: [
          {isAsk: true, orderBookId: 0},
          {isAsk: false, orderBookId: 1},
          {isAsk: true, orderBookId: 2},
        ],
        exactInputToken: token_weth.address,
        exactInput: ParseWETH(2.5),
        minOutputToken: token_link.address,
        minOutput: ParseLINK('668.723'),
        recipient: acc2.address,
        unwrap: false,
      }

      //wrap is false via direct-swap
      await expect(
        swapExactInputMulti(s, SwapExactInputMultiDirect, multiPathExactInputRequest, false)
      ).to.be.revertedWithCustomError(orderBookInstance_wbtc_link, 'LighterV2Swap_NotEnoughOutput')
    })

    it('Should fail to swap for ExactOutputMulti on 3 routes - with TooMuchRequested', async () => {
      let multiPathExactOutputRequest = {
        swapRequests: [
          {isAsk: true, orderBookId: 0},
          {isAsk: false, orderBookId: 1},
          {isAsk: true, orderBookId: 2},
        ],
        maxInput: ParseWETH(2.4),
        exactOutput: ParseLINK('667.723'),
        recipient: acc2.address,
        unwrap: false,
      }

      //wrap is false via direct-swap
      await expect(
        swapExactOutputMulti(s, SwapExactOutputMultiDirect, multiPathExactOutputRequest, false)
      ).to.be.revertedWithCustomError(router, 'LighterV2Router_SwapExactOutputMultiTooMuchRequested')
    })
  })
})
