
import { useState } from 'react'

function CurrencyTests() {
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'HUF', name: 'Hungarian Forint' },
    { code: 'TWD', name: 'Taiwan Dollar' },
    { code: 'BRL', name: 'Brazilian Real' },
  ]

  const products = [
    { name: 'Classic T-Shirt', price: 25 },
    { name: 'Running Shoes', price: 60 },
    { name: 'Smart Watch', price: 120 },
  ]

  const [selectedProducts, setSelectedProducts] = useState(
    products.map((product) => product.name)
  )

  const [selectedCurrencies, setSelectedCurrencies] = useState(
    currencies.map((currency) => currency.code)
  )

  const [results, setResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedRunId, setSavedRunId] = useState(null)

  const [aiAnalyses, setAiAnalyses] = useState({})
  const [aiLoading, setAiLoading] = useState({})
  const [recommendationDecisions, setRecommendationDecisions] = useState({})

  function toggleItem(item, selected, setSelected) {
    setSelected(
      selected.includes(item)
        ? selected.filter((value) => value !== item)
        : [...selected, item]
    )
  }

  const totalTests =
    selectedProducts.length * selectedCurrencies.length

  const completed = results.length

  const passed = results.filter(
    (result) => result.status === 'PASS'
  ).length

  const failed = results.filter(
    (result) => result.status === 'FAIL'
  ).length

  const successRate =
    completed > 0
      ? ((passed / completed) * 100).toFixed(1)
      : '0.0'

  const currencyStats = currencies
    .map((currency) => {
      const currencyResults = results.filter(
        (result) => result.currency === currency.code
      )

      const currencyPassed = currencyResults.filter(
        (result) => result.status === 'PASS'
      ).length

      const currencyFailed = currencyResults.filter(
        (result) => result.status === 'FAIL'
      ).length

      const currencySuccessRate =
        currencyResults.length > 0
          ? (
              (currencyPassed / currencyResults.length) * 100
            ).toFixed(1)
          : '0.0'

      return {
        code: currency.code,
        name: currency.name,
        total: currencyResults.length,
        passed: currencyPassed,
        failed: currencyFailed,
        successRate: currencySuccessRate,
      }
    })
    .filter((currency) => currency.total > 0)

  // RUN CURRENCY TESTS
  async function runTests() {
    if (selectedProducts.length === 0 || selectedCurrencies.length === 0) {
      alert('Please select at least one product and one currency.')
      return
    }

    setIsRunning(true)
    setIsSaving(false)
    setResults([])
    setSavedRunId(null)
    setAiAnalyses({})
    setAiLoading({})
    setRecommendationDecisions({})

    const testResults = []

    try {
      for (const productName of selectedProducts) {
        const product = products.find(
          (item) => item.name === productName
        )

        for (const currency of selectedCurrencies) {
          let amount

          try {
            const digits = new Intl.NumberFormat('en', {
              style: 'currency',
              currency,
            }).resolvedOptions().maximumFractionDigits

            amount = product.price.toFixed(digits)

            const response = await fetch(
              'http://https://everyone-can-pay-backend.onrender.com/api/paypal/create-order',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  amount,
                  currency,
                }),
              }
            )

            const data = await response.json()

            testResults.push({
              product: productName,
              currency,
              amount,
              status: response.ok ? 'PASS' : 'FAIL',
              orderId: data.orderId || null,
              message: response.ok
                ? 'PayPal order created successfully'
                : data.message || 'Order creation failed',
              issue: data.issue || null,
              description: data.description || null,
              debugId: data.debugId || null,
            })
          } catch (error) {
            testResults.push({
              product: productName,
              currency,
              amount: amount || product.price.toFixed(2),
              status: 'FAIL',
              orderId: null,
              message: error.message || 'Backend connection failed',
              issue: 'CONNECTION_ERROR',
              description:
                'Could not communicate with the backend server.',
              debugId: null,
            })
          }

          setResults([...testResults])
        }
      }

      // SAVE COMPLETED TEST RUN TO SQLITE
      setIsSaving(true)

      const saveResponse = await fetch(
        'http://https://everyone-can-pay-backend.onrender.com/api/tests/save',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            results: testResults,
          }),
        }
      )

      const savedData = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(
          savedData.message || 'Could not save test results.'
        )
      }

      setSavedRunId(savedData.runId)

      // RETRIEVE DATABASE RESULT IDs
      const historyResponse = await fetch(
        `http://https://everyone-can-pay-backend.onrender.com/api/tests/history/${savedData.runId}`
      )

      const historyData = await historyResponse.json()

      if (!historyResponse.ok) {
        throw new Error('Could not retrieve saved result IDs.')
      }

      const resultsWithIds = testResults.map((result, index) => ({
        ...result,
        databaseId: historyData.results[index]?.id,
      }))

      setResults(resultsWithIds)

      console.log('Test results saved successfully:', savedData)
    } catch (error) {
      console.error('Database save failed:', error.message)

      alert(
        'Tests completed, but saving to database failed: ' +
          error.message
      )
    } finally {
      setIsSaving(false)
      setIsRunning(false)
    }
  }

  // GEMINI AI ERROR ANALYSIS
  async function explainWithAI(result, index) {
    setAiLoading((previous) => ({
      ...previous,
      [index]: true,
    }))

    setAiAnalyses((previous) => ({
      ...previous,
      [index]: '',
    }))

    setRecommendationDecisions((previous) => ({
      ...previous,
      [index]: 'Pending',
    }))

    try {
      const response = await fetch(
        'http://https://everyone-can-pay-backend.onrender.com/api/ai/analyze-error',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product: result.product,
            currency: result.currency,
            amount: result.amount,
            issue: result.issue || 'UNKNOWN_ERROR',
            description: result.description || result.message,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Error analysis could not be completed.'
        )
      }

      setAiAnalyses((previous) => ({
        ...previous,
        [index]: data.analysis,
      }))

      // SAVE AI ANALYSIS TO SQLITE
      if (result.databaseId) {
        const saveResponse = await fetch(
          `http://https://everyone-can-pay-backend.onrender.com/api/tests/results/${result.databaseId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              aiAnalysis: data.analysis,
            }),
          }
        )

        if (!saveResponse.ok) {
          console.error('Could not save AI analysis.')
        }
      }
    } catch (error) {
      setAiAnalyses((previous) => ({
        ...previous,
        [index]: error.message || 'Error analysis failed.',
      }))
    } finally {
      setAiLoading((previous) => ({
        ...previous,
        [index]: false,
      }))
    }
  }

  // SAVE MERCHANT DECISION
  async function recordDecision(index, decision) {
    const result = results[index]

    if (!result?.databaseId) {
      alert('This result has not been saved to the database.')
      return
    }

    try {
      const response = await fetch(
        `http://https://everyone-can-pay-backend.onrender.com/api/tests/results/${result.databaseId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            decision,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not save decision.'
        )
      }

      setRecommendationDecisions((previous) => ({
        ...previous,
        [index]: decision,
      }))
    } catch (error) {
      console.error('Decision save failed:', error.message)
      alert('Decision could not be saved. Please try again.')
    }
  }

  return (
    <div className="currency-tests">
      <div className="test-intro">
        <p className="eyebrow">TEST CONFIGURATION</p>
        <h2>Currency Test Grid</h2>
        <p>
          Choose products and currencies to prepare your
          PayPal Sandbox checkout tests.
        </p>
      </div>

      {/* PRODUCT SELECTION */}
      <div className="selection-panel">
        <h3>1. Select Products</h3>

        {products.map((product) => (
          <label className="selection-row" key={product.name}>
            <input
              type="checkbox"
              checked={selectedProducts.includes(product.name)}
              disabled={isRunning}
              onChange={() =>
                toggleItem(
                  product.name,
                  selectedProducts,
                  setSelectedProducts
                )
              }
            />
            {product.name} (Test amount: {product.price})
          </label>
        ))}
      </div>

      {/* CURRENCY SELECTION */}
      <div className="selection-panel">
        <h3>2. Select Currencies</h3>

        <div className="currency-grid">
          {currencies.map((currency) => (
            <label className="currency-option" key={currency.code}>
              <input
                type="checkbox"
                checked={selectedCurrencies.includes(currency.code)}
                disabled={isRunning}
                onChange={() =>
                  toggleItem(
                    currency.code,
                    selectedCurrencies,
                    setSelectedCurrencies
                  )
                }
              />

              <span>
                <strong>{currency.code}</strong>
                <small>{currency.name}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* RUN TESTS */}
      <div className="test-summary">
        <div>
          <small>EXPECTED TEST COUNT</small>
          <h2>{totalTests}</h2>
          <p>
            {selectedProducts.length} products ×{' '}
            {selectedCurrencies.length} currencies
          </p>
        </div>

        <button
          className="primary-button"
          disabled={totalTests === 0 || isRunning}
          onClick={runTests}
        >
          {isRunning
            ? 'Running Tests...'
            : 'Run Currency Tests →'}
        </button>
      </div>

      {isSaving && (
        <p>
          Saving test results to database...
        </p>
      )}

      {savedRunId && (
        <p style={{ color: '#22c55e' }}>
          ✓ Test run #{savedRunId} saved successfully.
        </p>
      )}

      {/* RESULTS DASHBOARD */}
      {results.length > 0 && (
        <div className="selection-panel">
          <h3>3. Test Results Dashboard</h3>

          <p>
            Completed: {completed} / {totalTests}
            {isRunning && ' — Tests in progress...'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              margin: '18px 0',
            }}
          >
            <div className="test-summary">
              <div>
                <small>COMPLETED</small>
                <h2>{completed}/{totalTests}</h2>
              </div>
            </div>

            <div className="test-summary">
              <div>
                <small>PASSED</small>
                <h2 style={{ color: '#22c55e' }}>{passed}</h2>
              </div>
            </div>

            <div className="test-summary">
              <div>
                <small>FAILED</small>
                <h2 style={{ color: '#ef4444' }}>{failed}</h2>
              </div>
            </div>

            <div className="test-summary">
              <div>
                <small>SUCCESS RATE</small>
                <h2>{successRate}%</h2>
              </div>
            </div>
          </div>

          {/* CURRENCY COMPATIBILITY */}
          <h3 style={{ marginTop: '24px' }}>
            Currency-wise Compatibility
          </h3>

          {currencyStats.map((currency) => (
            <div
              key={currency.code}
              style={{
                padding: '12px',
                marginBottom: '10px',
                border: '1px solid #444',
                borderRadius: '8px',
              }}
            >
              <strong>
                {currency.code} — {currency.name}
              </strong>

              <p>
                Passed: {currency.passed} | Failed: {currency.failed}
              </p>

              <p>
                Success Rate: {currency.successRate}%
              </p>

              <div
                style={{
                  height: '8px',
                  background: '#444',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${currency.successRate}%`,
                    height: '100%',
                    background: '#22c55e',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}

          {/* INDIVIDUAL RESULTS */}
          <h3 style={{ marginTop: '28px' }}>
            Individual Test Details
          </h3>

          {results.map((result, index) => (
            <div
              key={`${result.product}-${result.currency}-${index}`}
              style={{
                padding: '12px',
                marginBottom: '10px',
                border: '1px solid #444',
                borderRadius: '8px',
              }}
            >
              <strong>
                {result.product} — {result.currency}
              </strong>

              <p>
                Amount: {result.amount} {result.currency}
              </p>

              <p>
                Status:{' '}
                <strong
                  style={{
                    color:
                      result.status === 'PASS'
                        ? '#22c55e'
                        : '#ef4444',
                  }}
                >
                  {result.status}
                </strong>
              </p>

              <small>{result.message}</small>

              {result.issue && (
                <p>
                  <strong>Error code:</strong> {result.issue}
                </p>
              )}

              {result.description && (
                <p>
                  <strong>PayPal explanation:</strong>{' '}
                  {result.description}
                </p>
              )}

              {result.debugId && (
                <p>
                  <strong>PayPal Debug ID:</strong> {result.debugId}
                </p>
              )}

              {result.orderId && (
                <p>
                  <small>Order ID: {result.orderId}</small>
                </p>
              )}

              {/* AI ERROR ANALYSIS */}
              {result.status === 'FAIL' && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    className="primary-button"
                    disabled={aiLoading[index]}
                    onClick={() => explainWithAI(result, index)}
                  >
                    {aiLoading[index]
                      ? 'Analyzing...'
                      : 'Explain Error ✨'}
                  </button>

                  {aiAnalyses[index] && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '14px',
                        border: '1px solid #777',
                        borderRadius: '8px',
                        background: 'rgba(100, 100, 100, 0.08)',
                      }}
                    >
                      <h4>Error Analysis & Suggested Fix</h4>

                      <p
                        style={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6',
                        }}
                      >
                        {aiAnalyses[index]}
                      </p>

                      {/* MERCHANT DECISION */}
                      <div
                        style={{
                          marginTop: '16px',
                          paddingTop: '12px',
                          borderTop: '1px solid #777',
                        }}
                      >
                        <h4>4. Review Suggested Fix</h4>

                        <p>
                          Do you approve this suggested action?
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            className="primary-button"
                            disabled={
                              recommendationDecisions[index] === 'Accepted'
                            }
                            onClick={() =>
                              recordDecision(index, 'Accepted')
                            }
                          >
                            ✓ Accept Suggestion
                          </button>

                          <button
                            className="primary-button"
                            disabled={
                              recommendationDecisions[index] === 'Rejected'
                            }
                            onClick={() =>
                              recordDecision(index, 'Rejected')
                            }
                          >
                            ✕ Reject Suggestion
                          </button>
                        </div>

                        <p style={{ marginTop: '12px' }}>
                          Decision:{' '}
                          <strong
                            style={{
                              color:
                                recommendationDecisions[index] === 'Accepted'
                                  ? '#22c55e'
                                  : recommendationDecisions[index] === 'Rejected'
                                    ? '#ef4444'
                                    : '#eab308',
                            }}
                          >
                            {recommendationDecisions[index] || 'Pending'}
                          </strong>
                        </p>

                        <small>
                          Your decision is saved in the database.
                          No source code or PayPal settings are
                          automatically modified.
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <p
            style={{
              marginTop: '18px',
              fontSize: '13px',
              opacity: 0.8,
            }}
          >
            Note: PASS means PayPal successfully created the order.
            It does not mean the buyer approved or completed payment.
          </p>
        </div>
      )}
    </div>
  )
}

export default CurrencyTests
