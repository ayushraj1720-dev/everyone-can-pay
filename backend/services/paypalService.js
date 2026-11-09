
async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const baseUrl = process.env.PAYPAL_BASE_URL

  if (!clientId || !clientSecret || !baseUrl) {
    throw new Error('PayPal credentials are missing from .env')
  }

  const credentials = Buffer
    .from(`${clientId}:${clientSecret}`)
    .toString('base64')

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      `PayPal authentication failed (${response.status}): ${
        data.error_description || data.error || 'Unknown error'
      }`
    )
  }

  return data.access_token
}

async function createPayPalOrder(amount, currency) {
  const accessToken = await getAccessToken()
  const baseUrl = process.env.PAYPAL_BASE_URL

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
        },
      ],
    }),
  })

  const data = await response.json()

  console.log('PayPal API status:', response.status)
  console.log('PayPal API response:', JSON.stringify(data, null, 2))

  if (!response.ok) {
    const error = new Error(
      data.message || 'PayPal order creation failed'
    )

    error.httpStatus = response.status
    error.issue = data.details?.[0]?.issue || 'UNKNOWN_ERROR'
    error.description =
      data.details?.[0]?.description || data.message
    error.debugId = data.debug_id || null

    throw error
  }

  return data
}

// Capture an order after buyer approval
async function capturePayPalOrder(orderId) {
  const accessToken = await getAccessToken()
  const baseUrl = process.env.PAYPAL_BASE_URL

  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation',
      },
    }
  )

  const data = await response.json()

  console.log('PayPal capture status:', response.status)
  console.log('PayPal capture response:', JSON.stringify(data, null, 2))

  if (!response.ok) {
    const error = new Error(
      data.message || 'PayPal payment capture failed'
    )

    error.httpStatus = response.status
    error.issue = data.details?.[0]?.issue || 'UNKNOWN_ERROR'
    error.description =
      data.details?.[0]?.description || data.message
    error.debugId = data.debug_id || null

    throw error
  }

  return data
}

module.exports = {
  getAccessToken,
  createPayPalOrder,
  capturePayPalOrder,
}
