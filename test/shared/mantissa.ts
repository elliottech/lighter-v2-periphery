import {BigNumber, BigNumberish} from 'ethers'
import {fixedSize, NumberToCallData} from './calldata'

export class MantissaFormattedNumber {
  type: number
  exponent: number
  mantissa: BigNumber

  private constructor(exponent: number, mantissa: BigNumber, type: number) {
    this.type = type
    this.exponent = exponent
    this.mantissa = mantissa
  }

  static from(_value: BigNumberish, _type: number): MantissaFormattedNumber {
    const value = BigNumber.from(_value)
    let PRECISION = BigNumber.from('2').pow(8 * (2 * _type + 3))
    let MAX_EXPONENT = 60

    if (value == BigNumber.from(0)) return new MantissaFormattedNumber(0, BigNumber.from(0), 0)

    let exponent = 0
    let mantissa = value

    while (mantissa.gte(PRECISION)) {
      mantissa = mantissa.div(10)
      exponent++
    }

    if (exponent > MAX_EXPONENT) {
      throw 'exponent too big'
    }

    // make the mantissa smaller if the precision is the same
    while (mantissa.mod(10).eq(0) && exponent < MAX_EXPONENT) {
      mantissa = mantissa.div(10)
      exponent++
    }

    // Represent the mantissa with the smallest possible type
    let type = _type
    if (type > 1 && mantissa.lt(BigNumber.from('2').pow(40))) type = 1
    if (type > 0 && mantissa.lt(BigNumber.from('2').pow(24))) type = 0

    return new MantissaFormattedNumber(exponent, mantissa, type)
  }

  getHexString(): string {
    let hexString = NumberToCallData(this.type * 64 + this.exponent, 1)
    hexString += fixedSize(getHexString(this.mantissa), 2 * (2 * this.type + 3))

    return hexString
  }

  toString(): string {
    return this.type.toString() + ' ' + this.exponent.toString() + ' ' + this.mantissa.toString()
  }
}

// Get the hex string representation of a BigNumber
export function getHexString(value: BigNumber): string {
  const valueToString = value.toHexString()
  return valueToString.replace('0x', '')
}
