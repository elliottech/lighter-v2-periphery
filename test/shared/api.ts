import {BigNumber, BigNumberish, ContractTransaction} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {AddressToCallData, NumberToCallData} from './calldata'
import {SizePaddedNumber} from './size-padded-number'
import {MantissaFormattedNumber} from './mantissa'
import {IOrderBook, Router} from 'typechain-types'
import {ISwapMultiRequest} from 'typechain-types/contracts/Router'

export function getLimitOrderFallbackData(
  orderBookId: number,
  orders: {
    amount0Base: BigNumber
    priceBase: BigNumber
    isAsk: boolean
    hintId: number
  }[]
) {
  let data = '0x'
  data += NumberToCallData(1, 1)
  data += NumberToCallData(orderBookId, 1)

  // batch all isAsk bits in one big number
  let isAsk = BigNumber.from(0)
  for (let i = 0; i < orders.length; i += 1) {
    if (orders[i].isAsk) {
      isAsk = isAsk.add(BigNumber.from(2).pow(i))
    }
  }
  data += new SizePaddedNumber(isAsk).getHexString()

  for (const order of orders) {
    data += new SizePaddedNumber(order.amount0Base).getHexString()
    data += new SizePaddedNumber(order.priceBase).getHexString()
    data += new SizePaddedNumber(order.hintId).getHexString()
  }

  return data
}

export async function CreateLimitOrderViaFallback(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  orders: {
    amount0: BigNumber
    price: BigNumber
    isAsk: boolean
    hintId: number
  }[]
) {
  const orderBookId = await orderBook.orderBookId()
  const sizeTick = await orderBook.sizeTick()
  const priceTick = await orderBook.priceTick()

  let baseOrders = []
  for (const order of orders) {
    baseOrders.push({
      amount0Base: order.amount0.div(sizeTick),
      priceBase: order.price.div(priceTick),
      isAsk: order.isAsk,
      hintId: order.hintId,
    })
  }

  const data = getLimitOrderFallbackData(orderBookId, baseOrders)
  return sender.sendTransaction({
    to: router.address,
    data: data,
  })
}

export async function CreateLimitOrderDirect(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  orders: {
    amount0: BigNumber
    price: BigNumber
    isAsk: boolean
    hintId: number
  }[]
) {
  const orderBookId = await orderBook.orderBookId()
  const sizeTick = await orderBook.sizeTick()
  const priceTick = await orderBook.priceTick()

  let amount0Base = []
  let priceBase = []
  let isAsk = []
  let hintId = []
  for (const order of orders) {
    amount0Base.push(order.amount0.div(sizeTick))
    priceBase.push(order.price.div(priceTick))
    isAsk.push(order.isAsk)
    hintId.push(order.hintId)
  }

  return router.connect(sender).createLimitOrderBatch(orderBookId, orders.length, amount0Base, priceBase, isAsk, hintId)
}

export function getUpdateLimitOrderFallbackData(
  orderBookId: number,
  orders: {
    orderId: number
    newAmount0Base: BigNumber
    newPriceBase: BigNumber
    hintId: number
  }[]
) {
  let data = '0x'
  data += NumberToCallData(2, 1)
  data += NumberToCallData(orderBookId, 1)

  for (const order of orders) {
    data += new SizePaddedNumber(order.orderId).getHexString()
    data += new SizePaddedNumber(order.newAmount0Base).getHexString()
    data += new SizePaddedNumber(order.newPriceBase).getHexString()
    data += new SizePaddedNumber(order.hintId).getHexString()
  }

  return data
}

export async function UpdateLimitOrderViaFallback(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  orders: {
    orderId: number
    newAmount0: BigNumber
    newPrice: BigNumber
    hintId: number
  }[]
) {
  const orderBookId = await orderBook.orderBookId()
  const sizeTick = await orderBook.sizeTick()
  const priceTick = await orderBook.priceTick()

  let baseOrders = []
  for (const order of orders) {
    baseOrders.push({
      orderId: order.orderId,
      newAmount0Base: order.newAmount0.div(sizeTick),
      newPriceBase: order.newPrice.div(priceTick),
      hintId: order.hintId,
    })
  }

  const data = getUpdateLimitOrderFallbackData(orderBookId, baseOrders)
  return sender.sendTransaction({
    to: router.address,
    data: data,
  })
}

