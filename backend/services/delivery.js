export const fixed = (options, order) => {
  if (options.freeThreshold && order.subtotal + order.taxTotal >= options.freeThreshold) {
    return 0
  } else {
    return options.price
  }
}