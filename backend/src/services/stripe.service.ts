/**
 * Stripe Payment Service
 * Handles all Stripe payment operations
 */

import Stripe from 'stripe';
import { ApiError } from '../utils/ApiError';

// Validate and initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  console.error('[Stripe] STRIPE_SECRET_KEY not configured');
}

if (stripeSecretKey && !stripeSecretKey.startsWith('sk_')) {
  console.error('[Stripe] Invalid STRIPE_SECRET_KEY format. Key should start with sk_test_ or sk_live_');
  console.error('[Stripe] Get your real API keys from: https://dashboard.stripe.com/apikeys');
}

const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2025-12-15.clover',
});

export interface CreatePaymentIntentData {
  amount: number;
  currency?: string;
  orderId: string;
  customerId: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionData {
  orderId: string;
  proposalId: string;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

/**
 * Create a Payment Intent
 * Used for direct card payments
 */
export const createPaymentIntent = async (data: CreatePaymentIntentData): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency || 'pkr', // Pakistani Rupee
      metadata: {
        orderId: data.orderId,
        customerId: data.customerId,
        ...data.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('[Stripe] Payment Intent created:', paymentIntent.id);
    return paymentIntent;
  } catch (error: any) {
    console.error('[Stripe] Error creating payment intent:', error);
    throw new ApiError(500, `Stripe payment intent error: ${error.message}`);
  }
};

/**
 * Create a Checkout Session
 * Used for hosted checkout page
 */
export const createCheckoutSession = async (
  data: CreateCheckoutSessionData
): Promise<Stripe.Checkout.Session> => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      throw new ApiError(500, 'Stripe is not properly configured. Please add valid API keys from https://dashboard.stripe.com/apikeys');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: data.currency || 'pkr',
            product_data: {
              name: 'Order Payment',
              description: `Payment for Order #${data.orderId}`,
            },
            unit_amount: Math.round(data.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      customer_email: data.customerEmail,
      metadata: {
        orderId: data.orderId,
        proposalId: data.proposalId,
        ...data.metadata,
      },
    });

    console.log('[Stripe] Checkout session created:', session.id);
    return session;
  } catch (error: any) {
    console.error('[Stripe] Error creating checkout session:', error);
    throw new ApiError(500, `Stripe checkout session error: ${error.message}`);
  }
};

/**
 * Retrieve Payment Intent
 */
export const retrievePaymentIntent = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error: any) {
    console.error('[Stripe] Error retrieving payment intent:', error);
    throw new ApiError(404, `Payment intent not found: ${error.message}`);
  }
};

/**
 * Retrieve Checkout Session
 */
export const retrieveCheckoutSession = async (sessionId: string): Promise<Stripe.Checkout.Session> => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error: any) {
    console.error('[Stripe] Error retrieving session:', error);
    throw new ApiError(404, `Checkout session not found: ${error.message}`);
  }
};

/**
 * Create a Refund
 */
export const createRefund = async (
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> => {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    
    if (amount !== undefined) {
      refundParams.amount = Math.round(amount * 100);
    }
    
    const refund = await stripe.refunds.create(refundParams);

    console.log('[Stripe] Refund created:', refund.id);
    return refund;
  } catch (error: any) {
    console.error('[Stripe] Error creating refund:', error);
    throw new ApiError(500, `Stripe refund error: ${error.message}`);
  }
};

/**
 * Create a Customer
 */
export const createCustomer = async (
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> => {
  try {
    const customerParams: Stripe.CustomerCreateParams = {
      email,
      name,
    };
    
    if (metadata !== undefined) {
      customerParams.metadata = metadata;
    }
    
    const customer = await stripe.customers.create(customerParams);

    console.log('[Stripe] Customer created:', customer.id);
    return customer;
  } catch (error: any) {
    console.error('[Stripe] Error creating customer:', error);
    throw new ApiError(500, `Stripe customer error: ${error.message}`);
  }
};

/**
 * Verify Webhook Signature
 */
export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event => {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error: any) {
    console.error('[Stripe] Webhook signature verification failed:', error);
    throw new ApiError(400, `Webhook signature verification failed: ${error.message}`);
  }
};

/**
 * List all Payment Intents for a customer
 */
export const listPaymentIntents = async (customerId: string): Promise<Stripe.PaymentIntent[]> => {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });

    return paymentIntents.data;
  } catch (error: any) {
    console.error('[Stripe] Error listing payment intents:', error);
    throw new ApiError(500, `Error listing payment intents: ${error.message}`);
  }
};

export default {
  createPaymentIntent,
  createCheckoutSession,
  retrievePaymentIntent,
  retrieveCheckoutSession,
  createRefund,
  createCustomer,
  constructWebhookEvent,
  listPaymentIntents,
};
