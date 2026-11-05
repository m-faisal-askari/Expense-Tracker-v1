import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, Landmark, CreditCard, DollarSign, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Accounts() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: activeCurrency, convert } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [form, setForm] = useState({
    name: '',
    account_type: 'BANK',
    currency: 'PKR',
    opening_balance: '0.00',
    notes: ''
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  });

  const createAccountMutation = useMutation({
    mutationFn: (newAccount) => api.post('/accounts', newAccount),
    onSuccess: (created) => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsModalOpen(false);
      setForm({ name: '', account_type: 'BANK', currency: 'PKR', opening_balance: '0.00', notes: '' });
      showSuccess(`Account "${created.name}" created successfully.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not create account');
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/accounts/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsEditModalOpen(false);
      setSelectedAccount(null);
      showSuccess(`Account "${updated.name}" updated successfully.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not update account');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      showSuccess('Account deleted.');
    },
    onError: (err) => {
      showError(err.message, 'Could not delete account');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createAccountMutation.mutate({
      ...form,
      opening_balance: parseFloat(form.opening_balance || 0)
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    updateAccountMutation.mutate({
      id: selectedAccount.id,
      data: {
        name: form.name,
        account_type: form.account_type,
        notes: form.notes
      }
    });
  };

  const openEditModal = (acc) => {
    setSelectedAccount(acc);
    setForm({
      name: acc.name,
      account_type: acc.account_type,
      currency: acc.currency,
      opening_balance: acc.opening_balance,
      notes: acc.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'BANK': return Landmark;
      case 'DIGITAL_WALLET': return CreditCard;
      case 'SAVINGS': return Wallet;
      default: return DollarSign;
    }
  };

  const totalBalance = (accounts || [])
    .filter(a => !a.is_archived)
    .reduce((sum, a) => sum + convert(a.current_balance, a.currency), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Financial Accounts</h2>
          <p className="text-xs sm:text-sm text-slate-500">Manage bank accounts, digital wallets, cash balances, and liquid reserves</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-3.5 py-1.5 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Liquidity ({activeCurrency})</span>
            <span className="text-sm font-bold text-slate-900">{formatCurrency(totalBalance, activeCurrency)}</span>
          </div>

          <button
            onClick={() => {
              setForm({ name: '', account_type: 'BANK', currency: 'PKR', opening_balance: '0.00', notes: '' });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading accounts..." />
      ) : !accounts || accounts.length === 0 ? (
        <EmptyState
          title="No financial accounts"
          description="Create your first bank account or digital wallet to track balances and transactions."
          actionLabel="Add Account"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const Icon = getAccountIcon(acc.account_type);
            return (
              <div
                key={acc.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-shadow hover:shadow ${
                  acc.is_archived ? 'border-slate-200 bg-slate-50/50 opacity-75' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{acc.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{acc.account_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="text-slate-400 hover:text-indigo-600 transition p-1"
                      title="Edit Account"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Archive or delete account "${acc.name}"?`)) {
                          deleteAccountMutation.mutate(acc.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Archive/Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Current Balance</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-slate-900">{formatCurrency(acc.current_balance, acc.currency)}</span>
                      {acc.currency !== activeCurrency && (
                        <span className="text-xs font-semibold text-indigo-600">
                          ≈ {formatCurrency(convert(acc.current_balance, acc.currency), activeCurrency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Opening Balance</span>
                    <span className="text-xs text-slate-500 font-semibold">{formatCurrency(acc.opening_balance, acc.currency)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Financial Account">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Meezan Bank, HBL, PayPal, Standard Chartered"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account Type</label>
              <select
                value={form.account_type}
                onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="BANK">Bank Account</option>
                <option value="DIGITAL_WALLET">Digital Wallet (Wise, Payoneer, Nayapay, Sadapay)</option>
                <option value="SAVINGS">Savings Account</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CASH">Cash in Hand</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="PKR">PKR - Pakistani Rupee (Rs.)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="CAD">CAD - Canadian Dollar ($)</option>
                <option value="AUD">AUD - Australian Dollar ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Opening Balance</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={form.opening_balance}
              onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">Balance at the time you begin tracking</p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAccountMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createAccountMutation.isPending ? 'Saving...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Account: ${selectedAccount?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Account Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Account Type</label>
            <select
              value={form.account_type}
              onChange={(e) => setForm({ ...form, account_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="BANK">Bank Account</option>
              <option value="DIGITAL_WALLET">Digital Wallet (Wise, Payoneer, Nayapay, Sadapay)</option>
              <option value="SAVINGS">Savings Account</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CASH">Cash in Hand</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Description</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateAccountMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateAccountMutation.isPending ? 'Saving...' : 'Update Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
