import {BigNumber, BigNumberish} from 'ethers'
import {NumberToCallData} from './calldata'

export class SizePaddedNumber {
  value: BigNumber

  constructor(value: BigNumberish) {
    this.value = BigNumber.from(value)
  }

  getHexString(): string {
    if (this.value.eq(0)) {
      return '00'
    }

    let chunks = []
    let copy = BigNumber.from(this.value)
    while (copy.gte(1 << 5)) {
      chunks.push(copy.mod(256).toNumber())
      copy = copy.div(256)
    }

    if (chunks.length > 7) {
      throw `number too big value=${this.value.toString()} extraBytes=${chunks.length}`
    }

    let final = BigNumber.from(this.value)
    const extraBytes = chunks.length
    const prefixAdded = extraBytes * (1 << 5)

    final = final.add(BigNumber.from(256).pow(extraBytes).mul(prefixAdded))

    return NumberToCallData(final, extraBytes + 1)
  }
}
