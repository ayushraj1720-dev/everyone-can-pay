
require('dotenv').config()

const express = require('express')
const cors = require('cors')

const {
  getAccessToken,
  createPayPalOrder,
  capturePayPalOrder
} = require('./services/paypalService')

const {
  analyzePayPalError
} = require('./services/geminiService')

const db = require('./database')

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174'
  ]
}))

app.use(express.json())

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    app: 'Everyone Can Pay',
    backend: 'online',
    database: 'connected'
  })
})

// PAYPAL AUTHENTICATION
app.get('/api/paypal/test', async (req, res) => {
  try {
    await getAccessToken()

    res.json({
      success: true,
      paypal: 'connected',
      authentication: 'successful',
      environment: 'sandbox'
    })
  } catch (error) {
    console.error('PayPal authentication failed:', error.message)

    res.status(500).json({
      success: false,
      paypal: 'connection failed',
      message: error.message
    })
  }
})

// PAYPAL CLIENT CONFIG
app.get('/api/paypal/client-config', (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID

  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: 'PayPal Client ID is missing'
    })
  }

  res.json({
    success: true,
    clientId,
    currency: 'USD'
  })
})

// CREATE PAYPAL ORDER
app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required'
      })
    }

    const result = await createPayPalOrder(amount, currency)

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('PayPal order creation failed:', error.message)

    res.status(error.httpStatus || 500).json({
      success: false,
      message: 'PayPal order creation failed',
      issue: error.issue || 'UNKNOWN_ERROR',
      description: error.description || error.message,
      debugId: error.debugId || null
    })
  }
})

// CAPTURE PAYMENT
app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid PayPal order ID is required'
      })
    }

    const result = await capturePayPalOrder(orderId)

    res.json({
      success: true,
      message: 'PayPal payment captured successfully',
      orderId: result.id,
      status: result.status
    })
  } catch (error) {
    console.error('PayPal capture failed:', error.message)

    res.status(error.httpStatus || 500).json({
      success: false,
      message: 'PayPal payment capture failed',
      issue: error.issue || 'UNKNOWN_ERROR',
      description: error.description || error.message,
      debugId: error.debugId || null
    })
  }
})

// GEMINI AI ANALYSIS
app.post('/api/ai/analyze-error', async (req, res) => {
  try {
    const {
      product,
      currency,
      amount,
      issue,
      description
    } = req.body

    if (!product || !currency || !amount || !issue || !description) {
      return res.status(400).json({
        success: false,
        message: 'All error details are required'
      })
    }

    const analysis = await analyzePayPalError({
      product,
      currency,
      amount,
      issue,
      description
    })

    res.json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error('AI analysis failed:', error.message)

    const statusCode = [429, 503].includes(error.statusCode)
      ? error.statusCode
      : 500

    res.status(statusCode).json({
      success: false,
      message: error.publicMessage ||
        'AI analysis failed. Your PayPal test result is unaffected.',
      errorCode: statusCode
    })
  }
})

// SAVE A COMPLETE TEST RUN
app.post('/api/tests/save', (req, res) => {
  try {
    const { results } = req.body

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Test results are required'
      })
    }

    const allowedStatuses = ['PASS', 'FAIL']

    for (const result of results) {
      if (
        !result.product ||
        !result.currency ||
        !allowedStatuses.includes(result.status)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid test result data'
        })
      }
    }

    const passed = results.filter(
      item => item.status === 'PASS'
    ).length

    const failed = results.length - passed

    const successRate = Number(
      ((passed / results.length) * 100).toFixed(1)
    )

    const saveRun = db.transaction(() => {
      const run = db.prepare(`
        INSERT INTO test_runs
        (total_tests, passed, failed, success_rate)
        VALUES (?, ?, ?, ?)
      `).run(
        results.length,
        passed,
        failed,
        successRate
      )

      const runId = run.lastInsertRowid

      const insertResult = db.prepare(`
        INSERT INTO test_results
        (
          run_id, product, currency, amount,
          status, order_id, message, issue,
          description, debug_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const item of results) {
        insertResult.run(
          runId,
          item.product,
          item.currency,
          item.amount || '',
          item.status,
          item.orderId || null,
          item.message || '',
          item.issue || null,
          item.description || null,
          item.debugId || null
        )
      }

      return runId
    })

    const runId = saveRun()

    res.status(201).json({
      success: true,
      message: 'Test results saved successfully',
      runId,
      total: results.length,
      passed,
      failed,
      successRate
    })
  } catch (error) {
    console.error('Saving test results failed:', error.message)

    res.status(500).json({
      success: false,
      message: 'Could not save test results'
    })
  }
})

// GET ALL TEST RUNS
app.get('/api/tests/history', (req, res) => {
  try {
    const runs = db.prepare(`
      SELECT * FROM test_runs
      ORDER BY id DESC
    `).all()

    res.json({
      success: true,
      runs
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not retrieve test history'
    })
  }
})

// GET INDIVIDUAL RESULTS FOR A RUN
app.get('/api/tests/history/:id', (req, res) => {
  try {
    const runId = Number(req.params.id)

    if (!Number.isInteger(runId) || runId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test run ID'
      })
    }

    const run = db.prepare(`
      SELECT * FROM test_runs WHERE id = ?
    `).get(runId)

    if (!run) {
      return res.status(404).json({
        success: false,
        message: 'Test run not found'
      })
    }

    const results = db.prepare(`
      SELECT * FROM test_results
      WHERE run_id = ?
      ORDER BY id
    `).all(runId)

    res.json({
      success: true,
      run,
      results
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not retrieve test results'
    })
  }
})

// SAVE AI ANALYSIS AND MERCHANT DECISION
app.patch('/api/tests/results/:id', (req, res) => {
  try {
    const resultId = Number(req.params.id)
    const { aiAnalysis, decision } = req.body

    if (!Number.isInteger(resultId) || resultId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result ID'
      })
    }

    if (
      decision !== undefined &&
      !['Pending', 'Accepted', 'Rejected'].includes(decision)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision'
      })
    }

    const existing = db.prepare(`
      SELECT id FROM test_results WHERE id = ?
    `).get(resultId)

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Test result not found'
      })
    }

    if (
      aiAnalysis !== undefined &&
      typeof aiAnalysis !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid AI analysis'
      })
    }

    db.prepare(`
      UPDATE test_results
      SET
        ai_analysis = COALESCE(?, ai_analysis),
        decision = COALESCE(?, decision)
      WHERE id = ?
    `).run(
      aiAnalysis === undefined ? null : aiAnalysis,
      decision === undefined ? null : decision,
      resultId
    )

    res.json({
      success: true,
      message: 'Test result updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not update test result'
    })
  }
})

// DASHBOARD STATISTICS
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) AS totalRuns,
        COALESCE(SUM(total_tests), 0) AS totalTests,
        COALESCE(SUM(passed), 0) AS passed,
        COALESCE(SUM(failed), 0) AS failed
      FROM test_runs
    `).get()

    const successRate = stats.totalTests > 0
      ? Number(
          ((stats.passed / stats.totalTests) * 100).toFixed(1)
        )
      : 0

    res.json({
      success: true,
      ...stats,
      successRate
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not retrieve dashboard statistics'
    })
  }
})

// START SERVER
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
