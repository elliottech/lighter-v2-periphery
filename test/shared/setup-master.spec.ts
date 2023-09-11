import {expectOrderBook} from './order-book'
import {getSetupValuesAndCreateOrders} from './setup-master'

it('setup-master sets up orders correctly', async () => {
  const {orderBookInstance_weth_usdc} = await getSetupValuesAndCreateOrders()
  await expectOrderBook(orderBookInstance_weth_usdc, [3, 6, 2, 0], [4, 7, 5, 0])
})
