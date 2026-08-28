/**
 * RazorpayService
 *
 * Encapsulates dynamic Razorpay Checkout JavaScript SDK loading and modal launcher.
 * Keeps Razorpay client-side SDK integration clean and decoupled from business logic.
 */

let sdkPromise = null;

export const razorpayService = {
  /**
   * Dynamically loads the Razorpay Checkout script if not already present.
   * @returns {Promise<boolean>} Resolves to true when the SDK is ready to use.
   */
  loadRazorpaySdk: () => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return Promise.resolve(true);
    }

    if (sdkPromise) {
      return sdkPromise;
    }

    sdkPromise = new Promise((resolve) => {
      const existingScript = document.getElementById('razorpay-checkout-script');
      if (existingScript) {
        if (window.Razorpay) {
          resolve(true);
        } else {
          existingScript.addEventListener('load', () => resolve(true));
          existingScript.addEventListener('error', () => resolve(false));
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        console.error('Failed to load Razorpay Checkout SDK.');
        sdkPromise = null;
        resolve(false);
      };

      document.body.appendChild(script);
    });

    return sdkPromise;
  },

  /**
   * Opens the Razorpay Checkout modal with the provided configuration options.
   * @param {Object} options Razorpay standard configuration options.
   * @param {Function} [onPaymentFailed] Optional callback when payment fails explicitly.
   * @returns {Promise<Object>} The Razorpay instance.
   */
  openRazorpayCheckout: async (options, onPaymentFailed) => {
    const isLoaded = await razorpayService.loadRazorpaySdk();
    if (!isLoaded || !window.Razorpay) {
      throw new Error('Razorpay payment gateway SDK is unavailable. Please check your connection.');
    }

    const rzp = new window.Razorpay(options);

    if (typeof onPaymentFailed === 'function') {
      rzp.on('payment.failed', onPaymentFailed);
    }

    rzp.open();
    return rzp;
  }
};
