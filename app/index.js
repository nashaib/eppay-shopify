/**
 * EpPay Shopify App
 *
 * Cryptocurrency payment gateway for Shopify stores
 */

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { restResources } = require('@shopify/shopify-api/rest/admin/2024-01');

const EpPayClient = require('./eppay-client');
const webhookHandlers = require('./webhooks');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: process.env.HOST.replace(/https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  restResources,
});

// Initialize EpPay Client
const eppayClient = new EpPayClient({
  apiKey: process.env.EPPAY_API_KEY,
  baseUrl: process.env.EPPAY_BASE_URL,
  defaultBeneficiary: process.env.EPPAY_BENEFICIARY,
  defaultRpc: process.env.EPPAY_RPC,
  defaultToken: process.env.EPPAY_TOKEN,
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Store for active sessions (in production, use a database)
const sessionStorage = new Map();

/**
 * OAuth - Install & Authorization
 */
app.get('/auth', async (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  const authRoute = await shopify.auth.begin({
    shop: shopify.utils.sanitizeShop(shop, true),
    callbackPath: '/auth/callback',
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });

  res.redirect(authRoute);
});

/**
 * OAuth Callback
 */
app.get('/auth/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;

    // Store session
    sessionStorage.set(session.shop, session);

    // Register webhooks
    await registerWebhooks(session);

    // Redirect to app
    res.redirect(`https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

/**
 * Register Webhooks
 */
async function registerWebhooks(session) {
  try {
    const client = new shopify.clients.Rest({ session });

    // Register order creation webhook
    await client.post({
      path: 'webhooks',
      data: {
        webhook: {
          topic: 'orders/create',
          address: `${process.env.HOST}/webhooks/orders/create`,
          format: 'json',
        },
      },
    });

    console.log('Webhooks registered successfully');
  } catch (error) {
    console.error('Webhook registration error:', error);
  }
}

/**
 * Main App Route
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>EpPay - Crypto Payments for Shopify</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 2.5em; color: #2563eb; font-weight: bold; }
        .feature { background: #f3f4f6; padding: 20px; margin: 10px 0; border-radius: 8px; }
        .install-btn { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none;
                       border-radius: 8px; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🪙 EpPay for Shopify</div>
        <p>Accept cryptocurrency payments in your Shopify store</p>
      </div>

      <div class="feature">
        <h3>✅ Easy Integration</h3>
        <p>Install the app and start accepting crypto payments in minutes</p>
      </div>

      <div class="feature">
        <h3>💰 Multiple Cryptocurrencies</h3>
        <p>Accept USDT, USDC, ETH, BNB, and more across multiple blockchains</p>
      </div>

      <div class="feature">
        <h3>🔒 Secure & Fast</h3>
        <p>Blockchain-secured payments with instant confirmation</p>
      </div>

      <div class="feature">
        <h3>📱 QR Code Payments</h3>
        <p>Customers scan QR codes with EpPay mobile app</p>
      </div>

      <div style="text-align: center;">
        <a href="/install" class="install-btn">Install App</a>
      </div>
    </body>
    </html>
  `);
});

/**
 * Installation Page
 */
app.get('/install', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Install EpPay</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 6px; }
        button { width: 100%; padding: 12px; background: #2563eb; color: white; border: none;
                 border-radius: 6px; cursor: pointer; font-size: 16px; }
        button:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <h2>Install EpPay</h2>
      <form action="/auth" method="GET">
        <input type="text" name="shop" placeholder="your-store.myshopify.com" required />
        <button type="submit">Install</button>
      </form>
    </body>
    </html>
  `);
});

/**
 * Create Payment Endpoint
 */
app.post('/api/payments/create', async (req, res) => {
  try {
    const { amount, orderId, shop } = req.body;

    // Generate EpPay payment
    const payment = await eppayClient.generatePayment({ amount: parseFloat(amount) });

    // Store payment reference with order
    // In production, save to database
    const paymentData = {
      paymentId: payment.paymentId,
      orderId,
      shop,
      amount,
      status: 'pending',
      createdAt: new Date(),
    };

    res.json({
      success: true,
      paymentId: payment.paymentId,
      qrCodeUrl: eppayClient.getQrCodeUrl(payment.paymentId),
      qrCodeData: eppayClient.getQrCodeData(payment.paymentId),
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Check Payment Status
 */
app.get('/api/payments/:paymentId/status', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const status = await eppayClient.verifyPayment(paymentId);

    res.json({
      success: true,
      paymentId,
      isPaid: status.status === true,
      status: status.status ? 'completed' : 'pending',
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Payment Page (for customers)
 */
app.get('/payment/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const qrCodeUrl = eppayClient.getQrCodeUrl(paymentId);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pay with EpPay</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f3f4f6; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; }
        .qr-code { margin: 30px 0; }
        .qr-code img { max-width: 300px; border: 4px solid #e5e7eb; border-radius: 8px; }
        .status { padding: 15px; border-radius: 8px; margin-top: 20px; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.completed { background: #d1fae5; color: #065f46; }
        .instructions { text-align: left; background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🪙 Pay with Crypto</h1>
        <p>Scan the QR code with your EpPay mobile app</p>

        <div class="qr-code">
          <img src="${qrCodeUrl}" alt="Payment QR Code" />
        </div>

        <div id="status" class="status pending">
          ⏳ Waiting for payment...
        </div>

        <div class="instructions">
          <strong>How to pay:</strong>
          <ol>
            <li>Open EpPay mobile app</li>
            <li>Scan this QR code</li>
            <li>Confirm payment</li>
            <li>Wait for confirmation</li>
          </ol>
        </div>
      </div>

      <script>
        const paymentId = '${paymentId}';

        function checkPaymentStatus() {
          fetch('/api/payments/' + paymentId + '/status')
            .then(res => res.json())
            .then(data => {
              if (data.isPaid) {
                document.getElementById('status').className = 'status completed';
                document.getElementById('status').innerHTML = '✅ Payment Completed!';
                setTimeout(() => {
                  window.close();
                }, 2000);
              }
            })
            .catch(console.error);
        }

        // Check status every 3 seconds
        setInterval(checkPaymentStatus, 3000);
      </script>
    </body>
    </html>
  `);
});

/**
 * Webhooks
 */
app.post('/webhooks/orders/create', async (req, res) => {
  try {
    await webhookHandlers.handleOrderCreate(req.body, shopify, eppayClient);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'eppay-shopify' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ EpPay Shopify App running on port ${PORT}`);
  console.log(`🔗 Install URL: http://localhost:${PORT}/install`);
});
