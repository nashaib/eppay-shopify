# EpPay for Shopify

Accept cryptocurrency payments in your Shopify store with EpPay. Enable customers to pay with USDT, USDC, ETH, BNB, and more across multiple blockchain networks.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **Easy Installation** - Install and configure in minutes
✅ **Multiple Cryptocurrencies** - Accept USDT, USDC, ETH, BNB, and more
✅ **Multi-Chain Support** - Ethereum, BSC, Polygon, and other networks
✅ **QR Code Payments** - Customers scan QR codes with EpPay mobile app
✅ **Real-time Verification** - Instant payment confirmation
✅ **Secure** - Blockchain-secured transactions
✅ **No Transaction Fees** - Keep 100% of your earnings

## Prerequisites

Before installing the EpPay Shopify app, you need:

1. **Shopify Store** - A Shopify store (any plan)
2. **EpPay Account** - Sign up at [eppay.io](https://eppay.io/register)
3. **API Key** - Generate API key from EpPay dashboard
4. **Server** - Node.js server to host the app (or use deployment platform)

## Installation

### Option 1: Install from Shopify App Store (Recommended)

Coming soon! The app will be available in the Shopify App Store.

### Option 2: Self-Hosted Installation

#### Step 1: Clone and Install

```bash
git clone https://github.com/nashaib/eppay-shopify.git
cd eppay-shopify
npm install
```

#### Step 2: Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Shopify App Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SCOPES=write_orders,read_orders
HOST=https://your-app-url.com
PORT=3000

# EpPay Configuration
EPPAY_API_KEY=your_eppay_api_key
EPPAY_BASE_URL=https://eppay.io
EPPAY_BENEFICIARY=0x_your_wallet_address
EPPAY_RPC=https://rpc.scimatic.net
EPPAY_TOKEN=0x_token_contract_address
```

#### Step 3: Create Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app
3. Select "Public app" or "Custom app"
4. Configure app URLs:
   - **App URL**: `https://your-domain.com`
   - **Allowed redirection URL(s)**: `https://your-domain.com/auth/callback`
5. Copy API key and secret to your `.env` file

#### Step 4: Deploy the App

Deploy to your server or use a platform like:

- **Heroku**: `git push heroku main`
- **Vercel**: `vercel deploy`
- **DigitalOcean**: Deploy as Node.js app
- **AWS**: Use Elastic Beanstalk or EC2

#### Step 5: Install in Your Store

1. Visit: `https://your-app-url.com/install`
2. Enter your store domain: `your-store.myshopify.com`
3. Click "Install"
4. Authorize the app

## Usage

### For Store Owners

#### 1. Generate Payment Link

When a customer wants to pay with crypto:

```javascript
// From your checkout or custom page
const response = await fetch('https://your-app-url.com/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: orderTotal,
    orderId: order.id,
    shop: 'your-store.myshopify.com'
  })
});

const { paymentId, qrCodeUrl } = await response.json();
```

#### 2. Show Payment QR Code

Display the QR code to your customer:

```html
<img src="${qrCodeUrl}" alt="Payment QR Code" />
```

Or redirect to payment page:

```javascript
window.location.href = `https://your-app-url.com/payment/${paymentId}`;
```

#### 3. Verify Payment

Check payment status:

```javascript
const response = await fetch(`https://your-app-url.com/api/payments/${paymentId}/status`);
const { isPaid } = await response.json();

if (isPaid) {
  // Payment completed - fulfill order
}
```

### For Customers

1. Select "Pay with Crypto" at checkout
2. Scan QR code with EpPay mobile app
3. Confirm payment in the app
4. Order is automatically fulfilled

## API Reference

### Create Payment

**POST** `/api/payments/create`

```json
{
  "amount": 100.50,
  "orderId": "12345",
  "shop": "your-store.myshopify.com"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "uuid-payment-id",
  "qrCodeUrl": "data:image/png;base64,...",
  "qrCodeData": "product=uuideppay&id=uuid"
}
```

### Check Payment Status

**GET** `/api/payments/:paymentId/status`

**Response:**
```json
{
  "success": true,
  "paymentId": "uuid-payment-id",
  "isPaid": true,
  "status": "completed"
}
```

### Payment Page

**GET** `/payment/:paymentId`

Displays a customer-facing payment page with QR code and auto-refresh status checking.

## Webhooks

The app automatically registers webhooks for:

- `orders/create` - When a new order is created
- `orders/paid` - When an order is paid (optional)

## Configuration

### Supported Networks

- Ethereum (ETH)
- Binance Smart Chain (BSC)
- Polygon (MATIC)
- Scimatic Network
- More networks supported by EpPay

### Supported Tokens

- USDT (Tether)
- USDC (USD Coin)
- ETH (Ethereum)
- BNB (Binance Coin)
- Native tokens on each network

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SHOPIFY_API_KEY` | Shopify app API key | Yes |
| `SHOPIFY_API_SECRET` | Shopify app secret | Yes |
| `SCOPES` | Shopify API scopes | Yes |
| `HOST` | Your app's public URL | Yes |
| `EPPAY_API_KEY` | Your EpPay API key | Yes |
| `EPPAY_BENEFICIARY` | Your wallet address | Yes |
| `EPPAY_RPC` | Network RPC URL | Yes |
| `EPPAY_TOKEN` | Token contract address | Yes |

## Development

### Run Locally

```bash
npm run dev
```

### Test with ngrok

```bash
# Terminal 1
npm start

# Terminal 2
npm run tunnel
```

Copy the ngrok URL and update your Shopify app URLs.

### Testing Payments

1. Use test mode in EpPay dashboard
2. Generate test payments
3. Verify webhook handling
4. Check order status updates

## Deployment

### Heroku

```bash
heroku create your-app-name
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
heroku config:set EPPAY_API_KEY=your_eppay_key
# ... set other environment variables
git push heroku main
```

### Vercel

```bash
vercel
```

Configure environment variables in Vercel dashboard.

### Docker

```bash
docker build -t eppay-shopify .
docker run -p 3000:3000 --env-file .env eppay-shopify
```

## Troubleshooting

### App Won't Install

- Check your app URLs are correct
- Verify redirect URL matches exactly
- Ensure app is accessible via HTTPS

### Payments Not Working

- Verify EpPay API key is valid
- Check wallet address and RPC URL
- Ensure token contract address is correct
- Check server logs for errors

### Webhooks Not Received

- Verify webhook URLs are publicly accessible
- Check firewall settings
- Ensure HTTPS is enabled
- Review webhook logs in Shopify

## Support

- **Documentation**: [eppay.io/docs](https://eppay.io/docs)
- **Issues**: [GitHub Issues](https://github.com/nashaib/eppay-shopify/issues)
- **Email**: support@eppay.io

## Security

- Never commit `.env` file
- Use environment variables for sensitive data
- Verify webhook authenticity
- Use HTTPS only
- Keep dependencies updated

## License

MIT License - see [LICENSE](LICENSE) file

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Related Packages

- **Laravel**: [eppay/laravel-eppay](https://packagist.org/packages/eppay/laravel-eppay)
- **JavaScript**: [eppay](https://www.npmjs.com/package/eppay)

## Changelog

### v1.0.0 (2025-10-08)

- Initial release
- Basic payment gateway integration
- QR code generation
- Payment verification
- Webhook handling
- Admin configuration

---

Made with ❤️ by [EpPay](https://eppay.io)
