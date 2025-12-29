# Stripe Payment Integration - Implementation Guide

## Overview
Stripe payment integration has been successfully added to the Expert Raah platform as an additional payment method alongside the existing EasyPaisa, JazzCash, and Card with OTP options.

## Backend Implementation

### 1. Stripe Service (`backend/src/services/stripe.service.ts`)
Comprehensive service module with 8 core payment methods:

#### Core Methods:
- **`createPaymentIntent()`** - Direct card payments with Stripe Elements
  - Automatically enables payment methods (card, link, cashapp)
  - Amount in cents, PKR currency
  - Supports metadata for order tracking
  
- **`createCheckoutSession()`** - Hosted Stripe Checkout page
  - Customizable line items
  - Success/cancel URL redirects
  - Customer email pre-fill
  
- **`retrievePaymentIntent()`** - Fetch payment status by ID
  
- **`retrieveCheckoutSession()`** - Fetch session details
  
- **`createRefund()`** - Full or partial refunds
  
- **`createCustomer()`** - Create Stripe customer records
  
- **`constructWebhookEvent()`** - Webhook signature verification
  
- **`listPaymentIntents()`** - Customer payment history

#### Configuration:
```typescript
// Stripe initialized with secret key from .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Default currency: PKR (Pakistani Rupee)
// Amounts automatically converted to cents (x100)
```

### 2. Order Controller (`backend/src/modules/order/order.controller.ts`)
Added 5 new Stripe-specific endpoints:

#### **POST `/api/orders/payment/stripe/payment-intent`**
Create Payment Intent for Stripe Elements integration
```typescript
Body: {
  orderId: string,
  amount: number  // in PKR
}
Response: {
  clientSecret: string,
  paymentIntentId: string
}
```

#### **POST `/api/orders/payment/stripe/checkout-session`**
Create Checkout Session for hosted payment page
```typescript
Body: {
  orderId: string,
  proposalId: string,
  amount: number  // in PKR
}
Response: {
  sessionId: string,
  url: string  // Redirect user to this URL
}
```

#### **POST `/api/orders/payment/stripe/verify`**
Verify payment completion and update order
```typescript
Body: {
  paymentIntentId?: string,  // For Payment Intent flow
  sessionId?: string         // For Checkout Session flow
}
Response: {
  orderId: string,
  amountPaid: number,
  amountPending: number,
  transactionId: string
}
```

#### **POST `/api/orders/payment/stripe/refund`**
Create refund for cancelled orders
```typescript
Body: {
  orderId: string,
  paymentIntentId: string,
  amount?: number  // Optional for partial refund
}
Response: {
  refundId: string,
  amount: number,
  status: string
}
```

#### **POST `/api/orders/payment/stripe/webhook`**
Handle Stripe webhook events
- Receives events: payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed
- Requires Stripe-Signature header
- Verifies webhook signature for security

### 3. Routes (`backend/src/modules/order/order.routes.ts`)
All Stripe endpoints added under `/api/orders/payment/stripe/*`
- Authentication required (authenticate middleware)
- Routes registered in order routes module

### 4. Environment Configuration
Added to `.env`:
```env
STRIPE_SECRET_KEY=mk_1ShDAlDdqTMndkyJOmL4bkHe
STRIPE_WEBHOOK_SECRET=    # To be set after creating webhook endpoint in Stripe Dashboard
```

Also updated `.env.example` with Stripe configuration placeholders.

### 5. Dependencies
Installed Stripe Node.js SDK:
```bash
npm install stripe
```

## API Keys Provided

| Key Type | Value |
|----------|-------|
| **Publishable Key** (Frontend) | `mk_1ShDAlDdqTMndkyJJz4TePhB` |
| **Secret Key** (Backend) | `mk_1ShDAlDdqTMndkyJOmL4bkHe` |

⚠️ **Note**: These keys appear to be test/development keys based on the `mk_` prefix. For production, obtain live keys from Stripe Dashboard.

## Payment Flows

### Flow 1: Stripe Elements (Direct Integration)
1. **Frontend**: Request Payment Intent
   ```typescript
   POST /api/orders/payment/stripe/payment-intent
   Body: { orderId, amount }
   ```

