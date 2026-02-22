import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm({ onSuccess, onBack, loading: externalLoading }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError('Payment was not completed. Please try again.');
      setProcessing(false);
    }
  };

  const isDisabled = !stripe || processing || externalLoading;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div style={{
          color: '#ff6b6b',
          fontSize: '0.85rem',
          padding: '8px 12px',
          background: 'rgba(255,107,107,0.1)',
          borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      <div className="cta-row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
        <button
          type="button"
          className="btn ghost"
          onClick={onBack}
          disabled={processing}
        >
          Back
        </button>
        <button
          type="submit"
          className="btn primary"
          disabled={isDisabled}
        >
          {processing ? 'Processing...' : 'Pay & Release'}
        </button>
      </div>
    </form>
  );
}
