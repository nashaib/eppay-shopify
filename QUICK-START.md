# Quick Start Guide

Get EpPay running in your Shopify store in 5 minutes!

## Prerequisites

- Shopify store
- EpPay account (sign up at [eppay.io](https://eppay.io/register))
- Node.js 18+ installed

## Step 1: Get EpPay API Key

1. Visit [eppay.io/register](https://eppay.io/register)
2. Create an account
3. Go to Dashboard → API Keys
4. Click "Generate New API Key"
5. Copy your API key

## Step 2: Install the App

```bash
# Clone the repository
git clone https://github.com/nashaib/eppay-shopify.git
cd eppay-shopify

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## Step 3: Configure

Edit `.env` file:

```env
# Your Shopify app credentials
SHOPIFY_API_KEY=get_from_shopify_partners
SHOPIFY_API_SECRET=get_from_shopify_partners
SCOPES=write_orders,read_orders
HOST=https://your-app-url.com

# Your EpPay configuration
EPPAY_API_KEY=WlJSciIhgHkUzduirHj2AqIwxFvVGN
EPPAY_BENEFICIARY=0x8AB960B95aCCc5080c15721fdeA30e72C8251F0b
EPPAY_RPC=https://rpc.scimatic.net
EPPAY_TOKEN=0x65C4A0dA0416d1262DbC04BeE524c804205B92e8
```

## Step 4: Create Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Click "Apps" → "Create app"
3. Select "Public app" or "Custom app"
4. Fill in details:
   - **App name**: EpPay Crypto Payments
   - **App URL**: `https://your-domain.com`
   - **Redirect URL**: `https://your-domain.com/auth/callback`
5. Copy API key and secret to `.env`

## Step 5: Deploy

### Option A: Local Testing (with ngrok)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run tunnel
```

Copy the ngrok HTTPS URL and update your Shopify app URLs.

### Option B: Deploy to Heroku

```bash
heroku create eppay-shopify
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set EPPAY_API_KEY=your_eppay_key
# ... set other vars
git push heroku main
```

### Option C: Deploy to Vercel

```bash
vercel
```

Configure environment variables in Vercel dashboard.

## Step 6: Install in Your Store

1. Visit: `https://your-app-url.com/install`
2. Enter your store: `your-store.myshopify.com`
3. Click "Install"
4. Authorize the app

## Step 7: Test Payment

1. Create a test order in your store
2. Use the payment API:

```javascript
const response = await fetch('https://your-app-url.com/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10.00,
    orderId: 'test-123',
    shop: 'your-store.myshopify.com'
  })
});

const { paymentId, qrCodeUrl } = await response.json();
console.log('Payment QR:', qrCodeUrl);
```

3. Scan QR code with EpPay mobile app
4. Confirm payment

## Step 8: Integrate into Checkout

Add EpPay as a payment option in your checkout flow:

```html
<!-- In your checkout page -->
<button onclick="payWithEpPay()">Pay with Crypto</button>

<script>
async function payWithEpPay() {
  const response = await fetch('https://your-app.com/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: {{ cart.total_price }},
      orderId: '{{ order.id }}',
      shop: '{{ shop.domain }}'
    })
  });

  const { paymentId } = await response.json();
  window.location.href = `https://your-app.com/payment/${paymentId}`;
}
</script>
```

## Troubleshooting

### App won't install

- Verify your app URLs are correct
- Make sure redirect URL matches exactly
- Check that your app is accessible via HTTPS

### Payments failing

- Check EpPay API key is valid
- Verify wallet address format
- Ensure RPC URL is accessible
- Check server logs for errors

### Need help?

- Email: support@eppay.io
- Documentation: [eppay.io/docs](https://eppay.io/docs)
- GitHub Issues: [github.com/nashaib/eppay-shopify/issues](https://github.com/nashaib/eppay-shopify/issues)

## Next Steps

- Customize payment page branding
- Add multiple payment currencies
- Set up webhook notifications
- Configure automatic order fulfillment
- Add payment analytics

---

🎉 **Congratulations!** Your store now accepts cryptocurrency payments!
