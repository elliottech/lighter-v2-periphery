import {PromiseOrValue} from 'typechain-types/common'
import {BigNumber, BigNumberish} from 'ethers'

export const fixedSize = (s: string, len: number) => {
  if (s.length > len) throw new Error(`given size (${s.length}) is too big to fit in ${len}`)
  return s.padStart(len, '0')
}

/// AddressToCallData returns a hex-encoded address, without the `0x` prefix
export function AddressToCallData(address: PromiseOrValue<string>): string {
  return fixedSize(address.toString().replace('0x', ''), 40)
}

/// NumberToCallData returns a hex-encoded number, without the `0x` prefix, with desired number of bytes
export function NumberToCallData(amount: PromiseOrValue<BigNumberish>, numBytes: number): string {
  return fixedSize(BigNumber.from(amount).toHexString().replace('0x', ''), numBytes * 2)
}

/// AddressToCallData returns a hex-encoded bool, without the `0x` prefix
export function BoolToCallData(b: PromiseOrValue<boolean>): string {
  if (typeof b === 'boolean') {
    if (b) {
      return '01'
    } else {
      return '00'
    }
  } else {
    throw `unknown type ${typeof b} for BoolFallbackConversion`
  }
}
