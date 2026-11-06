import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: { get: vi.fn() },
}));

vi.mock('../contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'USD',
    setCurrency: vi.fn(),
    supportedCurrencies: [{ code: 'USD', symbol: '$', label: 'USD (US Dollar)' }],
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  AreaChart: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
}));

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return queryClient;
}

describe('Dashboard loading states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows each section as its data arrives without blocking the dashboard', async () => {
    const summary = deferred();
    const charts = deferred();
    const upcoming = deferred();
    const recentTransactions = deferred();

    api.get.mockImplementation((endpoint) => {
      const requests = {
        '/dashboard/summary': summary.promise,
        '/dashboard/charts': charts.promise,
        '/dashboard/upcoming': upcoming.promise,
        '/transactions': recentTransactions.promise,
      };
      return requests[endpoint];
    });

    const queryClient = renderDashboard();

    expect(screen.getByText('Financial Overview')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading financial metrics' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading cash flow chart' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading expense categories' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading upcoming obligations' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading recent transactions' })).toBeInTheDocument();

    await act(async () => {
      summary.resolve({
        currency: 'USD',
        gross_income: 110,
        net_received_income: 100,
        total_expenses: 25,
        net_cash_flow: 75,
        business_profit: 80,
        personal_expenses: 5,
        total_account_balance: 200,
        outstanding_invoices: 30,
        estimated_tax_reserve: 20,
      });
    });

    await waitFor(() => expect(screen.getByText('$100.00')).toBeInTheDocument());
    expect(screen.queryByRole('status', { name: 'Loading financial metrics' })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading cash flow chart' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading upcoming obligations' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading recent transactions' })).toBeInTheDocument();

    await act(async () => {
      upcoming.resolve({
        upcoming_invoices: [{
          id: 'invoice-1',
          invoice_number: 'INV-100',
          client_name: 'Acme',
          amount: 30,
          currency: 'USD',
          due_date: '2026-11-20',
          status: 'SENT',
        }],
        upcoming_subscriptions: [],
      });
      recentTransactions.resolve([{
        id: 'transaction-1',
        type: 'EXPENSE',
        description: 'Office supplies',
        date: '2026-11-01',
        amount: 12,
        currency: 'USD',
        account_name: 'Checking',
        category_name: 'Office',
      }]);
    });

    expect(await screen.findByText('Invoice #INV-100')).toBeInTheDocument();
    expect(await screen.findByText('Office supplies')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading upcoming obligations' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading recent transactions' })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading cash flow chart' })).toBeInTheDocument();

    await act(async () => {
      charts.resolve({
        monthly_trends: [{ month: 'Nov 2026', income: 100, expenses: 25, profit: 75, net_cash_flow: 75 }],
        category_distribution: [{ name: 'Software', value: 25 }],
      });
    });

    expect(await screen.findByText('Software')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading cash flow chart' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading expense categories' })).not.toBeInTheDocument();

    queryClient.clear();
  });
});
