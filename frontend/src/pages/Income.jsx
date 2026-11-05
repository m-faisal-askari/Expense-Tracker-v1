import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Percent, Plus, Trash2, Pencil } from 'lucide-react';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Income() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: defaultCurrency, convert } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    fee_amount: '0.00',
    currency: defaultCurrency || 'PKR',
    description: '',
    date: new Date().toISOString().split('T')[0],
    destination_account_id: '',
    category_id: '',
    client_id: '',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    amount: '',
    fee_amount: '0.00',
    currency: 'PKR',
    description: '',
    date: new Date().toISOString().split('T')[0],
    destination_account_id: '',
    category_id: '',
    client_id: '',
    notes: ''
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['incomeTransactions'],
    queryFn: () => api.get('/transactions', { type: 'INCOME' }),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients'),
  });

  const incomeCategories = categories?.filter(c => c.type === 'INCOME') || [];

  const createIncomeMutation = useMutation({
    mutationFn: (newTx) => api.post('/transactions', {
      ...newTx,
      type: 'INCOME',
      is_business: true,
      amount: parseFloat(newTx.amount),
      fee_amount: parseFloat(newTx.fee_amount || 0)
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['incomeTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsModalOpen(false);
      setForm({
        amount: '',
        fee_amount: '0.00',
        currency: defaultCurrency || 'PKR',
        description: '',
        date: new Date().toISOString().split('T')[0],
        destination_account_id: accounts?.[0]?.id || '',
        category_id: '',
        client_id: '',
        notes: ''
      });
      showSuccess(`Income of ${formatCurrency(res.amount, res.currency)} recorded.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not save income');
    }
  });

  const updateIncomeMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/transactions/${id}`, {
      ...data,
      type: 'INCOME',
      amount: parseFloat(data.amount),
      fee_amount: parseFloat(data.fee_amount || 0)
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['incomeTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsEditModalOpen(false);
      showSuccess(`Income updated.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not update income');
    }
  });

  const deleteTxMutation = useMutation({
    mutationFn: (txId) => api.delete(`/transactions/${txId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      showSuccess('Income record deleted.');
    },
    onError: (err) => {
      showError(err.message, 'Could not delete income');
    }
  });

  const handleOpenEdit = (tx) => {
    setEditForm({
      id: tx.id,
      amount: tx.amount,
      fee_amount: tx.fee_amount || '0.00',
      currency: tx.currency || 'USD',
      description: tx.description || '',
      date: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
      destination_account_id: tx.destination_account_id || '',
      category_id: tx.category_id || '',
      client_id: tx.client_id || '',
      notes: tx.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const txs = transactions || [];
  const grossTotal = txs.reduce((sum, t) => sum + convert(t.amount, t.currency), 0);
  const feesTotal = txs.reduce((sum, t) => sum + convert(t.fee_amount || 0, t.currency), 0);
  const netReceived = grossTotal - feesTotal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Income Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">Track client payments, platform fees, and net receipts in {defaultCurrency}</p>
        </div>

        <button
          onClick={() => {
            if (accounts?.length && !form.destination_account_id) {
              setForm(prev => ({ ...prev, destination_account_id: accounts[0].id }));
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Income
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Gross Earnings"
          amount={grossTotal}
          currency={defaultCurrency}
          icon={DollarSign}
          color="indigo"
          subtitle={`Total earned converted to ${defaultCurrency}`}
        />
        <MetricCard
          title="Platform / Processing Fees"
          amount={feesTotal}
          currency={defaultCurrency}
          icon={Percent}
          color="amber"
          subtitle="Deducted by Stripe, Upwork, banks"
        />
        <MetricCard
          title="Net Cash Received"
          amount={netReceived}
          currency={defaultCurrency}
          icon={TrendingUp}
          color="emerald"
          subtitle="Actual liquid funds received"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading income records..." />
      ) : txs.length === 0 ? (
        <EmptyState
          title="No income recorded yet"
          description="Record incoming payments from client projects, retainers, or marketplace payouts."
          actionLabel="Add Income"
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
                  <th className="py-3 px-4">Account Deposited</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Fees</th>
                  <th className="py-3 px-4 text-right">Net Received</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {txs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{tx.description}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.category_name || 'Income'}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.account_name || 'Default Account'}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.client_name || '—'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-slate-600 font-mono">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-amber-600 font-mono">
                      {parseFloat(tx.fee_amount) > 0 ? `-${formatCurrency(tx.fee_amount, tx.currency)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-600 font-mono">
                      {formatCurrency(parseFloat(tx.amount) - parseFloat(tx.fee_amount || 0), tx.currency)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="text-slate-400 hover:text-indigo-600 transition p-1"
                          title="Edit Income"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this income record? Account balance will be adjusted.')) {
                              deleteTxMutation.mutate(tx.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Delete Income"
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

      {/* Add Income Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Incoming Payment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createIncomeMutation.mutate(form);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Gross Amount Earned</label>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Platform / Processing Fee (Deduction)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.fee_amount}
              onChange={(e) => setForm({ ...form, fee_amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Milestone 2 - Frontend Delivery, Monthly Retainer"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Deposit To Account</label>
              <select
                value={form.destination_account_id}
                onChange={(e) => setForm({ ...form, destination_account_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">Select Account...</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client (Optional)</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">None / Direct</option>
                {clients?.map((cl) => (
                  <option key={cl.id} value={cl.id}>{cl.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">Default Income</option>
                {incomeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
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
              disabled={createIncomeMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createIncomeMutation.isPending ? 'Saving...' : 'Record Income'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Income Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Income Record">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateIncomeMutation.mutate({
              id: editForm.id,
              data: {
                ...editForm,
                destination_account_id: editForm.destination_account_id || null,
                category_id: editForm.category_id || null,
                client_id: editForm.client_id || null,
              }
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Gross Amount Earned</label>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Platform / Processing Fee</label>
            <input
              type="number"
              step="0.01"
              value={editForm.fee_amount}
              onChange={(e) => setEditForm({ ...editForm, fee_amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Deposit To Account</label>
              <select
                value={editForm.destination_account_id}
                onChange={(e) => setEditForm({ ...editForm, destination_account_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">Select Account...</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client (Optional)</label>
              <select
                value={editForm.client_id}
                onChange={(e) => setEditForm({ ...editForm, client_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">None / Direct</option>
                {clients?.map((cl) => (
                  <option key={cl.id} value={cl.id}>{cl.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={editForm.category_id}
                onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">Default Income</option>
                {incomeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
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
              disabled={updateIncomeMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateIncomeMutation.isPending ? 'Updating...' : 'Update Income'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