export async function UpdateLimitOrderDirect(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  orders: {
    orderId: number
    newAmount0: BigNumber
    newPrice: BigNumber
    hintId: number
  }[]
) {
  const orderBookId = await orderBook.orderBookId()
  const sizeTick = await orderBook.sizeTick()
  const priceTick = await orderBook.priceTick()

  let orderId = []
  let newAmount0Base = []
  let newPriceBase = []
  let hintId = []
  for (const order of orders) {
    orderId.push(order.orderId)
    newAmount0Base.push(order.newAmount0.div(sizeTick))
    newPriceBase.push(order.newPrice.div(priceTick))
    hintId.push(order.hintId)
  }

  return router
    .connect(sender)
    .updateLimitOrderBatch(orderBookId, orders.length, orderId, newAmount0Base, newPriceBase, hintId)
}

export function getCancelLimitOrderFallbackData(orderBookId: number, orderIDs: [BigNumberish]) {
  let data = '0x'
  data += NumberToCallData(3, 1)
  data += NumberToCallData(orderBookId, 1)

  for (let orderID of orderIDs) {
    data += new SizePaddedNumber(orderID).getHexString()
  }

  return data
}

export async function CancelLimitOrderViaFallback(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  orderIDs: [BigNumberish]
) {
  const orderBookId = await orderBook.orderBookId()
  const data = getCancelLimitOrderFallbackData(orderBookId, orderIDs)
  return sender.sendTransaction({
    to: router.address,
    data: data,
  })
}

export async function CancelLimitOrderDirect(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  orderIDs: [BigNumberish]
) {
  const orderBookId = await orderBook.orderBookId()
  return router.connect(sender).cancelLimitOrderBatch(orderBookId, orderIDs.length, orderIDs)
}

export function getIOCOrderFallbackData(
  orderBookId: number,
  order: {
    amount0Base: BigNumber
    priceBase: BigNumber
    isAsk: boolean
  }
) {
  let data = '0x'
  data += NumberToCallData(4 + Number(order.isAsk), 1)
  data += NumberToCallData(orderBookId, 1)
  data += new SizePaddedNumber(order.amount0Base).getHexString()
  data += new SizePaddedNumber(order.priceBase).getHexString()
  return data
}

export async function CreateIOCOrderDirect(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  order: {
    amount0: BigNumber
    price: BigNumber
    isAsk: boolean
  }
) {
  const orderBookId = await orderBook.orderBookId()
  const sizeTick = await orderBook.sizeTick()
  const priceTick = await orderBook.priceTick()

  const amount0Base = order.amount0.div(sizeTick)
  const priceBase = order.price.div(priceTick)

  return router.connect(sender).createIoCOrder(orderBookId, amount0Base, priceBase, order.isAsk)
}

export async function CreateIOCOrderViaFallback(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  order: {
    amount0: BigNumber
    price: BigNumber
    isAsk: boolean
  }
) {
  const orderBookId = await orderBook.orderBookId()
  const sizeTick = await orderBook.sizeTick()
  const priceTick = await orderBook.priceTick()

  const amount0Base = order.amount0.div(sizeTick)
  const priceBase = order.price.div(priceTick)

  const data = getIOCOrderFallbackData(orderBookId, {amount0Base, priceBase, isAsk: order.isAsk})
  return sender.sendTransaction({
    to: router.address,
    data: data,
  })
}

export function getFOKOrderFallbackData(
  orderBookId: number,
  order: {
    amount0Base: BigNumber
    priceBase: BigNumber
    isAsk: boolean
  }
) {
  let data = '0x'
  data += NumberToCallData(6 + Number(order.isAsk), 1)
  data += NumberToCallData(orderBookId, 1)
  data += new SizePaddedNumber(order.amount0Base).getHexString()
  data += new SizePaddedNumber(order.priceBase).getHexString()
  return data
}

export async function CreateFOKOrderDirect(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  order: {
    amount0: BigNumber
    price: BigNumber
    isAsk: boolean
  }
) {
  const orderBookId = await orderBook.orderBookId()
  const sizeTick = await orderBook.sizeTick()
  const priceTick = await orderBook.priceTick()

  const amount0Base = order.amount0.div(sizeTick)
  const priceBase = order.price.div(priceTick)

  return router.connect(sender).createFoKOrder(orderBookId, amount0Base, priceBase, order.isAsk)
}

export async function CreateFOKOrderViaFallback(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  order: {
    amount0: BigNumber
    price: BigNumber
    isAsk: boolean
  }
) {
  const orderBookId = await orderBook.orderBookId()
  const sizeTick = await orderBook.sizeTick()
  const priceTick = await orderBook.priceTick()

  const amount0Base = order.amount0.div(sizeTick)
  const priceBase = order.price.div(priceTick)

  const data = getFOKOrderFallbackData(orderBookId, {amount0Base, priceBase, isAsk: order.isAsk})
  return sender.sendTransaction({
    to: router.address,
    data: data,
  })
}

