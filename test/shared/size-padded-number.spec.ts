import {SizePaddedNumber} from './size-padded-number'
import {expect} from './expect'
import {ethers} from 'hardhat'
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers'
import {BigNumber, BigNumberish} from 'ethers'
import {reportGasCost} from 'reports'

describe('SizePaddedNumber', () => {
  describe('JS', () => {
    it('encodes 0', () => {
      expect(new SizePaddedNumber(0).getHexString()).to.equal('00')
    })
    it('encodes number on 1 byte', () => {
      expect(new SizePaddedNumber(30).getHexString()).to.equal('1e')
    })
    it('encodes number on 2 bytes, while using only the last one', () => {
      expect(new SizePaddedNumber(90).getHexString()).to.equal('205a')
    })
    it('encodes number on 2 bytes, using both bytes', () => {
      expect(new SizePaddedNumber(300).getHexString()).to.equal('212c')
    })
    it('encodes big numbers', () => {
      // 0b1101011001010111100
      const hex = new SizePaddedNumber(438972).getHexString()
      const binary = parseInt(hex, 16).toString(2).padStart(24, '0')
      // 010'00110'10110010'10111100
      expect(binary).to.equal('010001101011001010111100')
    })
  })

  describe('decoding in solidity', () => {
    async function setupFixture() {
      return await (await ethers.getContractFactory('TestSizePaddedNumber')).deploy()
    }

    async function encodeAndDecode(value: BigNumberish) {
      const data = new SizePaddedNumber(value).getHexString()
      const expectedNumBytes = data.length / 2 // hex to bytes

      const contract = await loadFixture(setupFixture)
      const [signer] = await ethers.getSigners()
      const tx = await signer.sendTransaction({
        to: contract.address,
        data: '0x' + data,
      })
      await expect(tx).to.emit(contract, 'ParsedNumber').withArgs(BigNumber.from(value), expectedNumBytes)
      return tx
    }

    it('encodes 0', async () => {
      const tx = await encodeAndDecode(0)
      await reportGasCost('DECODE_SIZE_PADDED_NUMBER_1_BYTE', tx)
    })
    it('encodes number on 1 byte', async () => {
      await encodeAndDecode(30)
    })
    it('encodes 32', async () => {
      await encodeAndDecode(32)
      await encodeAndDecode(31)
    })
    it('encodes 8192', async () => {
      await encodeAndDecode(8192)
      await encodeAndDecode(8191)
    })
    it('encodes number on 2 bytes, while using only the last one', async () => {
      await encodeAndDecode(90)
    })
    it('encodes number on 2 bytes, using both bytes', async () => {
      const tx = await encodeAndDecode(300)
      await reportGasCost('DECODE_SIZE_PADDED_NUMBER_2_BYTE', tx)
    })
    it('encodes number on 3 bytes', async () => {
      const tx = await encodeAndDecode(438972)
      await reportGasCost('DECODE_SIZE_PADDED_NUMBER_3_BYTE', tx)
    })
    it('encodes big numbers', async () => {
      const numbers = ['438972', '123456789', '123456789123456789']
      for (const number of numbers) {
        await encodeAndDecode(number)
      }
    })
    it('handles bad encodings', async () => {
      const contract = await loadFixture(setupFixture)
      const [signer] = await ethers.getSigners()
      const tx = signer.sendTransaction({
        to: contract.address,
        data: '0xff',
      })
      await expect(tx).to.be.revertedWith('trying to read past end of calldata')
    })

    it('computes gas costs correctly', async () => {
      const [signer] = await ethers.getSigners()
      const contract = await loadFixture(setupFixture)
      const empty = await (await ethers.getContractFactory('TestSizePaddedNumberNoLogic')).deploy()

      const bytesParsed1 = (
        await (
          await signer.sendTransaction({
            to: contract.address,
            data: '0x1e',
          })
        ).wait()
      ).gasUsed
      const bytesParsed2 = (
        await (
          await signer.sendTransaction({
            to: contract.address,
            data: '0x212c',
          })
        ).wait()
      ).gasUsed
      const oneByteEmpty = (await (await signer.sendTransaction({to: empty.address, data: '0x1e'})).wait()).gasUsed
      const perByte = bytesParsed2.sub(bytesParsed1).toNumber()
      const start = bytesParsed1.sub(oneByteEmpty).sub(perByte).toNumber()

      // all the expected values are with optimized enabled with 0 runs, so changing the `runs` parameter does not break tests
      const expectedStart = 276
      const expectedPerByte = 16

      if (expectedStart != start || expectedPerByte != perByte) {
        console.log(
          `UTFNumberDecode expected\t1byte:${expectedPerByte + expectedStart}\t2byte:${
            expectedPerByte * 2 + expectedStart
          }\t3byte:${expectedPerByte * 3 + expectedStart}\t4byte:${expectedPerByte * 4 + expectedStart}`
        )
        console.log(
          `UTFNumberDecode actual  \t1byte:${perByte + start}\t2byte:${perByte * 2 + start}\t3byte:${
            perByte * 3 + start
          }\t4byte:${perByte * 4 + start}`
        )
      }
      expect(start).to.lessThanOrEqual(expectedStart)
      expect(perByte).to.lessThanOrEqual(expectedPerByte)
    })
  })
})
