import React, { useState, useEffect, useCallback } from 'react';
import { getServices, addServicePayment, getPaymentHistory } from '../api';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

export default function Payments() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [payModal, setPayModal] = useState(null);
  const [payHistory, setPayHistory] = useState([]);
  const [payForm, setPayForm] = useState({ amount: '', method: 'Cash', paymentDate: '', note: '' });
  const [payLoading, setPayLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try { const { data } = await getServices(); setServices(data); }
    catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openPayModal = async (svc) => {
    setPayModal(svc);
    setPayForm({ amount: '', method: 'Cash', paymentDate: '', note: '' });
    setSuccess('');
    try { const { data } = await getPaymentHistory(svc._id); setPayHistory(data); }
    catch { setPayHistory([]); }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) return;
    setPayLoading(true);
    try {
      await addServicePayment(payModal._id, payForm);
      setSuccess('Payment recorded successfully!');
      setPayForm({ amount: '', method: 'Cash', paymentDate: '', note: '' });
      const { data: hist } = await getPaymentHistory(payModal._id);
      setPayHistory(hist);
      await fetchServices();
      // Refresh modal with updated service
      const updated = await getServices();
      const found = updated.data.find(s => s._id === payModal._id);
      if (found) setPayModal(found);
    } catch { alert('Payment failed. Please try again.'); }
    setPayLoading(false);
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  const statusBadge = (s) => {
    if (s === 'Completed') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-800">✅ Completed</span>;
    if (s === 'Partially Paid') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-800">🔄 Partially Paid</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-800">⏳ Pending</span>;
  };

  // Filter services
  const filtered = services.filter(s => {
    const matchSearch = s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.vehicleName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || s.paymentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  // Summary counts
  const totalPending = services.filter(s => s.paymentStatus === 'Pending').length;
  const totalPartial = services.filter(s => s.paymentStatus === 'Partially Paid').length;
  const totalCompleted = services.filter(s => s.paymentStatus === 'Completed').length;
  const totalPendingAmt = services.filter(s => s.paymentStatus !== 'Completed').reduce((a, s) => a + (s.pendingAmount || 0), 0);

  return (
    <div>
      <h1 className="page-title">Payment Management</h1>
      <p className="page-subtitle">Track and manage all service payments · Add installments · View history</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totalPending}</p>
          <p className="text-slate-500 text-xs mt-0.5">services</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Partially Paid</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{totalPartial}</p>
          <p className="text-slate-500 text-xs mt-0.5">services</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Completed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totalCompleted}</p>
          <p className="text-slate-500 text-xs mt-0.5">services</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{fmt(totalPendingAmt)}</p>
          <p className="text-slate-500 text-xs mt-0.5">to be collected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or vehicle..."
            className="input-field flex-1"
          />
          <div className="flex gap-2">
            {['All', 'Pending', 'Partially Paid', 'Completed'].map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white border border-slate-600'
                }`}>
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">
          Service Payment Records
          <span className="ml-2 text-sm text-slate-400 font-normal">({filtered.length} records)</span>
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12">No payment records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Customer', 'Vehicle', 'Service Date', 'Total Bill', 'Paid Amount', 'Pending', 'Payment Status', 'Completed On', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id} className="table-row">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{s.customerName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{s.vehicleName}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(s.serviceDate)}</td>
                    <td className="px-4 py-3 text-white font-semibold">{fmt(s.totalBill)}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(s.paidAmount)}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: s.pendingAmount > 0 ? '#fbbf24' : '#34d399' }}>
                        {fmt(s.pendingAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(s.paymentStatus)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.paymentCompletionDate
                        ? <span className="text-emerald-400 font-medium">{fmtDate(s.paymentCompletionDate)}</span>
                        : <span className="text-slate-600">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openPayModal(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                          s.paymentStatus === 'Completed'
                            ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        }`}>
                        {s.paymentStatus === 'Completed' ? '📋 View History' : '💳 Add Payment'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAYMENT MODAL ── */}
      {payModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex items-start justify-between">
              <div>
                <h2 className="text-white font-bold text-xl">Payment Details</h2>
                <p className="text-slate-400 text-sm mt-0.5">{payModal.customerName} · {payModal.vehicleName}</p>
                <p className="text-slate-500 text-xs mt-0.5">Service Date: {fmtDate(payModal.serviceDate)}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="text-slate-400 hover:text-white text-2xl leading-none mt-1">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-700/50 rounded-xl p-4 text-center border border-slate-600">
                  <p className="text-slate-400 text-xs mb-1">Total Bill</p>
                  <p className="text-white font-bold text-xl">{fmt(payModal.totalBill)}</p>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-800 rounded-xl p-4 text-center">
                  <p className="text-emerald-400 text-xs mb-1">Amount Paid</p>
                  <p className="text-emerald-400 font-bold text-xl">{fmt(payModal.paidAmount)}</p>
                </div>
                <div className={`rounded-xl p-4 text-center border ${payModal.pendingAmount > 0 ? 'bg-amber-900/30 border-amber-800' : 'bg-emerald-900/30 border-emerald-800'}`}>
                  <p className="text-xs mb-1" style={{ color: payModal.pendingAmount > 0 ? '#fbbf24' : '#34d399' }}>
                    {payModal.pendingAmount > 0 ? 'Pending Amount' : 'Fully Paid'}
                  </p>
                  <p className="font-bold text-xl" style={{ color: payModal.pendingAmount > 0 ? '#fbbf24' : '#34d399' }}>
                    {fmt(payModal.pendingAmount)}
                  </p>
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Status:</span>
                  {statusBadge(payModal.paymentStatus)}
                </div>
                {payModal.paymentCompletionDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Completed On:</span>
                    <span className="text-emerald-400 font-semibold text-sm">{fmtDate(payModal.paymentCompletionDate)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Service Date:</span>
                  <span className="text-white text-sm">{fmtDate(payModal.serviceDate)}</span>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="bg-slate-700/20 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Bill Breakdown</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Spares</p>
                    <p className="text-white font-semibold">{fmt(payModal.spareCost)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Labour</p>
                    <p className="text-white font-semibold">{fmt(payModal.labourCost)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Other Charges</p>
                    <p className="text-white font-semibold">{fmt(payModal.otherChargesTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Add New Payment Form */}
              {payModal.paymentStatus !== 'Completed' && (
                <div className="bg-slate-700/30 border border-emerald-800/50 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-emerald-700 rounded-full flex items-center justify-center text-xs">+</span>
                    Add New Payment / Installment
                  </h3>
                  {success && (
                    <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm">
                      ✓ {success}
                    </div>
                  )}
                  <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Amount (₹) <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        value={payForm.amount}
                        onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                        placeholder={`Max pending: ${fmt(payModal.pendingAmount)}`}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Payment Method</label>
                      <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} className="input-field">
                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Payment Date <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        value={payForm.paymentDate}
                        onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Note (optional)</label>
                      <input
                        value={payForm.note}
                        onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                        placeholder="e.g. 2nd installment, UPI ref #12345"
                        className="input-field"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button type="submit" disabled={payLoading} className="btn-primary w-full py-3 text-base">
                        {payLoading ? 'Recording Payment...' : '💳 Record Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Completed Message */}
              {payModal.paymentStatus === 'Completed' && (
                <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 text-center">
                  <p className="text-emerald-400 text-2xl mb-1">✅</p>
                  <p className="text-emerald-400 font-bold text-lg">Payment Completed</p>
                  <p className="text-slate-400 text-sm mt-1">
                    All payments received · Completed on {fmtDate(payModal.paymentCompletionDate)}
                  </p>
                </div>
              )}

              {/* Payment History Table */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  📋 Payment History
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{payHistory.length} payments</span>
                </h3>
                {payHistory.length === 0 ? (
                  <div className="text-center py-6 bg-slate-700/20 rounded-xl border border-slate-700">
                    <p className="text-slate-500 text-sm">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left px-4 py-3">#</th>
                          <th className="text-left px-4 py-3">Payment Date</th>
                          <th className="text-left px-4 py-3">Amount</th>
                          <th className="text-left px-4 py-3">Method</th>
                          <th className="text-left px-4 py-3">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payHistory.map((p, idx) => (
                          <tr key={p._id} className="table-row">
                            <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{fmtDate(p.paymentDate)}</td>
                            <td className="px-4 py-3 text-emerald-400 font-bold">{fmt(p.amount)}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600">{p.method}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{p.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-700/50 border-t border-slate-600">
                          <td colSpan={2} className="px-4 py-3 text-slate-300 font-semibold">Total Collected</td>
                          <td className="px-4 py-3 text-emerald-400 font-bold text-base">
                            {fmt(payHistory.reduce((sum, p) => sum + p.amount, 0))}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
