export const fixed = (options, order) => {
  if (options.freeThreshold && order.subtotal >= options) {
    return 0
  } else {
    return options.price
  }
}