2. **Frontend**: Use clientSecret with Stripe Elements
   ```javascript
   // Initialize Stripe
   const stripe = Stripe('mk_1ShDAlDdqTMndkyJJz4TePhB');
   
   // Create Elements
   const elements = stripe.elements({ clientSecret });
   const paymentElement = elements.create('payment');
   paymentElement.mount('#payment-element');
   
   // Submit payment
   const { error } = await stripe.confirmPayment({
     elements,
     confirmParams: {
       return_url: 'http://localhost:3000/payment/success',
     },
   });
   ```

3. **Frontend**: Verify payment on return
   ```typescript
   POST /api/orders/payment/stripe/verify
   Body: { paymentIntentId }
   ```

### Flow 2: Stripe Checkout (Hosted Page)
1. **Frontend**: Request Checkout Session
   ```typescript
   POST /api/orders/payment/stripe/checkout-session
   Body: { orderId, proposalId, amount }
   ```

2. **Frontend**: Redirect to Stripe Checkout
   ```javascript
   const { url } = response.data;
   window.location.href = url;  // User completes payment on Stripe
   ```

3. **Stripe**: Redirects back to success URL with session_id
   ```
   http://localhost:3000/payment/success?session_id=cs_test_...
   ```

4. **Frontend**: Verify payment
   ```typescript
   POST /api/orders/payment/stripe/verify
   Body: { sessionId: params.get('session_id') }
   ```

## Webhook Configuration

### Setting up Stripe Webhooks:
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/orders/payment/stripe/webhook`
3. Select events to listen:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Copy webhook signing secret
5. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Webhook Events Handled:
- **payment_intent.succeeded** - Payment successful
- **payment_intent.payment_failed** - Payment failed
- **checkout.session.completed** - Checkout session completed

## Frontend Integration (TODO)

### Required Changes:

#### 1. Install Stripe.js
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### 2. Add Publishable Key to Frontend .env
```env
VITE_STRIPE_PUBLISHABLE_KEY=mk_1ShDAlDdqTMndkyJJz4TePhB
```

#### 3. Create Stripe Payment Component
```typescript
// frontend/src/components/StripePayment.tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const StripePayment = ({ orderId, amount }) => {
  const [clientSecret, setClientSecret] = useState('');
  
  useEffect(() => {
    // Create Payment Intent
    api.post('/orders/payment/stripe/payment-intent', { orderId, amount })
      .then(res => setClientSecret(res.data.clientSecret));
  }, [orderId, amount]);
  
  if (!clientSecret) return <div>Loading...</div>;
  
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm orderId={orderId} />
    </Elements>
  );
};
```

#### 4. Create Checkout Form Component
```typescript
// frontend/src/components/CheckoutForm.tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export const CheckoutForm = ({ orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    });
    
    if (error) {
      console.error(error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  );
};
```

#### 5. Create Payment Success Page
```typescript
// frontend/src/pages/PaymentSuccess.tsx
export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Verify payment
    api.post('/orders/payment/stripe/verify', {
      paymentIntentId,
      sessionId
    }).then(res => {
      console.log('Payment verified:', res.data);
    });
  }, [paymentIntentId, sessionId]);
  
  return <div>Payment successful! Order updated.</div>;
};
```

#### 6. Update Payment Selection UI
Add Stripe option to existing payment methods:
```typescript
// In payment selection component
const paymentMethods = [
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'card', label: 'Card' },
  { value: 'stripe', label: 'Pay with Stripe', icon: <StripeIcon /> }  // NEW
];
```

## Testing

### Test Payment Cards (Stripe Test Mode):
| Card Number | Brand | Result |
|------------|-------|--------|
| 4242 4242 4242 4242 | Visa | Success |
| 4000 0025 0000 3155 | Visa | Requires authentication (3D Secure) |
| 4000 0000 0000 9995 | Visa | Decline |

### Test Workflow:
1. **Create Order** → Get orderId
2. **Select Stripe Payment** → Choose Payment Intent or Checkout
3. **Complete Payment** → Use test card 4242 4242 4242 4242
4. **Verify Payment** → Check order amountPaid updated
5. **Test Refund** → Create refund for order
6. **Check Webhook** → Monitor webhook events in Stripe Dashboard

### API Testing with cURL:
```bash
# Create Payment Intent
curl -X POST http://localhost:5000/api/orders/payment/stripe/payment-intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORDER_ID", "amount": 5000}'

