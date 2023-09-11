import {BigNumber} from 'ethers'
import {expect} from 'chai'
import {MantissaFormattedNumber} from './mantissa'
import {ethers} from 'hardhat'

const getBytesStringForMantissaRepresentation = (amount: MantissaFormattedNumber) => {
  return `0x${amount.getHexString()}`
}
describe('Mantissa representation', async () => {
  it('gets exponent and mantissa correctly 1', async function () {
    let number = MantissaFormattedNumber.from('1000000000000002450', 2)
    expect(number.exponent).to.equal(2)
    expect(number.mantissa).to.equal(BigNumber.from('10000000000000024'))
  })

  it('gets exponent and mantissa correctly 2', async function () {
    let number = MantissaFormattedNumber.from('123456789123456789123456789123456789123456789', 2)
    expect(number.exponent).to.equal(28)
    expect(number.mantissa).to.equal(BigNumber.from('12345678912345678'))
  })

  it('gets exponent and mantissa correctly 3', async function () {
    let number = MantissaFormattedNumber.from('123456789', 2)
    expect(number.exponent).to.equal(0)
    expect(number.mantissa).to.equal(BigNumber.from('123456789'))
  })

  it('gets hex string correctly', async function () {
    let number = MantissaFormattedNumber.from('10', 2)
    expect(number.getHexString()).to.equal('01000001')
  })

  it('encodes and decodes mantissa formats of type 2 correctly', async function () {
    const TestMantissa = await ethers.getContractFactory('TestMantissa')
    const testMantissa = await TestMantissa.deploy()
    await testMantissa.deployed()

    const amount = MantissaFormattedNumber.from(662783234412345, 2)
    const data = getBytesStringForMantissaRepresentation(amount)

    const [signer] = await ethers.getSigners()
    const tx = await signer.sendTransaction({to: testMantissa.address, data: data})

    await expect(tx).to.emit(testMantissa, 'ParsedData').withArgs(662783234412345, 8)
  })

  it('encodes and decodes mantissa formats of type 1 correctly', async function () {
    const TestMantissa = await ethers.getContractFactory('TestMantissa')
    const testMantissa = await TestMantissa.deploy()
    await testMantissa.deployed()

    const amount = MantissaFormattedNumber.from(6627832344, 1)
    const data = getBytesStringForMantissaRepresentation(amount)

    const [signer] = await ethers.getSigners()
    const tx = await signer.sendTransaction({to: testMantissa.address, data: data})

    await expect(tx).to.emit(testMantissa, 'ParsedData').withArgs(6627832344, 6)
  })

  it('encodes and decodes mantissa formats of type 0 correctly', async function () {
    const TestMantissa = await ethers.getContractFactory('TestMantissa')
    const testMantissa = await TestMantissa.deploy()
    await testMantissa.deployed()

    const amount = MantissaFormattedNumber.from(10, 0)
    const data = getBytesStringForMantissaRepresentation(amount)

    const [signer] = await ethers.getSigners()
    const tx = await signer.sendTransaction({to: testMantissa.address, data: data})

    await expect(tx).to.emit(testMantissa, 'ParsedData').withArgs(10, 4)
  })

  it('computes gas cost correctly', async function () {
    // get the gas cost when calling the function
    const TestMantissa = await ethers.getContractFactory('TestMantissa')
    const testMantissa = await TestMantissa.deploy()
    await testMantissa.deployed()

    const amount = MantissaFormattedNumber.from(10, 0)
    const data = getBytesStringForMantissaRepresentation(amount)

    const [signer] = await ethers.getSigners()

    const bytesParsed = (
      await (
        await signer.sendTransaction({
          to: testMantissa.address,
          data: data,
        })
      ).wait()
    ).gasUsed

    // get the gas cost for the empty contract
    const empty = await (await ethers.getContractFactory('TestMantissaNoLogic')).deploy()
    const bytesParsedEmpty = (
      await (
        await signer.sendTransaction({
          to: empty.address,
          data: data,
        })
      ).wait()
    ).gasUsed

    // all the expected values are with optimized enabled with 0 runs, so changing the `runs` parameter does not break tests
    const expectedGas = 853

    expect(bytesParsed.sub(bytesParsedEmpty)).to.lessThanOrEqual(expectedGas)
  })
})
