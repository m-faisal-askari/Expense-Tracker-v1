import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingDown, Briefcase, User, ShieldCheck, Plus, Trash2, Pencil } from 'lucide-react';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Expenses() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: defaultCurrency, convert } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    currency: defaultCurrency || 'PKR',
    description: '',
    date: new Date().toISOString().split('T')[0],
    source_account_id: '',
    category_id: '',
    is_business: true,
    is_tax_deductible: true,
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    amount: '',
    currency: 'PKR',
    description: '',
    date: new Date().toISOString().split('T')[0],
    source_account_id: '',
    category_id: '',
    is_business: true,
    is_tax_deductible: true,
    notes: ''
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['expenseTransactions'],
    queryFn: () => api.get('/transactions', { type: 'EXPENSE' }),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const expenseCategories = categories?.filter(c => c.type === 'EXPENSE') || [];

  const createExpenseMutation = useMutation({
    mutationFn: (newTx) => api.post('/transactions', {
      ...newTx,
      type: 'EXPENSE',
      amount: parseFloat(newTx.amount)
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['expenseTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsModalOpen(false);
      setForm({
        amount: '',
        currency: defaultCurrency || 'PKR',
        description: '',
        date: new Date().toISOString().split('T')[0],
        source_account_id: accounts?.[0]?.id || '',
        category_id: '',
        is_business: true,
        is_tax_deductible: true,
        notes: ''
      });
      showSuccess(`Expense "${res.description}" recorded.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not save expense');
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/transactions/${id}`, {
      ...data,
      type: 'EXPENSE',
      amount: parseFloat(data.amount)
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['expenseTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsEditModalOpen(false);
      showSuccess(`Expense "${res.description}" updated.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not update expense');
    }
  });

  const deleteTxMutation = useMutation({
    mutationFn: (txId) => api.delete(`/transactions/${txId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      showSuccess('Expense record deleted.');
    },
    onError: (err) => {
      showError(err.message, 'Could not delete expense');
    }
  });

  const handleOpenEdit = (tx) => {
    setEditForm({
      id: tx.id,
      amount: tx.amount,
      currency: tx.currency || 'USD',
      description: tx.description || '',
      date: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
      source_account_id: tx.source_account_id || '',
      category_id: tx.category_id || '',
      is_business: !!tx.is_business,
      is_tax_deductible: !!tx.is_tax_deductible,
      notes: tx.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const txs = transactions || [];
  const totalExpenses = txs.reduce((sum, t) => sum + convert(parseFloat(t.amount || 0), t.currency), 0);
  const businessExpenses = txs.filter(t => t.is_business).reduce((sum, t) => sum + convert(parseFloat(t.amount || 0), t.currency), 0);
  const personalExpenses = txs.filter(t => !t.is_business).reduce((sum, t) => sum + convert(parseFloat(t.amount || 0), t.currency), 0);
  const deductibleExpenses = txs.filter(t => t.is_business && t.is_tax_deductible).reduce((sum, t) => sum + convert(parseFloat(t.amount || 0), t.currency), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Expense Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">Track and categorize operating expenses, equipment, and deductible costs in {defaultCurrency}</p>
        </div>

        <button
          onClick={() => {
            if (accounts?.length && !form.source_account_id) {
              setForm(prev => ({ ...prev, source_account_id: accounts[0].id }));
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Outflows"
          amount={totalExpenses}
          currency={defaultCurrency}
          icon={TrendingDown}
          color="rose"
          subtitle={`All confirmed spending in ${defaultCurrency}`}
        />
        <MetricCard
          title="Business Expenses"
          amount={businessExpenses}
          currency={defaultCurrency}
          icon={Briefcase}
          color="indigo"
          subtitle="Operating overhead & tools"
        />
        <MetricCard
          title="Personal Spending"
          amount={personalExpenses}
          currency={defaultCurrency}
          icon={User}
          color="amber"
          subtitle="Living & personal costs"
        />
        <MetricCard
          title="Tax Deductible"
          amount={deductibleExpenses}
          currency={defaultCurrency}
          icon={ShieldCheck}
          color="emerald"
          subtitle="Qualifies for tax write-off"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading expense records..." />
      ) : txs.length === 0 ? (
        <EmptyState
          title="No expenses recorded yet"
          description="Log software subscriptions, office supplies, hardware purchases, or business travel."
          actionLabel="Add Expense"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Account Paid From</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Tax Treatment</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {txs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{tx.description}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.category_name || 'Expense'}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.account_name || 'Account'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        tx.is_business ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {tx.is_business ? 'Business' : 'Personal'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.is_business ? (
                        <span className={`text-[10px] font-medium ${
                          tx.is_tax_deductible ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {tx.is_tax_deductible ? '● Deductible' : '○ Non-deductible'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900 font-mono">
                      -{formatCurrency(tx.amount, tx.currency)}
                      {tx.currency !== defaultCurrency && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          ≈ -{formatCurrency(convert(tx.amount, tx.currency), defaultCurrency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="text-slate-400 hover:text-indigo-600 transition p-1"
                          title="Edit Expense"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this expense? Account balance will be restored.')) {
                              deleteTxMutation.mutate(tx.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Business / Personal Expense">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createExpenseMutation.mutate(form);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Expense Amount</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold"
              >
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Figma subscription, GitHub Copilot, Ergonomic chair"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account Paid From</label>
              <select
                value={form.source_account_id}
                onChange={(e) => setForm({ ...form, source_account_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">Select Account...</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="">Default Expense</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_business}
                onChange={(e) => setForm({ ...form, is_business: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-slate-700 font-medium">Business Expense</span>
            </label>

            {form.is_business && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_tax_deductible}
                  onChange={(e) => setForm({ ...form, is_tax_deductible: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Tax Deductible</span>
              </label>
            )}
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
              disabled={createExpenseMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createExpenseMutation.isPending ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Expense Record">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateExpenseMutation.mutate({
              id: editForm.id,
              data: {
                ...editForm,
                source_account_id: editForm.source_account_id || null,
                category_id: editForm.category_id || null,
              }
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Expense Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={editForm.currency}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold"
              >
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account Paid From</label>
              <select
                value={editForm.source_account_id}
                onChange={(e) => setEditForm({ ...editForm, source_account_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">Select Account...</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={editForm.category_id}
              onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="">Default Expense</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.is_business}
                onChange={(e) => setEditForm({ ...editForm, is_business: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-slate-700 font-medium">Business Expense</span>
            </label>

            {editForm.is_business && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_tax_deductible}
                  onChange={(e) => setEditForm({ ...editForm, is_tax_deductible: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Tax Deductible</span>
              </label>
            )}
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
              disabled={updateExpenseMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateExpenseMutation.isPending ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
