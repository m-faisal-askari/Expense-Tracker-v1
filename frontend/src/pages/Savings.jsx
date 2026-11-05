import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, CheckCircle2, DollarSign, Calendar, Trash2, Pencil } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Savings() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: defaultCurrency, convert } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    currency: defaultCurrency || 'PKR',
    target_date: '',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    target_amount: '',
    currency: 'PKR',
    target_date: '',
    notes: ''
  });

  const [contribForm, setContribForm] = useState({
    amount: '',
    contribution_date: new Date().toISOString().split('T')[0],
    account_id: '',
    notes: 'Contribution to goal'
  });

  const { data: goals, isLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => api.get('/savings'),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  });

  const createGoalMutation = useMutation({
    mutationFn: (newGoal) => api.post('/savings', newGoal),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['savingsGoals']);
      setIsModalOpen(false);
      setForm({ name: '', target_amount: '', currency: defaultCurrency || 'PKR', target_date: '', notes: '' });
      showSuccess(`Savings Goal "${res.name}" created.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not create savings goal');
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/savings/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['savingsGoals']);
      setIsEditModalOpen(false);
      showSuccess(`Savings Goal "${res.name}" updated.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not update savings goal');
    }
  });

  const contributeMutation = useMutation({
    mutationFn: ({ goalId, data }) => api.post(`/savings/${goalId}/contribute`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['savingsGoals']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsContribModalOpen(false);
      setSelectedGoal(null);
      showSuccess('Contribution recorded.');
    },
    onError: (err) => {
      showError(err.message, 'Could not record contribution');
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => api.delete(`/savings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['savingsGoals']);
      showSuccess('Savings goal deleted.');
    },
    onError: (err) => {
      showError(err.message, 'Could not delete savings goal');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createGoalMutation.mutate({
      ...form,
      target_amount: parseFloat(form.target_amount)
    });
  };

  const handleOpenEdit = (goal) => {
    setEditForm({
      id: goal.id,
      name: goal.name,
      target_amount: goal.target_amount,
      currency: goal.currency || 'USD',
      target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
      notes: goal.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateGoalMutation.mutate({
      id: editForm.id,
      data: {
        name: editForm.name,
        target_amount: parseFloat(editForm.target_amount),
        currency: editForm.currency,
        target_date: editForm.target_date || null,
        notes: editForm.notes
      }
    });
  };

  const handleContribute = (e) => {
    e.preventDefault();
    if (!selectedGoal) return;
    contributeMutation.mutate({
      goalId: selectedGoal.id,
      data: {
        ...contribForm,
        amount: parseFloat(contribForm.amount)
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Savings Goals</h2>
          <p className="text-xs sm:text-sm text-slate-500">Plan emergency funds, hardware upgrades, and business reserves</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          New Goal
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading savings goals..." />
      ) : !goals || goals.length === 0 ? (
        <EmptyState
          title="No savings goals yet"
          description="Create financial targets like a 3-month emergency buffer, new workstation, or conference fund."
          actionLabel="New Goal"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const pct = parseFloat(g.progress_percentage || 0);

            return (
              <div key={g.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {g.name}
                        {g.is_completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </h4>
                      {g.target_date && (
                        <p className="text-[10px] text-slate-400">Target Date: {formatDate(g.target_date)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(g)}
                        className="text-slate-400 hover:text-indigo-600 transition p-1"
                        title="Edit Goal"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete savings goal "${g.name}"?`)) {
                            deleteGoalMutation.mutate(g.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Progress</span>
                      <span className="font-bold text-indigo-600">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Saved</span>
                      <span className="font-bold text-slate-900 text-base">{formatCurrency(g.current_amount, g.currency)}</span>
                      {g.currency !== defaultCurrency && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          ≈ {formatCurrency(convert(g.current_amount, g.currency), defaultCurrency)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Target</span>
                      <span className="font-semibold text-slate-600 text-sm">{formatCurrency(g.target_amount, g.currency)}</span>
                      {g.currency !== defaultCurrency && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          ≈ {formatCurrency(convert(g.target_amount, g.currency), defaultCurrency)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedGoal(g);
                      setContribForm({
                        amount: '',
                        contribution_date: new Date().toISOString().split('T')[0],
                        account_id: accounts?.[0]?.id || '',
                        notes: `Contributed to ${g.name}`
                      });
                      setIsContribModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Contribution
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Goal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Financial Savings Goal">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Goal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 6-Month Emergency Buffer, M3 Max MacBook Pro"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Amount</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="5000.00"
                value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Date (Optional)</label>
            <input
              type="date"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
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
              disabled={createGoalMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createGoalMutation.isPending ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Savings Goal">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Goal Name</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={editForm.target_amount}
                onChange={(e) => setEditForm({ ...editForm, target_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Date (Optional)</label>
            <input
              type="date"
              value={editForm.target_date}
              onChange={(e) => setEditForm({ ...editForm, target_date: e.target.value })}
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
              disabled={updateGoalMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateGoalMutation.isPending ? 'Updating...' : 'Update Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal isOpen={isContribModalOpen} onClose={() => setIsContribModalOpen(false)} title={`Contribute to "${selectedGoal?.name}"`}>
        <form onSubmit={handleContribute} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contribution Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={contribForm.amount}
              onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={contribForm.contribution_date}
                onChange={(e) => setContribForm({ ...contribForm, contribution_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Deduct from Account</label>
              <select
                value={contribForm.account_id}
                onChange={(e) => setContribForm({ ...contribForm, account_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">No account movement</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsContribModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={contributeMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {contributeMutation.isPending ? 'Recording...' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