export async function getSwapExactInputMultiFallbackData(
  request: ISwapMultiRequest.MultiPathExactInputRequestStruct,
  sender: string
): Promise<string> {
  const MultiPathExactInputFallbackStart = 16

  let data = '0x'
  const unwrap = await request.unwrap
  const recipientIsMsgSender = request.recipient == sender
  data += BigNumber.from(MultiPathExactInputFallbackStart + Number(unwrap) + 2 * Number(recipientIsMsgSender))
    .toHexString()
    .replace('0x', '')
  data += MantissaFormattedNumber.from(await request.exactInput, 2).getHexString()
  data += MantissaFormattedNumber.from(await request.minOutput, 2).getHexString()
  if (!recipientIsMsgSender) {
    data += AddressToCallData(request.recipient)
  }
  for (let swap of request.swapRequests) {
    if (swap.orderBookId > 127) {
      throw `orderBookId too big for compressed form ${swap.orderBookId}`
    }
    const isAsk = swap.isAsk
    const orderBookId = swap.orderBookId
    const compressed = BigNumber.from(orderBookId).toNumber() + (isAsk ? 128 : 0)
    data += NumberToCallData(compressed, 1)
  }
  return data
}

export type PerformSwapExactInputMultiFunction = (
  sender: SignerWithAddress,
  router: Router,
  request: ISwapMultiRequest.MultiPathExactInputRequestStruct,
  value?: BigNumber
) => Promise<ContractTransaction>

export function SwapExactInputMultiDirect(
  sender: SignerWithAddress,
  router: Router,
  request: ISwapMultiRequest.MultiPathExactInputRequestStruct,
  value?: BigNumber
) {
  return router.connect(sender).swapExactInputMulti(request, {value: value})
}

export function SwapExactInputMultiViaFallback(
  sender: SignerWithAddress,
  router: Router,
  request: ISwapMultiRequest.MultiPathExactInputRequestStruct,
  value?: BigNumber
) {
  const data = getSwapExactInputMultiFallbackData(request, sender.address)
  return sender.sendTransaction({
    to: router.address,
    data: data,
    value: value,
  })
}

export async function getSwapExactOutputMultiFallbackData(
  request: ISwapMultiRequest.MultiPathExactOutputRequestStruct,
  sender: string
): Promise<string> {
  const MultiPathExactOutputFallbackStart = 20

  let data = '0x'
  const unwrap = await request.unwrap
  const recipientIsMsgSender = request.recipient == sender
  data += BigNumber.from(MultiPathExactOutputFallbackStart + Number(unwrap) + 2 * Number(recipientIsMsgSender))
    .toHexString()
    .replace('0x', '')
  data += MantissaFormattedNumber.from(await request.exactOutput, 2).getHexString()
  data += MantissaFormattedNumber.from(await request.maxInput, 2).getHexString()
  if (!recipientIsMsgSender) {
    data += AddressToCallData(request.recipient)
  }
  for (let swap of request.swapRequests) {
    if (swap.orderBookId > 127) {
      throw `orderBookId too big for compressed form ${swap.orderBookId}`
    }
    const isAsk = await swap.isAsk
    const orderBookId = await swap.orderBookId
    const compressed = BigNumber.from(orderBookId).toNumber() + (isAsk ? 128 : 0)
    data += NumberToCallData(compressed, 1)
  }
  return data
}

export type PerformSwapExactOutputMultiFunction = (
  sender: SignerWithAddress,
  router: Router,
  request: ISwapMultiRequest.MultiPathExactOutputRequestStruct,
  value?: BigNumber
) => Promise<ContractTransaction>

export function SwapExactOutputMultiDirect(
  sender: SignerWithAddress,
  router: Router,
  request: ISwapMultiRequest.MultiPathExactOutputRequestStruct,
  value?: BigNumber
) {
  return router.connect(sender).swapExactOutputMulti(request, {value: value})
}

export function SwapExactOutputMultiViaFallback(
  sender: SignerWithAddress,
  router: Router,
  request: ISwapMultiRequest.MultiPathExactOutputRequestStruct,
  value?: BigNumber
) {
  const data = getSwapExactOutputMultiFallbackData(request, sender.address)
  return sender.sendTransaction({
    to: router.address,
    data: data,
    value: value,
  })
}

