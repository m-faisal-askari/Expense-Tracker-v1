import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PieChart, AlertTriangle, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Budgets() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: defaultCurrency } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  const [form, setForm] = useState({
    name: 'Monthly Operating Budget',
    period: 'MONTHLY',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    total_allocated: '100000.00',
    is_rollover: false
  });

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', defaultCurrency],
    queryFn: () => api.get('/budgets', { currency: defaultCurrency }),
  });

  const createBudgetMutation = useMutation({
    mutationFn: (newBudget) => api.post('/budgets', newBudget),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['budgets']);
      setIsModalOpen(false);
      showSuccess(`Budget "${res.name}" created.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not create budget');
    }
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/budgets/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['budgets']);
      setIsEditModalOpen(false);
      setSelectedBudget(null);
      showSuccess(`Budget "${res.name}" updated.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not update budget');
    }
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      showSuccess('Budget deleted.');
    },
    onError: (err) => {
      showError(err.message, 'Could not delete budget');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createBudgetMutation.mutate({
      ...form,
      total_allocated: parseFloat(form.total_allocated)
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedBudget) return;
    updateBudgetMutation.mutate({
      id: selectedBudget.id,
      data: {
        name: form.name,
        period: form.period,
        start_date: form.start_date,
        end_date: form.end_date,
        total_allocated: parseFloat(form.total_allocated),
        is_rollover: form.is_rollover
      }
    });
  };

  const openEditModal = (b) => {
    setSelectedBudget(b);
    setForm({
      name: b.name,
      period: b.period,
      start_date: b.start_date,
      end_date: b.end_date,
      total_allocated: String(b.total_allocated),
      is_rollover: b.is_rollover || false
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Budget Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">Set spending limits and prevent cost overruns across categories</p>
        </div>

        <button
          onClick={() => {
            setForm({
              name: 'Monthly Operating Budget',
              period: 'MONTHLY',
              start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
              end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
              total_allocated: '100000.00',
              is_rollover: false
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Budget
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Calculating budget utilization..." />
      ) : !budgets || budgets.length === 0 ? (
        <EmptyState
          title="No budgets configured"
          description="Create a monthly or quarterly spending budget to track expenses against limits."
          actionLabel="Create Budget"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgets.map((b) => {
            const pct = parseFloat(b.utilization_percentage || 0);
            const isOver = pct > 100;
            const isNear = pct >= 80 && pct <= 100;

            return (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDate(b.start_date)} - {formatDate(b.end_date)} ({b.period})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="text-slate-400 hover:text-indigo-600 transition p-1"
                      title="Edit Budget"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete budget "${b.name}"?`)) {
                          deleteBudgetMutation.mutate(b.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Utilization</span>
                    <span className={`font-bold ${isOver ? 'text-rose-600' : (isNear ? 'text-amber-600' : 'text-slate-900')}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        isOver ? 'bg-rose-500' : (isNear ? 'bg-amber-500' : 'bg-indigo-600')
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Allocated</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(b.total_allocated, defaultCurrency)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Spent</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(b.spent_amount, defaultCurrency)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Remaining</span>
                    <span className={`font-bold ${parseFloat(b.remaining_amount) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(b.remaining_amount, defaultCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Budget Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Spending Budget">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Budget Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Period</label>
              <select
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Allocated Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.total_allocated}
                onChange={(e) => setForm({ ...form, total_allocated: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
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
              disabled={createBudgetMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createBudgetMutation.isPending ? 'Saving...' : 'Create Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Budget: ${selectedBudget?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Budget Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Period</label>
              <select
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Allocated Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.total_allocated}
                onChange={(e) => setForm({ ...form, total_allocated: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
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
              disabled={updateBudgetMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateBudgetMutation.isPending ? 'Saving...' : 'Update Budget'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
