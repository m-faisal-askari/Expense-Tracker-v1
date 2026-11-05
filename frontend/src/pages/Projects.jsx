import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Briefcase, Calendar, Edit3, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Projects() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: defaultCurrency, convert } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [form, setForm] = useState({
    name: '',
    client_id: '',
    description: '',
    agreed_amount: '0.00',
    currency: defaultCurrency || 'PKR',
    budget: '0.00',
    status: 'IN_PROGRESS'
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients'),
  });

  const createProjectMutation = useMutation({
    mutationFn: (newProj) => api.post('/projects', newProj),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['projects']);
      setIsModalOpen(false);
      setForm({ name: '', client_id: '', description: '', agreed_amount: '0.00', currency: defaultCurrency || 'PKR', budget: '0.00', status: 'IN_PROGRESS' });
      showSuccess(`Project "${res.name}" created.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not create project');
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/projects/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['projects']);
      setIsEditModalOpen(false);
      setSelectedProject(null);
      showSuccess(`Project "${res.name}" updated.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not update project');
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      showSuccess('Project deleted.');
    },
    onError: (err) => {
      showError(err.message, 'Could not delete project');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createProjectMutation.mutate({
      ...form,
      agreed_amount: parseFloat(form.agreed_amount || 0),
      budget: parseFloat(form.budget || 0)
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    updateProjectMutation.mutate({
      id: selectedProject.id,
      data: {
        ...form,
        agreed_amount: parseFloat(form.agreed_amount || 0),
        budget: parseFloat(form.budget || 0)
      }
    });
  };

  const openEditModal = (proj) => {
    setSelectedProject(proj);
    setForm({
      name: proj.name || '',
      client_id: proj.client_id || '',
      description: proj.description || '',
      agreed_amount: proj.agreed_amount || '0.00',
      currency: proj.currency || 'PKR',
      budget: proj.budget || '0.00',
      status: proj.status || 'IN_PROGRESS'
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Project Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">Track client project profitability, budgets, and attributable expenses</p>
        </div>

        <button
          onClick={() => {
            setForm({ name: '', client_id: '', description: '', agreed_amount: '0.00', currency: 'PKR', budget: '0.00', status: 'IN_PROGRESS' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading projects..." />
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          title="No projects created yet"
          description="Create client projects to track agreed value, allocated expenses, and profit margins."
          actionLabel="New Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow transition">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                  <p className="text-xs text-indigo-600 font-medium">{p.client_name || 'No Client'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge status={p.status} />
                  <button
                    onClick={() => openEditModal(p)}
                    className="text-slate-400 hover:text-indigo-600 transition p-1"
                    title="Edit Project"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete project "${p.name}"?`)) {
                        deleteProjectMutation.mutate(p.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {p.description && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{p.description}</p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Agreed Value</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(p.agreed_amount, p.currency)}</span>
                  {p.currency !== defaultCurrency && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      ≈ {formatCurrency(convert(p.agreed_amount, p.currency), defaultCurrency)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Revenue Realized</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(p.revenue, p.currency)}</span>
                  {p.currency !== defaultCurrency && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      ≈ {formatCurrency(convert(p.revenue, p.currency), defaultCurrency)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Expenses Allocated</span>
                  <span className="font-semibold text-rose-600">{formatCurrency(p.expenses, p.currency)}</span>
                  {p.currency !== defaultCurrency && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      ≈ {formatCurrency(convert(p.expenses, p.currency), defaultCurrency)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Net Profit (Margin)</span>
                  <span className="font-bold text-indigo-600">
                    {formatCurrency(p.profit, p.currency)} ({p.profit_margin_percent}%)
                  </span>
                  {p.currency !== defaultCurrency && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      ≈ {formatCurrency(convert(p.profit, p.currency), defaultCurrency)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Client Project">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. NextGen Web App Redesign, Mobile API"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Client...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Agreed Value</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.agreed_amount}
                onChange={(e) => setForm({ ...form, agreed_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Key deliverable details and milestones"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              disabled={createProjectMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createProjectMutation.isPending ? 'Saving...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Project: ${selectedProject?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Client</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Client...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Agreed Value</label>
              <input
                type="number"
                step="0.01"
                value={form.agreed_amount}
                onChange={(e) => setForm({ ...form, agreed_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              disabled={updateProjectMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateProjectMutation.isPending ? 'Saving...' : 'Update Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