function getSwapExactInputSingleFallbackData(
  orderBookId: number,
  isAsk: boolean,
  exactInput: BigNumberish,
  minOutput: BigNumberish,
  recipient: string,
  unwrap: boolean,
  sender: string
) {
  const ExactInputSingleFallbackStart = 8

  let data = '0x'
  const recipientIsMsgSender = recipient == sender
  data += BigNumber.from(ExactInputSingleFallbackStart + Number(unwrap) + 2 * Number(recipientIsMsgSender))
    .toHexString()
    .replace('0x', '')

  // orderBookId & isAsk
  if (orderBookId > 127) {
    throw `orderBookId too big for compressed form ${orderBookId}`
  }
  const compressed = BigNumber.from(orderBookId).toNumber() + (isAsk ? 128 : 0)
  data += NumberToCallData(compressed, 1)

  data += MantissaFormattedNumber.from(exactInput, 2).getHexString()
  data += MantissaFormattedNumber.from(minOutput, 2).getHexString()
  if (!recipientIsMsgSender) {
    data += AddressToCallData(recipient)
  }
  return data
}

export async function SwapExactInputSingleDirect(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  isAsk: boolean,
  exactInput: BigNumberish,
  minOutput: BigNumberish,
  wrap: boolean = false,
  unwrap: boolean = false
) {
  const value = wrap ? exactInput : BigNumber.from(0)
  return await router
    .connect(sender)
    .swapExactInputSingle(await orderBook.orderBookId(), isAsk, exactInput, minOutput, sender.address, unwrap, {
      value: value,
    })
}

export async function SwapExactInputSingleViaFallback(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  isAsk: boolean,
  exactInput: BigNumberish,
  minOutput: BigNumberish,
  wrap: boolean = false,
  unwrap: boolean = false
) {
  const data = getSwapExactInputSingleFallbackData(
    await orderBook.orderBookId(),
    isAsk,
    exactInput,
    minOutput,
    sender.address,
    unwrap,
    sender.address
  )
  const value = wrap ? exactInput : BigNumber.from(0)

  return sender.sendTransaction({
    to: router.address,
    data,
    value: value,
  })
}

function getSwapExactOutputSingleCallbackData(
  orderBookId: number,
  isAsk: boolean,
  exactOutput: BigNumberish,
  maxInput: BigNumberish,
  recipient: string,
  unwrap: boolean,
  sender: string
) {
  const ExactOutputSingleFallbackStart = 12

  let data = '0x'
  const recipientIsMsgSender = recipient == sender
  data += BigNumber.from(ExactOutputSingleFallbackStart + Number(unwrap) + 2 * Number(recipientIsMsgSender))
    .toHexString()
    .replace('0x', '')

  // orderBookId & isAsk
  if (orderBookId > 127) {
    throw `orderBookId too big for compressed form ${orderBookId}`
  }
  const compressed = BigNumber.from(orderBookId).toNumber() + (isAsk ? 128 : 0)
  data += NumberToCallData(compressed, 1)

  data += MantissaFormattedNumber.from(exactOutput, 2).getHexString()
  data += MantissaFormattedNumber.from(maxInput, 2).getHexString()
  if (!recipientIsMsgSender) {
    data += AddressToCallData(recipient)
  }
  return data
}

export async function SwapExactOutputSingleViaFallback(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  isAsk: boolean,
  exactOutput: BigNumberish,
  maxInput: BigNumberish,
  wrap: boolean = false,
  unwrap: boolean = false
) {
  const data = getSwapExactOutputSingleCallbackData(
    await orderBook.orderBookId(),
    isAsk,
    exactOutput,
    maxInput,
    sender.address,
    unwrap,
    sender.address
  )
  const value = wrap ? maxInput : BigNumber.from(0)
  return sender.sendTransaction({
    to: router.address,
    data,
    value: value,
  })
}

export async function SwapExactOutputSingleDirect(
  sender: SignerWithAddress,
  router: Router,
  orderBook: IOrderBook,
  isAsk: boolean,
  exactOutput: BigNumberish,
  maxInput: BigNumberish,
  wrap: boolean = false,
  unwrap: boolean = false
) {
  const value = wrap ? maxInput : BigNumber.from(0)
  return await router
    .connect(sender)
    .swapExactOutputSingle(await orderBook.orderBookId(), isAsk, exactOutput, maxInput, sender.address, unwrap, {
      value: value,
    })
}
