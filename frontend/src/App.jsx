
import { useEffect, useState } from 'react'
import DemoStore from './components/DemoStore'
import CurrencyTests from './components/CurrencyTests'
import TestResults from './components/TestResults'
import './App.css'

const API_BASE = 'http://localhost:5000'

function StatusRow({ label, value, detail }) {
  const isConnected = [
    'online',
    'connected',
    'successful',
  ].includes(String(value).toLowerCase())

  return (
    <div className="recent-run">
      <div className="recent-run-info">
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>

      <span
        style={{
          color: isConnected ? '#16a34a' : '#dc2626',
          background: isConnected ? '#dcfce7' : '#fee2e2',
          padding: '7px 13px',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '13px',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  const [stats, setStats] = useState({
    totalTests: 0,
    passed: 0,
    failed: 0,
    successRate: 0,
  })

  const [recentRuns, setRecentRuns] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  const [settings, setSettings] = useState({
    backend: 'Checking...',
    database: 'Checking...',
    paypal: 'Checking...',
    authentication: 'Checking...',
    environment: 'Checking...',
  })

  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  const menuItems = [
    'Dashboard',
    'Demo Store',
    'Currency Tests',
    'Test Results',
    'Settings',
  ]

  function formatDate(dateString) {
    if (!dateString) return 'Date unavailable'

    const date = new Date(`${dateString.replace(' ', 'T')}Z`)

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function loadDashboard() {
    setDashboardLoading(true)
    setDashboardError('')

    try {
      const [statsResponse, historyResponse] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/stats`),
        fetch(`${API_BASE}/api/tests/history`),
      ])

      if (!statsResponse.ok || !historyResponse.ok) {
        throw new Error('Could not load dashboard data.')
      }

      const statsData = await statsResponse.json()
      const historyData = await historyResponse.json()

      const dashboardStats = statsData.stats || statsData

      setStats({
        totalTests: Number(dashboardStats.totalTests || 0),
        passed: Number(dashboardStats.passed || 0),
        failed: Number(dashboardStats.failed || 0),
        successRate: Number(dashboardStats.successRate || 0),
      })

      setRecentRuns(historyData.runs || [])
    } catch (error) {
      console.error('Dashboard loading error:', error)

      setDashboardError(
        'Unable to load dashboard data. Make sure the backend is running.'
      )
    } finally {
      setDashboardLoading(false)
    }
  }

  // Fetch live backend, database and PayPal statuses
  async function loadSettings() {
    setSettingsLoading(true)
    setSettingsError('')

    try {
      const [healthResponse, paypalResponse] = await Promise.all([
        fetch(`${API_BASE}/api/health`),
        fetch(`${API_BASE}/api/paypal/test`),
      ])

      if (!healthResponse.ok || !paypalResponse.ok) {
        throw new Error('Unable to retrieve connection statuses.')
      }

      const healthData = await healthResponse.json()
      const paypalData = await paypalResponse.json()

      setSettings({
        backend: healthData.backend || 'Unknown',
        database: healthData.database || 'Unknown',
        paypal: paypalData.paypal || 'Unknown',
        authentication: paypalData.authentication || 'Unknown',
        environment: paypalData.environment || 'Unknown',
      })
    } catch (error) {
      console.error('Settings loading error:', error)
      setSettingsError(
        'Could not fetch connection statuses. Check that the backend is running.'
      )

      setSettings({
        backend: 'Unavailable',
        database: 'Unavailable',
        paypal: 'Unavailable',
        authentication: 'Unavailable',
        environment: 'Unknown',
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    if (activePage === 'Dashboard') {
      loadDashboard()
    }

    if (activePage === 'Settings') {
      loadSettings()
    }
  }, [activePage])

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Everyone Can Pay</h2>
          <p>PayPal Compatibility Testing</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item}
              className={`nav-item ${
                activePage === item ? 'active' : ''
              }`}
              onClick={() => setActivePage(item)}
            >
              {item === 'Dashboard' && '▦'}
              {item === 'Demo Store' && '🛍️'}
              {item === 'Currency Tests' && '🌐'}
              {item === 'Test Results' && '📊'}
              {item === 'Settings' && '⚙️'}

              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Everyone Can Pay</p>
          <small>PayPal Sandbox Environment</small>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>

            <p>
              {activePage === 'Dashboard' &&
                'Overview of your PayPal compatibility tests'}

              {activePage === 'Demo Store' &&
                'Test the PayPal checkout experience'}

              {activePage === 'Currency Tests' &&
                'Test payment compatibility across currencies'}

              {activePage === 'Test Results' &&
                'View your saved test runs and detailed results'}

              {activePage === 'Settings' &&
                'Application configuration and connection status'}
            </p>
          </div>

          <div className="topbar-status">
            <span className="status-dot"></span>
            Sandbox Mode
          </div>
        </header>

        <div className="content-area">

          {/* DASHBOARD */}
          {activePage === 'Dashboard' && (
            <section className="dashboard">
              <div className="dashboard-heading">
                <div>
                  <h2>Dashboard Overview</h2>
                  <p>
                    Monitor your payment compatibility testing activity.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={loadDashboard}
                  disabled={dashboardLoading}
                >
                  {dashboardLoading ? 'Refreshing...' : '↻ Refresh'}
                </button>
              </div>

              {dashboardError && (
                <div className="error-message">
                  {dashboardError}
                </div>
              )}

              <div className="stats-grid">
                <div className="stat-card">
                  <p>Total Tests</p>
                  <h2>
                    {dashboardLoading ? '...' : stats.totalTests}
                  </h2>
                  <small>All saved test runs</small>
                </div>

                <div className="stat-card">
                  <p>Passed</p>
                  <h2 className="pass-text">
                    {dashboardLoading ? '...' : stats.passed}
                  </h2>
                  <small>Successful PayPal order creations</small>
                </div>

                <div className="stat-card">
                  <p>Failed</p>
                  <h2 className="fail-text">
                    {dashboardLoading ? '...' : stats.failed}
                  </h2>
                  <small>Unsuccessful order creations</small>
                </div>

                <div className="stat-card">
                  <p>Success Rate</p>
                  <h2>
                    {dashboardLoading
                      ? '...'
                      : `${Number(stats.successRate).toFixed(1)}%`}
                  </h2>
                  <small>Based on all saved tests</small>
                </div>
              </div>

              <div className="recent-runs">
                <div className="recent-runs-header">
                  <div>
                    <h2>Recent Test Runs</h2>
                    <p>Your latest saved currency test sessions.</p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => setActivePage('Test Results')}
                  >
                    View All →
                  </button>
                </div>

                {dashboardLoading ? (
                  <p>Loading recent test runs...</p>
                ) : recentRuns.length === 0 ? (
                  <div className="empty-state">
                    <h3>No test runs yet</h3>
                    <p>
                      Run your first currency test to see results here.
                    </p>

                    <button
                      className="primary-button"
                      onClick={() => setActivePage('Currency Tests')}
                    >
                      Start Testing
                    </button>
                  </div>
                ) : (
                  <div className="recent-runs-list">
                    {recentRuns.slice(0, 5).map((run) => (
                      <div className="recent-run" key={run.id}>
                        <div className="recent-run-info">
                          <strong>Test Run #{run.id}</strong>
                          <small>{formatDate(run.created_at)}</small>
                        </div>

                        <div className="recent-run-stats">
                          <span>{run.total_tests} Tests</span>
                          <span className="pass-text">
                            {run.passed} Passed
                          </span>
                          <span className="fail-text">
                            {run.failed} Failed
                          </span>
                          <strong>
                            {Number(run.success_rate).toFixed(1)}%
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* DEMO STORE */}
          {activePage === 'Demo Store' && <DemoStore />}

          {/* CURRENCY TESTS */}
          {activePage === 'Currency Tests' && <CurrencyTests />}

          {/* TEST RESULTS */}
          {activePage === 'Test Results' && <TestResults />}

          {/* SETTINGS */}
          {activePage === 'Settings' && (
            <section className="settings-page">
              <div className="dashboard-heading">
                <div>
                  <h2>System Configuration</h2>
                  <p>
                    Live connection status of your application components.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={loadSettings}
                  disabled={settingsLoading}
                >
                  {settingsLoading ? 'Checking...' : '↻ Check Status'}
                </button>
              </div>

              {settingsError && (
                <div className="error-message">
                  {settingsError}
                </div>
              )}

              <div className="selection-panel">
                <h3>Connection Status</h3>

                <StatusRow
                  label="Backend Server"
                  value={settings.backend}
                  detail="Node.js and Express API"
                />

                <StatusRow
                  label="Database"
                  value={settings.database}
                  detail="SQLite local database"
                />

                <StatusRow
                  label="PayPal"
                  value={settings.paypal}
                  detail="PayPal Sandbox connection"
                />

                <StatusRow
                  label="Authentication"
                  value={settings.authentication}
                  detail="PayPal API authentication"
                />
              </div>

              <div className="selection-panel">
                <h3>Environment Information</h3>

                <div className="recent-run">
                  <div className="recent-run-info">
                    <strong>Payment Environment</strong>
                    <small>Current PayPal configuration</small>
                  </div>

                  <strong>{settings.environment}</strong>
                </div>

                <div className="recent-run">
                  <div className="recent-run-info">
                    <strong>Frontend</strong>
                    <small>React + Vite</small>
                  </div>

                  <strong>Active</strong>
                </div>

                <div className="recent-run">
                  <div className="recent-run-info">
                    <strong>Backend URL</strong>
                    <small>API endpoint</small>
                  </div>

                  <strong>localhost:5000</strong>
                </div>

                <div className="recent-run">
                  <div className="recent-run-info">
                    <strong>Database</strong>
                    <small>Persistent test history</small>
                  </div>

                  <strong>SQLite</strong>
                </div>
              </div>

              <p style={{ color: '#64748b', marginTop: '20px' }}>
                Everyone Can Pay — PayPal Compatibility Testing Platform
              </p>
            </section>
          )}

        </div>
      </main>
    </div>
  )
}

export default App
