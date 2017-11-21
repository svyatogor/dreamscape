export default async function(order, req, res) {
  order.paymentStatus = 'on-delivery'
  await order.save()
  res.redirect(res.redirect(req.site.eshop.cartPage + '/thankyou'))
}