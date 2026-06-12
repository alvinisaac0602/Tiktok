/**
 * Flutterwave payment integration utilities
 * Uses the Flutterwave inline JS SDK
 */

const FLW_PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY

export function getFlutterwaveConfigError() {
  if (!FLW_PUBLIC_KEY) {
    return 'Missing Flutterwave public key. Set VITE_FLW_PUBLIC_KEY in your .env file.'
  }
  return null
}

function getFlutterwavePublicKey() {
  const error = getFlutterwaveConfigError()
  if (error) {
    throw new Error(error)
  }
  return FLW_PUBLIC_KEY
}

/**
 * Load the Flutterwave inline script dynamically
 */
export function loadFlutterwaveScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('flw-script')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = 'flw-script'
    script.src = 'https://checkout.flutterwave.com/v3.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

/**
 * Initiate Flutterwave payment popup
 * @param {Object} config
 * @param {string} config.txRef       - Unique transaction ref (order ID)
 * @param {number} config.amount      - Amount in UGX
 * @param {string} config.phone       - Customer phone
 * @param {string} config.email       - Customer email (optional)
 * @param {string} config.name        - Customer name
 * @param {string} config.description - Product description
 * @param {Function} config.onSuccess - Callback on success
 * @param {Function} config.onClose   - Callback on close
 */
export async function initiatePayment(config) {
  await loadFlutterwaveScript()

  const {
    txRef,
    amount,
    phone,
    email = `${phone}@tiktokshop.ug`,
    name = 'TikTok Customer',
    description = 'TikTok Commerce Order',
    onSuccess,
    onClose,
  } = config

  window.FlutterwaveCheckout({
    public_key: getFlutterwavePublicKey(),
    tx_ref: txRef,
    amount,
    currency: 'UGX',
    payment_options: 'mobilemoneyganda,mobilemoneyuganda,card',
    customer: {
      email,
      phone_number: phone,
      name,
    },
    customizations: {
      title: '🛍️ TikTok Commerce',
      description,
      logo: `${import.meta.env.VITE_APP_URL || ''}/logo.png`,
    },
    meta: {
      source: 'tiktok_commerce',
    },
    callback: (response) => {
      if (
        response.status === 'successful' ||
        response.status === 'completed'
      ) {
        onSuccess && onSuccess(response)
      }
    },
    onclose: () => {
      onClose && onClose()
    },
  })
}

/**
 * Format UGX currency
 */
export function formatUGX(amount) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
