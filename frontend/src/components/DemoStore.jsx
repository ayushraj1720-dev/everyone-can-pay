
import { useEffect, useRef, useState } from 'react'

const products = [
  { id: 1, name: 'Classic T-Shirt', price: 25, emoji: '👕' },
  { id: 2, name: 'Running Shoes', price: 60, emoji: '👟' },
  { id: 3, name: 'Smart Watch', price: 120, emoji: '⌚' },
]

function DemoStore() {
  const buttonContainers = useRef({})
  const [clientId, setClientId] = useState('')
  const [configError, setConfigError] = useState('')
  const [checkoutStatus, setCheckoutStatus] = useState({})

  // Get PayPal Client ID from backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch(
          'https://everyone-can-pay-api.onrender.com/api/paypal/client-config'
        )

        const data = await response.json()

        if (!response.ok || !data.clientId) {
          throw new Error(data.message || 'Could not load PayPal configuration')
        }

        setClientId(data.clientId)
      } catch (error) {
        setConfigError(error.message)
      }
    }

    loadConfig()
  }, [])

  // Load PayPal SDK and render checkout buttons
  useEffect(() => {
    if (!clientId) return

    let cancelled = false
    let sdkScript = document.getElementById('paypal-sdk-script')

    function renderButtons() {
      if (cancelled || !window.paypal) return

      products.forEach((product) => {
        const container = buttonContainers.current[product.id]

        if (!container || container.dataset.rendered === 'true') return

        container.dataset.rendered = 'true'

        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            shape: 'rect',
            label: 'paypal'
          },

          createOrder: async () => {
            setCheckoutStatus(prev => ({
              ...prev,
              [product.id]: 'Creating PayPal order...'
            }))

            const response = await fetch(
              'https://everyone-can-pay-api.onrender.com/api/paypal/create-order',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  amount: product.price.toFixed(2),
                  currency: 'USD'
                })
              }
            )

            const data = await response.json()

            if (!response.ok || !data.id) {
              throw new Error(
                data.description || data.message || 'Order creation failed'
              )
            }

            return data.id
          },

          onApprove: async (data) => {
            setCheckoutStatus(prev => ({
              ...prev,
              [product.id]: 'Buyer approved. Capturing payment...'
            }))

            try {
              const response = await fetch(
                'https://everyone-can-pay-api.onrender.com/api/paypal/capture-order',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    orderId: data.orderID
                  })
                }
              )

              const result = await response.json()

              if (!response.ok || !result.success) {
                throw new Error(
                  result.description ||
                  result.message ||
                  'Payment capture failed'
                )
              }

              if (result.status !== 'COMPLETED') {
                setCheckoutStatus(prev => ({
                  ...prev,
                  [product.id]: `Capture status: ${result.status || 'Unknown'}`
                }))
                return
              }

              setCheckoutStatus(prev => ({
                ...prev,
                [product.id]: `PAYMENT COMPLETED — Order ${result.orderId}`
              }))
            } catch (error) {
              setCheckoutStatus(prev => ({
                ...prev,
                [product.id]: `Capture failed: ${error.message}`
              }))
            }
          },

          onCancel: () => {
            setCheckoutStatus(prev => ({
              ...prev,
              [product.id]: 'Checkout cancelled by buyer.'
            }))
          },

          onError: (error) => {
            console.error('PayPal checkout error:', error)

            setCheckoutStatus(prev => ({
              ...prev,
              [product.id]: `Checkout error: ${error.message || 'Unknown error'}`
            }))
          }

        }).render(container).catch(error => {
          console.error('PayPal button rendering failed:', error)

          setCheckoutStatus(prev => ({
            ...prev,
            [product.id]: 'Could not load PayPal checkout button.'
          }))
        })
      })
    }

    if (window.paypal) {
      renderButtons()
    } else if (sdkScript) {
      sdkScript.addEventListener('load', renderButtons)
      sdkScript.addEventListener('error', () => {
        if (!cancelled) setConfigError('PayPal SDK failed to load.')
      })
    } else {
      sdkScript = document.createElement('script')
      sdkScript.id = 'paypal-sdk-script'
      sdkScript.src =
        `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`
      sdkScript.async = true

      sdkScript.onload = renderButtons

      sdkScript.onerror = () => {
        if (!cancelled) {
          setConfigError('PayPal SDK failed to load. Check your internet connection.')
        }
      }

      document.body.appendChild(sdkScript)
    }

    return () => {
      cancelled = true
    }
  }, [clientId])

  return (
    <div className="demo-store">
      <div className="store-header">
        <div>
          <p className="eyebrow">MERCHANT PREVIEW</p>
          <h2>Demo Store</h2>
          <p>Test actual PayPal Sandbox checkout and payment capture.</p>
        </div>

        <span className="sandbox-badge">SANDBOX STORE</span>
      </div>

      {configError && (
        <p style={{ color: 'red' }}>{configError}</p>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <div className="product-image">{product.emoji}</div>

            <h3>{product.name}</h3>

            <p className="product-price">
              ${product.price.toFixed(2)} USD
            </p>

            <div
              ref={(element) => {
                buttonContainers.current[product.id] = element
              }}
              style={{ minHeight: '45px' }}
            />

            {checkoutStatus[product.id] && (
              <p style={{
                marginTop: '12px',
                fontSize: '13px',
                overflowWrap: 'anywhere'
              }}>
                {checkoutStatus[product.id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DemoStore
