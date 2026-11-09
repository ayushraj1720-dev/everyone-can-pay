# Everyone Can Pay 💳

### AI-Powered PayPal Payment Compatibility Testing Platform

**Everyone Can Pay** is a web-based platform that helps developers and businesses test PayPal payment compatibility across multiple currencies, understand payment errors through AI-assisted analysis, and track testing results.

Built for the **PayPal AI Hackathon 2026**.

---

## 🚨 The Problem

Businesses integrating international payments often encounter:
- Unsupported currencies.
- Payment creation failures.
- Difficult-to-understand API error messages.
- Time-consuming manual debugging.
- Lack of centralized payment compatibility testing.

Understanding why a payment fails and what to do next can be challenging for developers.

## 💡 Our Solution

Everyone Can Pay provides a centralized testing environment that combines PayPal Sandbox integration, AI-assisted error explanations, and historical test tracking.

Developers can test different currencies, identify compatibility issues, understand errors, and make informed decisions from one dashboard.

## ✨ Key Features

### 1. PayPal Sandbox Integration
- Connects to the PayPal Sandbox REST API.
- Creates PayPal payment orders.
- Demonstrates buyer approval and payment capture through the Demo Store.
- Displays actual PayPal API responses.

### 2. Multi-Currency Compatibility Testing
- Tests payment order creation across multiple currencies.
- Supports test scenarios involving USD, EUR, GBP, JPY, INR, HUF, TWD, and BRL.
- Identifies successful and failed order creation attempts.
- Displays relevant PayPal error codes.

### 3. AI-Assisted Error Analysis
- Integrates Google Gemini API for payment error explanations.
- Provides understandable explanations of technical payment errors.
- Offers predefined fallback explanations when the AI API is unavailable.
- Allows users to accept or reject suggested explanations.

### 4. Interactive Dashboard
- Displays total test runs.
- Shows successful and failed tests.
- Calculates test success rate.
- Provides an overview of payment testing activity.

### 5. Test History
- Stores test runs and results using SQLite.
- Maintains historical test records.
- Saves error explanations and user decisions.
- Allows users to review previous testing activity.

### 6. Settings and Connection Status
- Displays backend status.
- Checks database connectivity.
- Checks PayPal authentication and Sandbox connection status.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Styling | CSS |
| Backend | Node.js, Express.js |
| Payment Integration | PayPal Sandbox REST API |
| AI Integration | Google Gemini API |
| Database | SQLite, better-sqlite3 |
| Version Control | Git and GitHub |

---

## 🏗️ Project Architecture

```text
Everyone Can Pay
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CurrencyTests.jsx
│   │   │   ├── DemoStore.jsx
│   │   │   └── TestResults.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── services/
│   │   ├── geminiService.js
│   │   └── paypalService.js
│   ├── data/
│   ├── database.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

- Node.js and npm
- Git
- PayPal Developer account
- PayPal Sandbox application credentials
- Google Gemini API key (optional; fallback explanations are available)

### 1. Clone the Repository

```bash
git clone https://github.com/ayushraj1720-dev/everyone-can-pay.git
cd everyone-can-pay
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a file named `.env` inside the `backend` directory.

Use `.env.example` as a reference and add your own credentials:

```env
PORT=5000

PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_SANDBOX_CLIENT_SECRET
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

**Important:** Never share or commit your actual `.env` file or API credentials.

### 3. Start the Backend

From the backend directory, run:

```bash
node server.js
```

The backend will run at:

`http://localhost:5000`

### 4. Start the Frontend

Open a second terminal in the project directory and run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL provided by Vite, normally:

`http://localhost:5173`

Keep both frontend and backend terminals running.

---

## 🧪 How to Use

1. Open the Dashboard to view testing statistics.
2. Navigate to Demo Store to test PayPal Sandbox checkout.
3. Navigate to Currency Tests to execute multi-currency order creation tests.
4. Review successful and failed test results.
5. Use Explain Error to understand payment failures.
6. Accept or reject the suggested explanation.
7. Visit Test Results to review saved test history.
8. Open Settings to check backend, database, and PayPal connectivity.

---

## 📊 Understanding Test Results

A successful currency compatibility test indicates that PayPal successfully created the payment order.

It does **not** necessarily mean that the buyer approved or completed the payment.

Buyer approval and payment capture are demonstrated separately through the Demo Store.

The application uses PayPal Sandbox, so transactions are for testing purposes and do not represent real payments.

---

## 🔐 Security

- PayPal Sandbox credentials should be used for testing.
- API secrets must be stored in environment variables.
- Actual `.env` files and local database files are excluded through `.gitignore`.
- Never publish private API keys or credentials.

Additional validation and security hardening are necessary before production deployment.

---

## 🔮 Future Scope

- Support for additional payment providers.
- Expanded currency and payment-method compatibility testing.
- More advanced AI-powered error diagnosis.
- Automated payment compatibility recommendations.
- Enhanced analytics and reporting.
- Production-ready deployment and security improvements.

---

## 👨‍💻 Developer

**Ayush Raj**

B.Tech Computer Science and Engineering

GitHub: [@ayushraj1720-dev](https://github.com/ayushraj1720-dev)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

**Everyone Can Pay — Making payment compatibility testing easier, clearer, and smarter.**
