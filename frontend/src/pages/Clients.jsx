import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Mail, Phone, MapPin, Edit3, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function Clients() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: defaultCurrency, convert } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [form, setForm] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    billing_address: '',
    country: 'Pakistan',
    default_currency: 'PKR',
    payment_terms: 'Net 30',
    notes: ''
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients'),
  });

  const createClientMutation = useMutation({
    mutationFn: (newClient) => api.post('/clients', newClient),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['clients']);
      setIsModalOpen(false);
      setForm({ name: '', company_name: '', email: '', phone: '', billing_address: '', country: 'Pakistan', default_currency: 'PKR', payment_terms: 'Net 30', notes: '' });
      showSuccess(`Client "${res.name}" added successfully.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not create client');
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/clients/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['clients']);
      setIsEditModalOpen(false);
      setSelectedClient(null);
      showSuccess(`Client "${res.name}" updated successfully.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not update client');
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      showSuccess('Client deleted.');
    },
    onError: (err) => {
      showError(err.message, 'Could not delete client');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createClientMutation.mutate(form);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedClient) return;
    updateClientMutation.mutate({
      id: selectedClient.id,
      data: form
    });
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setForm({
      name: client.name || '',
      company_name: client.company_name || '',
      email: client.email || '',
      phone: client.phone || '',
      billing_address: client.billing_address || '',
      country: client.country || 'Pakistan',
      default_currency: client.default_currency || 'PKR',
      payment_terms: client.payment_terms || 'Net 30',
      notes: client.notes || ''
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Client Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">Track client relationships, billing terms, and net profitability</p>
        </div>

        <button
          onClick={() => {
            setForm({ name: '', company_name: '', email: '', phone: '', billing_address: '', country: 'Pakistan', default_currency: 'PKR', payment_terms: 'Net 30', notes: '' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Client
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading clients..." />
      ) : !clients || clients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Add clients to issue invoices and track per-client revenue and profitability."
          actionLabel="Add Client"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow transition">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                  {c.company_name && <p className="text-xs text-slate-500 font-medium">{c.company_name}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="text-slate-400 hover:text-indigo-600 transition p-1"
                    title="Edit Client"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete client "${c.name}"?`)) {
                        deleteClientMutation.mutate(c.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                    title="Delete Client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {c.email && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Total Invoiced</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(c.total_invoiced, c.default_currency)}</span>
                  {c.default_currency !== defaultCurrency && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      ≈ {formatCurrency(convert(c.total_invoiced, c.default_currency), defaultCurrency)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Total Received</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(c.total_received, c.default_currency)}</span>
                  {c.default_currency !== defaultCurrency && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      ≈ {formatCurrency(convert(c.total_received, c.default_currency), defaultCurrency)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Outstanding Due</span>
                  <span className="font-semibold text-amber-600">{formatCurrency(c.outstanding_balance, c.default_currency)}</span>
                  {c.default_currency !== defaultCurrency && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      ≈ {formatCurrency(convert(c.outstanding_balance, c.default_currency), defaultCurrency)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Net Profitability</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(c.net_profit, c.default_currency)}</span>
                  {c.default_currency !== defaultCurrency && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      ≈ {formatCurrency(convert(c.net_profit, c.default_currency), defaultCurrency)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Client">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe, Fatima Tariq"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="e.g. TechCorp Solutions"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="billing@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Default Currency</label>
              <select
                value={form.default_currency}
                onChange={(e) => setForm({ ...form, default_currency: e.target.value })}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+92 300 1234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Terms</label>
              <select
                value={form.payment_terms}
                onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Billing Address</label>
            <textarea
              rows={2}
              placeholder="Full address for invoice rendering"
              value={form.billing_address}
              onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
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
              disabled={createClientMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createClientMutation.isPending ? 'Saving...' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Client: ${selectedClient?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Default Currency</label>
              <select
                value={form.default_currency}
                onChange={(e) => setForm({ ...form, default_currency: e.target.value })}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Terms</label>
              <select
                value={form.payment_terms}
                onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Billing Address</label>
            <textarea
              rows={2}
              value={form.billing_address}
              onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
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
              disabled={updateClientMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateClientMutation.isPending ? 'Saving...' : 'Update Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
