# Cashly - Personal Finance App

A modern personal finance application built with React 19, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Authentication** - Secure login and registration with JWT
- 💳 **Account Management** - Connect bank accounts via Plaid
- 📊 **Transaction Tracking** - View and categorize your transactions
- 🎯 **Savings Goals** - Set and track financial goals
- 💰 **Subscription Management** - Stripe-powered subscription handling
- 🔔 **Notifications** - Stay updated on your finances
- 📱 **Responsive Design** - Beautiful UI that works on all devices

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **API Client**: Axios
- **UI Components**: Shadcn UI
- **Charts**: Recharts
- **Payments**: Stripe.js
- **Banking**: Plaid Link

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (Django + DRF)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cashly
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_PLAID_ENV=sandbox
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Shadcn UI components
│   ├── AppSidebar.tsx
│   └── Header.tsx
├── pages/           # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Accounts.tsx
│   └── ...
├── layouts/         # Layout components
│   ├── ProtectedLayout.tsx
│   └── AuthLayout.tsx
├── services/        # API service layer
│   ├── authService.ts
│   ├── accountService.ts
│   └── ...
├── store/           # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── lib/             # Utility functions and configs
│   ├── axios.ts
│   ├── queryClient.ts
│   └── utils.ts
└── App.tsx          # Main app component
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `VITE_PLAID_ENV` | Plaid environment | `sandbox`, `development`, or `production` |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The app connects to a Django backend with the following endpoints:

- **Auth**: `/auth/login`, `/auth/register`, `/auth/profile`
- **Accounts**: `/accounts/` (Plaid integration)
- **Transactions**: `/transactions/transactions/`
- **Goals**: `/goals/`
- **Subscriptions**: `/subscriptions/` (Stripe integration)
- **Notifications**: `/notifications/`
- **Dashboard**: `/dashboard/`

## Features Overview

### Authentication
- Secure JWT-based authentication
- Automatic token refresh
- Protected routes

### Account Management
- Connect bank accounts via Plaid Link
- View account balances
- Sync transactions
- Transfer between accounts

### Transaction Management
- View all transactions
- Filter by date, category, merchant
- Categorize transactions
- Spending analytics

### Savings Goals
- Create and track goals
- Visual progress tracking
- Contribution management
- Goal forecasting

### Subscription Management
- Stripe Checkout integration
- Multiple pricing tiers
- Subscription management
- Cancellation handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and confidential.
