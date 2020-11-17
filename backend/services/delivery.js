import {sum, map} from 'lodash'

export const fixed = (options, order) => {
  if (options.freeThreshold && order.subtotal + order.taxTotal >= options.freeThreshold) {
    return 0
  } else {
    return options.price
  }
}

export function byKgs(options, order) {
  if (options.freeThreshold && order.subtotal + order.taxTotal >= options.freeThreshold) {
    return 0
  } else {
    const {maxWeight = 99999, price, overweightSurcharge = 0} = options
    const orderWeight = sum(map(order.items, 'weight')) || 0
    return Math.min(maxWeight, orderWeight) * price + Math.max(0, maxWeight - orderWeight) * overweightSurcharge
  }
}