/**
 * Webhook Handlers for Shopify
 *
 * Handles Shopify webhook events
 */

/**
 * Handle order creation
 */
async function handleOrderCreate(orderData, shopify, eppayClient) {
  console.log('Order created:', orderData.id);

  // Check if order has EpPay as payment method
  // This is where you'd implement custom payment gateway logic

  // For now, just log the order
  console.log('Order details:', {
    id: orderData.id,
    total: orderData.total_price,
    currency: orderData.currency,
    customer: orderData.customer?.email,
  });

  // You can add logic here to:
  // 1. Check if customer selected EpPay payment
  // 2. Generate payment automatically
  // 3. Send payment link to customer
  // 4. Update order with payment status
}

/**
 * Handle order update
 */
async function handleOrderUpdate(orderData, shopify, eppayClient) {
  console.log('Order updated:', orderData.id);

  // Check payment status and update order accordingly
}

/**
 * Handle order paid
 */
async function handleOrderPaid(orderData, shopify, eppayClient) {
  console.log('Order paid:', orderData.id);

  // Fulfill order if paid via EpPay
}

module.exports = {
  handleOrderCreate,
  handleOrderUpdate,
  handleOrderPaid,
};