# Create Checkout Session
curl -X POST http://localhost:5000/api/orders/payment/stripe/checkout-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORDER_ID", "proposalId": "PROPOSAL_ID", "amount": 5000}'

# Verify Payment
curl -X POST http://localhost:5000/api/orders/payment/stripe/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_..."}'
```

## Security Considerations

✅ **Implemented:**
- Stripe secret key stored in environment variables
- Webhook signature verification
- Order ownership verification before payment
- Authentication required for all endpoints

⚠️ **Recommendations:**
1. Use live keys only in production environment
2. Set up webhook endpoint with HTTPS
3. Implement rate limiting on payment endpoints
4. Log all payment transactions for audit
5. Add fraud detection rules in Stripe Dashboard
6. Enable SCA (Strong Customer Authentication) for European cards

## Order Payment Update Logic

When payment is verified:
```typescript
order.amountPaid = (order.amountPaid || 0) + amount;
order.amountPending = order.totalAmount - order.amountPaid;
await order.save();
```

This allows:
- **Partial payments** - Pay in installments
- **Multiple payment methods** - Mix Stripe + EasyPaisa
- **Milestone payments** - Pay per milestone completion

## Comparison: Existing vs Stripe Payment

| Feature | EasyPaisa/JazzCash/Card | Stripe |
|---------|------------------------|--------|
| Payment Flow | OTP verification | Direct/Checkout |
| Session Storage | In-memory Map | Stripe API |
| Card Support | Pakistani cards | International cards |
| Refunds | Manual | Automated API |
| Webhooks | Not available | Full webhook support |
| Customer Records | Not stored | Stripe Customer objects |
| Payment History | Database only | Stripe Dashboard + DB |

## Next Steps

### Immediate (Required for Production):
1. ✅ Backend Stripe service created
2. ✅ Backend endpoints implemented
3. ✅ Routes configured
4. ✅ Stripe package installed
5. ✅ Environment variables set
6. ⏳ Frontend Stripe integration (TODO)
7. ⏳ Create webhook endpoint in Stripe Dashboard
8. ⏳ Add webhook secret to .env
9. ⏳ Test complete payment flow

### Future Enhancements:
- [ ] Save Stripe customer ID in User model
- [ ] Implement saved payment methods
- [ ] Add subscription support for recurring payments
- [ ] Integrate Stripe Radar for fraud prevention
- [ ] Add payment analytics dashboard
- [ ] Support additional payment methods (Apple Pay, Google Pay)
- [ ] Implement automatic retry for failed payments

## Files Modified/Created

### Created:
- ✅ `backend/src/services/stripe.service.ts` (220+ lines)

### Modified:
- ✅ `backend/src/modules/order/order.controller.ts` - Added 5 Stripe endpoints
- ✅ `backend/src/modules/order/order.routes.ts` - Added 5 Stripe routes
- ✅ `backend/.env` - Added STRIPE_SECRET_KEY
- ✅ `backend/.env.example` - Added Stripe configuration template
- ✅ `backend/package.json` - Added stripe dependency

### To Be Created:
- ⏳ `frontend/src/components/StripePayment.tsx`
- ⏳ `frontend/src/components/CheckoutForm.tsx`
- ⏳ `frontend/src/pages/PaymentSuccess.tsx`
- ⏳ Frontend .env with VITE_STRIPE_PUBLISHABLE_KEY

## Support & Documentation

- **Stripe API Reference**: https://docs.stripe.com/api
- **Stripe Elements Guide**: https://docs.stripe.com/payments/elements
- **Stripe Checkout Guide**: https://docs.stripe.com/payments/checkout
- **Stripe Webhooks**: https://docs.stripe.com/webhooks
- **Test Cards**: https://docs.stripe.com/testing#cards

---

**Implementation Status**: ✅ Backend Complete | ⏳ Frontend Pending  
**Estimated Frontend Work**: 2-3 hours  
**Priority**: HIGH - Core payment feature
