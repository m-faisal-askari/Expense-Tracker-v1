import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Download, Upload, ArrowUpRight, ArrowDownRight, 
  ArrowLeftRight, Trash2, Edit3, Pencil, Filter, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Transactions() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: defaultCurrency, convert } = useCurrency();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Form State
  const [form, setForm] = useState({
    type: 'EXPENSE',
    amount: '',
    currency: defaultCurrency || 'PKR',
    description: '',
    date: new Date().toISOString().split('T')[0],
    source_account_id: '',
    destination_account_id: '',
    category_id: '',
    client_id: '',
    project_id: '',
    is_business: true,
    is_tax_deductible: true,
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    type: 'EXPENSE',
    amount: '',
    currency: 'PKR',
    description: '',
    date: new Date().toISOString().split('T')[0],
    source_account_id: '',
    destination_account_id: '',
    category_id: '',
    client_id: '',
    project_id: '',
    is_business: true,
    is_tax_deductible: true,
    notes: ''
  });

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const typeParam = searchParams.get('type');
      if (typeParam && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(typeParam.toUpperCase())) {
        setForm(prev => ({ ...prev, type: typeParam.toUpperCase() }));
      }
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Queries
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', typeFilter, search],
    queryFn: () => api.get('/transactions', { type: typeFilter || undefined, search: search || undefined }),
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

  // Mutations
  const createTxMutation = useMutation({
    mutationFn: (newTx) => api.post('/transactions', newTx),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboardSummary']);
      queryClient.invalidateQueries(['accounts']);
      setIsModalOpen(false);
      setForm({
        type: 'EXPENSE',
        amount: '',
        currency: defaultCurrency || 'PKR',
        description: '',
        date: new Date().toISOString().split('T')[0],
        source_account_id: accounts?.[0]?.id || '',
        destination_account_id: '',
        category_id: '',
        client_id: '',
        project_id: '',
        is_business: true,
        is_tax_deductible: true,
        notes: ''
      });
      showSuccess(`Transaction "${res.description}" recorded.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not save transaction');
    }
  });

  const updateTxMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/transactions/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboardSummary']);
      queryClient.invalidateQueries(['accounts']);
      setIsEditModalOpen(false);
      showSuccess(`Transaction "${res.description}" updated.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not update transaction');
    }
  });

  const deleteTxMutation = useMutation({
    mutationFn: (txId) => api.delete(`/transactions/${txId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboardSummary']);
      queryClient.invalidateQueries(['accounts']);
      showSuccess('Transaction deleted.');
    },
    onError: (err) => {
      showError(err.message, 'Could not delete transaction');
    }
  });

  const handleOpenEdit = (tx) => {
    setEditForm({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency || 'USD',
      description: tx.description || '',
      date: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
      source_account_id: tx.source_account_id || '',
      destination_account_id: tx.destination_account_id || '',
      category_id: tx.category_id || '',
      client_id: tx.client_id || '',
      project_id: tx.project_id || '',
      is_business: !!tx.is_business,
      is_tax_deductible: !!tx.is_tax_deductible,
      notes: tx.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateTxMutation.mutate({
      id: editForm.id,
      data: {
        ...editForm,
        amount: parseFloat(editForm.amount),
        source_account_id: editForm.source_account_id || null,
        destination_account_id: editForm.destination_account_id || null,
        category_id: editForm.category_id || null,
        client_id: editForm.client_id || null,
        project_id: editForm.project_id || null,
      }
    });
  };

  const handleExportCSV = () => {
    api.downloadBlob('/transactions/export/csv', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      const res = await api.uploadFile('/transactions/import/csv', importFile);
      setImportResult(res);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboardSummary']);
      queryClient.invalidateQueries(['accounts']);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createTxMutation.mutate({
      ...form,
      amount: parseFloat(form.amount)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Transactions</h2>
          <p className="text-xs sm:text-sm text-slate-500">Record and audit all income, business expenses, and account transfers</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs">
            {['', 'INCOME', 'EXPENSE', 'TRANSFER'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  typeFilter === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t || 'All Types'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      {isLoading ? (
        <LoadingSpinner text="Loading transactions ledger..." />
      ) : !transactions || transactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Record your first income or expense transaction to start building your ledger."
          actionLabel="Add Transaction"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Tax Ded.</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[10px] ${
                        tx.type === 'INCOME' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : (tx.type === 'EXPENSE' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700')
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tx.description}</div>
                      {tx.client_name && <div className="text-[10px] text-slate-400">Client: {tx.client_name}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.category_name || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.account_name || '—'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.is_business ? (
                        <span className={`text-[10px] ${tx.is_tax_deductible ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {tx.is_tax_deductible ? 'Deductible' : 'Non-deductible'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Personal</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                      <span className={tx.type === 'INCOME' ? 'text-emerald-600' : (tx.type === 'EXPENSE' ? 'text-slate-900' : 'text-blue-600')}>
                        {tx.type === 'INCOME' ? '+' : (tx.type === 'EXPENSE' ? '-' : '')}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      {tx.currency !== defaultCurrency && (
                        <div className="text-[10px] text-slate-400 font-normal font-mono">
                          ≈ {tx.type === 'INCOME' ? '+' : (tx.type === 'EXPENSE' ? '-' : '')}{formatCurrency(convert(tx.amount, tx.currency), defaultCurrency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="text-slate-400 hover:text-indigo-600 transition p-1"
                          title="Edit Transaction"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this transaction? This will automatically recalculate account balances.')) {
                              deleteTxMutation.mutate(tx.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Delete Transaction"
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

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Transaction"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['INCOME', 'EXPENSE', 'TRANSFER'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`py-2 rounded-lg font-semibold border transition ${
                    form.type === t 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Website development milestone, AWS hosting"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Category...</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Selector */}
          {form.type === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source Account (Outflow)</label>
                <select
                  required
                  value={form.source_account_id}
                  onChange={(e) => setForm({ ...form, source_account_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Source Account...</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Destination Account (Inflow)</label>
                <select
                  required
                  value={form.destination_account_id}
                  onChange={(e) => setForm({ ...form, destination_account_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Destination Account...</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {form.type === 'INCOME' ? 'Destination Account (Deposit To)' : 'Payment Account (Paid From)'}
              </label>
              <select
                value={form.type === 'INCOME' ? form.destination_account_id : form.source_account_id}
                onChange={(e) => {
                  if (form.type === 'INCOME') {
                    setForm({ ...form, destination_account_id: e.target.value });
                  } else {
                    setForm({ ...form, source_account_id: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Account...</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                ))}
              </select>
            </div>
          )}

          {/* Classification toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_business}
                onChange={(e) => setForm({ ...form, is_business: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-slate-700 font-medium">Business Transaction</span>
            </label>

            {form.is_business && form.type === 'EXPENSE' && (
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
              disabled={createTxMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createTxMutation.isPending ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Transaction"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['INCOME', 'EXPENSE', 'TRANSFER'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setEditForm({ ...editForm, type: t })}
                  className={`py-2 rounded-lg font-semibold border transition ${
                    editForm.type === t 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={editForm.currency}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Website development milestone, AWS hosting"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={editForm.category_id}
                onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Category...</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Selector */}
          {editForm.type === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source Account (Outflow)</label>
                <select
                  required
                  value={editForm.source_account_id}
                  onChange={(e) => setEditForm({ ...editForm, source_account_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Source Account...</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Destination Account (Inflow)</label>
                <select
                  required
                  value={editForm.destination_account_id}
                  onChange={(e) => setEditForm({ ...editForm, destination_account_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Destination Account...</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {editForm.type === 'INCOME' ? 'Destination Account (Deposit To)' : 'Payment Account (Paid From)'}
              </label>
              <select
                value={editForm.type === 'INCOME' ? editForm.destination_account_id : editForm.source_account_id}
                onChange={(e) => {
                  if (editForm.type === 'INCOME') {
                    setEditForm({ ...editForm, destination_account_id: e.target.value });
                  } else {
                    setEditForm({ ...editForm, source_account_id: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Account...</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                ))}
              </select>
            </div>
          )}

          {/* Classification toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.is_business}
                onChange={(e) => setEditForm({ ...editForm, is_business: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-slate-700 font-medium">Business Transaction</span>
            </label>

            {editForm.is_business && editForm.type === 'EXPENSE' && (
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
              disabled={updateTxMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateTxMutation.isPending ? 'Updating...' : 'Update Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Import CSV Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportResult(null);
          setImportFile(null);
        }}
        title="Import Transactions from CSV"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Upload your bank or payment platform CSV. Common column names such as Date, Description/Memo, Amount, and Type will be mapped automatically.
          </p>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setImportFile(e.target.files[0])}
            className="w-full p-2 border border-slate-200 rounded-lg text-slate-600"
          />

          {importResult && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Import Complete
              </div>
              <p>Successfully imported: {importResult.imported_count} records</p>
              {importResult.failed_count > 0 && (
                <p className="text-rose-600">Skipped/Failed: {importResult.failed_count} records</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleImportCSV}
              disabled={!importFile}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              Start Import
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
