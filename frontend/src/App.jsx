import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Income } from './pages/Income';
import { Expenses } from './pages/Expenses';
import { Accounts } from './pages/Accounts';
import { Budgets } from './pages/Budgets';
import { Clients } from './pages/Clients';
import { Projects } from './pages/Projects';
import { Invoices } from './pages/Invoices';
import { Subscriptions } from './pages/Subscriptions';
import { Taxes } from './pages/Taxes';
import { Savings } from './pages/Savings';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { SecurityPolicy } from './pages/SecurityPolicy';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner text="Checking authentication session..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Legal & Compliance Routes (Always Accessible) */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/security" element={<SecurityPolicy />} />

      {/* Authenticated Application Routes */}
      {user ? (
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="income" element={<Income />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="clients" element={<Clients />} />
          <Route path="projects" element={<Projects />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="taxes" element={<Taxes />} />
          <Route path="savings" element={<Savings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<LoginPage />} />
      )}
    </Routes>
  );
}
