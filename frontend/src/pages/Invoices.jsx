import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Plus, Download, DollarSign, Ban, Trash2, Calendar, FileText, Edit3 } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { FieldHint } from '../components/FieldHints';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { MetricCard } from '../components/MetricCard';

export function Invoices() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { currency: defaultCurrency, convert } = useCurrency();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Auto-open modal if ?new=1 is in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === '1') {
      setIsModalOpen(true);
    }
  }, [location.search]);

  // Invoice Form State
  const [form, setForm] = useState({
    client_id: '',
    project_id: '',
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: defaultCurrency || 'PKR',
    discount_amount: '0.00',
    tax_rate: '0.00',
    notes: '',
    payment_instructions: 'Payment due within 30 days via direct bank transfer or online gateway.',
    items: [{ description: 'Software Development & Architecture', quantity: '1', unit_price: '50000.00' }]
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    fee_amount: '0.00',
    payment_date: new Date().toISOString().split('T')[0],
    account_id: '',
    notes: ''
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices'),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients'),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: (newInvoice) => api.post('/invoices', newInvoice),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsModalOpen(false);
      showSuccess(`Invoice #${res.invoice_number} generated.`);
    },
    onError: (err) => {
      showError(err.message, 'Could not create invoice');
    }
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsEditModalOpen(false);
      setSelectedInvoice(null);
      showSuccess('Invoice updated.');
    },
    onError: (err) => {
      showError(err.message, 'Could not update invoice');
    }
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ invoiceId, data }) => api.post(`/invoices/${invoiceId}/payments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      showSuccess('Payment recorded.');
    },
    onError: (err) => {
      showError(err.message, 'Could not record payment');
    }
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: (id) => api.post(`/invoices/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['dashboardSummary']);
      showSuccess('Invoice marked as cancelled.');
    },
    onError: (err) => {
      showError(err.message, 'Could not cancel invoice');
    }
  });

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: '1', unit_price: '0.00' }]
    });
  };

  const removeItem = (idx) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== idx)
    });
  };

  const updateItem = (idx, field, val) => {
    const newItems = [...form.items];
    newItems[idx][field] = val;
    setForm({ ...form, items: newItems });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    createInvoiceMutation.mutate({
      ...form,
      discount_amount: parseFloat(form.discount_amount || 0),
      tax_rate: parseFloat(form.tax_rate || 0),
      items: form.items.map(it => ({
        ...it,
        quantity: parseFloat(it.quantity || 1),
        unit_price: parseFloat(it.unit_price || 0)
      }))
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    updateInvoiceMutation.mutate({
      id: selectedInvoice.id,
      data: {
        client_id: form.client_id,
        project_id: form.project_id || null,
        due_date: form.due_date,
        currency: form.currency,
        discount_amount: parseFloat(form.discount_amount || 0),
        tax_rate: parseFloat(form.tax_rate || 0),
        notes: form.notes,
        payment_instructions: form.payment_instructions,
        items: form.items.map(it => ({
          description: it.description,
          quantity: parseFloat(it.quantity || 1),
          unit_price: parseFloat(it.unit_price || 0)
        }))
      }
    });
  };

  const openEditModal = (inv) => {
    setSelectedInvoice(inv);
    setForm({
      client_id: inv.client_id,
      project_id: inv.project_id || '',
      invoice_number: inv.invoice_number,
      due_date: inv.due_date,
      currency: inv.currency,
      discount_amount: String(inv.discount_amount || '0.00'),
      tax_rate: String(inv.tax_rate || '0.00'),
      notes: inv.notes || '',
      payment_instructions: inv.payment_instructions || '',
      items: inv.items?.length > 0 ? inv.items.map(it => ({
        description: it.description,
        quantity: String(it.quantity),
        unit_price: String(it.unit_price)
      })) : [{ description: 'Service Item', quantity: '1', unit_price: '0.00' }]
    });
    setIsEditModalOpen(true);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    recordPaymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      data: {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount),
        fee_amount: parseFloat(paymentForm.fee_amount || 0)
      }
    });
  };

  const handleDownloadPDF = (invoiceId, invoiceNumber) => {
    api.downloadBlob(`/invoices/${invoiceId}/pdf`, `Invoice_${invoiceNumber}.pdf`);
  };

  const invs = invoices || [];
  const totalInvoiced = invs.filter(i => i.status !== 'CANCELLED').reduce((sum, i) => sum + convert(i.total_amount || 0, i.currency), 0);
  const totalOutstanding = invs.filter(i => i.status !== 'CANCELLED' && i.status !== 'PAID').reduce((sum, i) => sum + convert(i.balance_due || 0, i.currency), 0);
  const totalReceived = invs.filter(i => i.status !== 'CANCELLED').reduce((sum, i) => sum + convert((parseFloat(i.total_amount || 0) - parseFloat(i.balance_due || 0)), i.currency), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Invoice Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">Create professional invoices, generate PDFs, and record payment settlements in {defaultCurrency}</p>
        </div>

        <button
          onClick={() => {
            setForm({
              client_id: clients?.[0]?.id || '',
              project_id: '',
              invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              currency: defaultCurrency || 'PKR',
              discount_amount: '0.00',
              tax_rate: '0.00',
              notes: '',
              payment_instructions: 'Payment due within 30 days.',
              items: [{ description: 'Software Development & Consulting', quantity: '1', unit_price: '50000.00' }]
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Invoiced"
          amount={totalInvoiced}
          currency={defaultCurrency}
          icon={FileText}
          color="indigo"
          subtitle={`Aggregated invoiced billings in ${defaultCurrency}`}
        />
        <MetricCard
          title="Outstanding Receivables"
          amount={totalOutstanding}
          currency={defaultCurrency}
          icon={Calendar}
          color="amber"
          subtitle="Awaiting client payment settlement"
        />
        <MetricCard
          title="Cash Collected"
          amount={totalReceived}
          currency={defaultCurrency}
          icon={DollarSign}
          color="emerald"
          subtitle="Total settled & reconciled revenue"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading invoices ledger..." />
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState
          title="No invoices created yet"
          description="Bill your clients by generating an invoice with itemized line items and payment instructions."
          actionLabel="Create Invoice"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      #{inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{inv.client_name || 'Client'}</div>
                      {inv.client_company && <div className="text-[10px] text-slate-400">{inv.client_company}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDate(inv.issue_date)}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDate(inv.due_date)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-900 font-mono">
                      {formatCurrency(inv.total_amount, inv.currency)}
                      {inv.currency !== defaultCurrency && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          ≈ {formatCurrency(convert(inv.total_amount, inv.currency), defaultCurrency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-indigo-600 font-mono">
                      {formatCurrency(inv.balance_due, inv.currency)}
                      {inv.currency !== defaultCurrency && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          ≈ {formatCurrency(convert(inv.balance_due, inv.currency), defaultCurrency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                        className="inline-flex items-center gap-1 p-1.5 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => openEditModal(inv)}
                          className="inline-flex items-center p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                          title="Edit Invoice"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {parseFloat(inv.balance_due) > 0 && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentForm({
                              amount: inv.balance_due,
                              fee_amount: '0.00',
                              payment_date: new Date().toISOString().split('T')[0],
                              account_id: accounts?.[0]?.id || '',
                              notes: `Payment for #${inv.invoice_number}`
                            });
                            setIsPaymentModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition"
                        >
                          <DollarSign className="w-3 h-3" />
                          Record Payment
                        </button>
                      )}

                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && parseFloat(inv.amount_paid) === 0 && (
                        <button
                          onClick={() => {
                            if (confirm(`Cancel invoice #${inv.invoice_number}?`)) {
                              cancelInvoiceMutation.mutate(inv.id);
                            }
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Cancel Invoice"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Professional Invoice" maxWidth="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client</label>
              <select
                required
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Client...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''}</option>
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
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-800">Itemized Line Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="mb-1 flex items-center gap-2 px-1 text-[9px] font-semibold text-slate-500">
              <span className="flex min-w-0 flex-1 items-center gap-1">Line description<FieldHint label="Line item description" compact /></span>
              <span className="flex w-16 items-center justify-end gap-1">Qty<FieldHint label="Quantity" compact /></span>
              <span className="flex w-28 items-center justify-end gap-1">Rate<FieldHint label="Unit rate" compact /></span>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    aria-label="Line item description"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    aria-label="Quantity"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-16 px-3 py-2 rounded-lg border border-slate-200 text-right"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    aria-label="Rate per unit"
                    placeholder="Rate"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                    className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-right font-mono"
                  />
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Discount Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.discount_amount}
                onChange={(e) => setForm({ ...form, discount_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.tax_rate}
                onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Instructions</label>
            <textarea
              rows={2}
              value={form.payment_instructions}
              onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })}
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
              disabled={createInvoiceMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {createInvoiceMutation.isPending ? 'Generating...' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Invoice #${selectedInvoice?.invoice_number}`} maxWidth="max-w-2xl">
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client</label>
              <select
                required
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
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
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-800">Line Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="mb-1 flex items-center gap-2 px-1 text-[9px] font-semibold text-slate-500">
              <span className="flex min-w-0 flex-1 items-center gap-1">Line description<FieldHint label="Line item description" compact /></span>
              <span className="flex w-16 items-center justify-end gap-1">Qty<FieldHint label="Quantity" compact /></span>
              <span className="flex w-28 items-center justify-end gap-1">Rate<FieldHint label="Unit rate" compact /></span>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    aria-label="Line item description"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    aria-label="Quantity"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-16 px-3 py-2 rounded-lg border border-slate-200 text-right"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    aria-label="Rate per unit"
                    placeholder="Rate"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                    className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-right font-mono"
                  />
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Discount Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.discount_amount}
                onChange={(e) => setForm({ ...form, discount_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.tax_rate}
                onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Instructions</label>
            <textarea
              rows={2}
              value={form.payment_instructions}
              onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })}
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
              disabled={updateInvoiceMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {updateInvoiceMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for Invoice #${selectedInvoice?.invoice_number}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Recording this payment reduces the invoice balance due and automatically creates an income transaction in your ledger.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Received</label>
              <input
                type="number"
                step="0.01"
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Platform / Fee Deducted</label>
              <input
                type="number"
                step="0.01"
                value={paymentForm.fee_amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, fee_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Deposit To Account</label>
            <select
              required
              value={paymentForm.account_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, account_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="">Select Account...</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance, a.currency)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              required
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
            >
              {recordPaymentMutation.isPending ? 'Processing...' : 'Confirm & Deposit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
