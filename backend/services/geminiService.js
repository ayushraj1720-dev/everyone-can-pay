
const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

async function analyzePayPalError(errorData) {
  const { issue, currency, description, product, amount } = errorData

  // Fallback when Gemini quota is unavailable
  if (issue === 'CURRENCY_NOT_SUPPORTED') {
    return `Cause:
PayPal does not currently support ${currency} for this attempted operation.

Impact:
The order for ${product} (${amount} ${currency}) could not be created.

Suggested action:
Test with another supported currency, such as USD. Verify PayPal's supported currency list before enabling a currency in your store.

PayPal error:
${description}

Note:
This is a predefined fallback explanation, not a live AI analysis.`
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Explain this PayPal error simply and suggest safe fixes.
Product: ${product}
Currency: ${currency}
Amount: ${amount}
Error: ${issue}
Description: ${description}`
    })

    return response.text
  } catch (err) {
    const message = err.message || ''

    if (err.status === 429 || message.includes('429')) {
      return `Gemini daily quota exhausted. Please try again later.

Error: ${issue}
Description: ${description}

PayPal test result is unaffected.`
    }

    throw err
  }
}

module.exports = { analyzePayPalError }
