
import { useEffect, useState } from 'react'

const API_BASE = 'http://https://everyone-can-pay-backend.onrender.com'

function TestResults() {
  const [runs, setRuns] = useState([])
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [selectedRun, setSelectedRun] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadHistory() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/tests/history`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not load test history.')
      }

      const history = data.runs || []
      setRuns(history)

      if (history.length === 0) {
        setSelectedRunId(null)
        setSelectedRun(null)
        setResults([])
      } else {
        const currentId = selectedRunId
        const stillExists = history.some(
          (run) => run.id === currentId
        )

        await loadRunDetails(
          stillExists ? currentId : history[0].id
        )
      }
    } catch (err) {
      setError(err.message || 'Failed to load test history.')
    } finally {
      setLoading(false)
    }
  }

  async function loadRunDetails(runId) {
    setSelectedRunId(runId)
    setDetailLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_BASE}/api/tests/history/${runId}`
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not load run details.')
      }

      setSelectedRun(data.run || null)
      setResults(data.results || [])
    } catch (err) {
      setSelectedRun(null)
      setResults([])
      setError(err.message || 'Failed to load run details.')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  function formatDate(dateString) {
    if (!dateString) return 'Date unavailable'

    const date = new Date(dateString.replace(' ', 'T') + 'Z')

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusColor(status) {
    return status === 'PASS' ? '#22c55e' : '#ef4444'
  }

  function getDecisionColor(decision) {
    if (decision === 'Accepted') return '#22c55e'
    if (decision === 'Rejected') return '#ef4444'
    return '#eab308'
  }

  return (
    <div className="test-results-page">
      <div className="test-intro">
        <p className="eyebrow">PAYMENT TEST HISTORY</p>
        <h2>Test Results</h2>
        <p>
          Review previous PayPal currency tests, errors,
          AI explanations, and merchant decisions.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          className="primary-button"
          onClick={loadHistory}
          disabled={loading || detailLoading}
        >
          {loading ? 'Refreshing...' : '↻ Refresh History'}
        </button>
      </div>

      {error && (
        <div className="selection-panel">
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="selection-panel">
          <p>Loading saved test runs...</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="selection-panel">
          <h3>No Test History Yet</h3>
          <p>
            Run your first currency test. Its results will
            automatically appear here after being saved.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 0.8fr) minmax(0, 2fr)',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* SAVED RUNS */}
          <section className="selection-panel">
            <h3>Saved Test Runs</h3>

            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => loadRunDetails(run.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px',
                  marginTop: '12px',
                  borderRadius: '8px',
                  border: selectedRunId === run.id
                    ? '2px solid #2563eb'
                    : '1px solid #777',
                  background: selectedRunId === run.id
                    ? 'rgba(37, 99, 235, 0.10)'
                    : 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <strong>Test Run #{run.id}</strong>

                <p style={{ fontSize: '12px', opacity: 0.7 }}>
                  {formatDate(run.created_at)}
                </p>

                <p style={{ fontSize: '13px' }}>
                  {run.total_tests} tests · {run.passed} passed ·{' '}
                  {run.failed} failed
                </p>

                <strong>{run.success_rate}% success</strong>
              </button>
            ))}
          </section>

          {/* SELECTED RUN DETAILS */}
          <section className="selection-panel">
            <h3>
              {selectedRunId
                ? `Details — Test Run #${selectedRunId}`
                : 'Select a Test Run'}
            </h3>

            {detailLoading ? (
              <p>Loading run details...</p>
            ) : selectedRun ? (
              <>
                <p>
                  <strong>Date:</strong>{' '}
                  {formatDate(selectedRun.created_at)}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '10px',
                    margin: '18px 0',
                  }}
                >
                  <div className="stat-card">
                    <p>Total</p>
                    <h2>{selectedRun.total_tests}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Passed</p>
                    <h2 style={{ color: '#22c55e' }}>
                      {selectedRun.passed}
                    </h2>
                  </div>

                  <div className="stat-card">
                    <p>Failed</p>
                    <h2 style={{ color: '#ef4444' }}>
                      {selectedRun.failed}
                    </h2>
                  </div>

                  <div className="stat-card">
                    <p>Success Rate</p>
                    <h2>{selectedRun.success_rate}%</h2>
                  </div>
                </div>

                <h3 style={{ marginTop: '24px' }}>
                  Individual Test Results
                </h3>

                {results.length === 0 ? (
                  <p>No individual results were found for this run.</p>
                ) : (
                  results.map((result) => (
                    <div
                      key={result.id}
                      style={{
                        padding: '16px',
                        marginTop: '14px',
                        border: '1px solid #777',
                        borderRadius: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong>
                          {result.product} — {result.currency}
                        </strong>

                        <strong
                          style={{
                            color: getStatusColor(result.status),
                          }}
                        >
                          {result.status}
                        </strong>
                      </div>

                      <p>
                        <strong>Amount:</strong> {result.amount}{' '}
                        {result.currency}
                      </p>

                      <p>
                        <strong>Message:</strong>{' '}
                        {result.message || 'No message recorded'}
                      </p>

                      {result.order_id && (
                        <p>
                          <strong>PayPal Order ID:</strong>{' '}
                          {result.order_id}
                        </p>
                      )}

                      {result.issue && (
                        <p>
                          <strong>Error Code:</strong> {result.issue}
                        </p>
                      )}

                      {result.description && (
                        <p>
                          <strong>PayPal Explanation:</strong>{' '}
                          {result.description}
                        </p>
                      )}

                      {result.debug_id && (
                        <p>
                          <strong>Debug ID:</strong> {result.debug_id}
                        </p>
                      )}

                      <div
                        style={{
                          marginTop: '16px',
                          padding: '12px',
                          borderRadius: '8px',
                          background: 'rgba(100, 100, 100, 0.08)',
                        }}
                      >
                        <h4>AI Error Analysis</h4>

                        {result.ai_analysis ? (
                          <p
                            style={{
                              whiteSpace: 'pre-wrap',
                              lineHeight: '1.6',
                            }}
                          >
                            {result.ai_analysis}
                          </p>
                        ) : (
                          <p style={{ opacity: 0.7 }}>
                            No AI analysis has been saved for this result.
                            Generate an explanation from the Currency Tests
                            page to save it here.
                          </p>
                        )}

                        <p>
                          <strong>Merchant Decision:</strong>{' '}
                          <strong
                            style={{
                              color: getDecisionColor(
                                result.decision || 'Pending'
                              ),
                            }}
                          >
                            {result.decision || 'Pending'}
                          </strong>
                        </p>
                      </div>
                    </div>
                  ))
                )}

                <p
                  style={{
                    marginTop: '18px',
                    fontSize: '13px',
                    opacity: 0.75,
                  }}
                >
                  Note: PASS means PayPal successfully created the order.
                  It does not confirm buyer approval or payment capture.
                </p>
              </>
            ) : (
              <p>Select a saved run to inspect its results.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default TestResults
