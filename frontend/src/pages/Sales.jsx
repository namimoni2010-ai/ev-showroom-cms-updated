import React, { useState, useEffect, useCallback } from 'react';
import { addSale, getSales, updateSale, deleteSale } from '../api';
import CustomerSearch from '../components/CustomerSearch';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer'];
const emptyForm = {
  customerId: '', customerName: '', vehicleName: '', vehicleType: '',
  range: '', price: '', discount: '', paidAmount: '', salesDate: '', paymentMode: 'Cash'
};

export default function Sales() {
  const [form, setForm] = useState(emptyForm);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchSales = useCallback(async () => {
    setFetchLoading(true);
    try { const { data } = await getSales(); setSales(data); } catch {}
    setFetchLoading(false);
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // Live calculations
  const price = parseFloat(form.price) || 0;
  const discount = parseFloat(form.discount) || 0;
  const finalPrice = Math.max(0, price - discount);
  const paidAmount = parseFloat(form.paidAmount) || 0;
  const pendingAmount = Math.max(0, finalPrice - paidAmount);
  const paymentStatus = pendingAmount <= 0 && finalPrice > 0 ? 'Paid' : 'Pending';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCustomerSelect = (c) => setForm({ ...form, customerId: c._id, customerName: c.name });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!editId && !form.customerId) return setError('Please select a customer');
    if (!form.vehicleName || !form.price) return setError('Vehicle name and price are required');
    setLoading(true);
    try {
      if (editId) {
        await updateSale(editId, {
          ...form, price, discount, finalPrice,
          paidAmount, pendingAmount, paymentStatus
        });
        setSuccess('Sale updated successfully!');
      } else {
        await addSale({
          ...form, price, discount, paidAmount,
          salesDate: form.salesDate || new Date()
        });
        setSuccess('Sale added! Vehicle stock updated automatically.');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      fetchSales();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
    setLoading(false);
  };

  const handleEdit = (s) => {
    setForm({
      customerId: s.customerId?._id || s.customerId || '',
      customerName: s.customerName,
      vehicleName: s.vehicleName,
      vehicleType: s.vehicleType || '',
      range: s.range || '',
      price: s.price,
      discount: s.discount || 0,
      paidAmount: s.paidAmount || 0,
      salesDate: s.salesDate ? new Date(s.salesDate).toISOString().split('T')[0] : '',
      paymentMode: s.paymentMode || 'Cash'
    });
    setEditId(s._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale record?')) return;
    try { await deleteSale(id); fetchSales(); }
    catch { alert('Delete failed'); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="text-slate-400 text-sm">
            Vehicle sales records · Discount · Stock auto-decrements on save
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}
          className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New Sale'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5">
            {editId ? 'Edit Sale' : 'Add New Sale'}
          </h2>
          {success && (
            <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Customer & Vehicle Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Customer Name <span className="text-red-400">*</span></label>
                {editId ? (
                  <input value={form.customerName} disabled className="input-field opacity-60" />
                ) : (
                  <>
                    <CustomerSearch onSelect={handleCustomerSelect} placeholder="Search customer..." />
                    {form.customerName && (
                      <p className="text-emerald-400 text-xs mt-1">✓ {form.customerName}</p>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="label">Vehicle Name <span className="text-red-400">*</span></label>
                <input
                  name="vehicleName"
                  value={form.vehicleName}
                  onChange={handleChange}
                  placeholder="e.g. Tata Nexon EV"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={handleChange}
                  className="input-field">
                  <option value="">Select type</option>
                  {['Sedan', 'SUV', 'Hatchback', 'MUV', '2-Wheeler', '3-Wheeler'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Vehicle Range (km)</label>
                <input
                  name="range"
                  value={form.range}
                  onChange={handleChange}
                  placeholder="e.g. 400 km"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Vehicle Price (₹) <span className="text-red-400">*</span></label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">🏷️ Discount (₹)</label>
                <input
                  name="discount"
                  type="number"
                  value={form.discount}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Amount Paid (₹)</label>
                <input
                  name="paidAmount"
                  type="number"
                  value={form.paidAmount}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Mode of Payment</label>
                <select
                  name="paymentMode"
                  value={form.paymentMode}
                  onChange={handleChange}
                  className="input-field">
                  {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sales Date</label>
                <input
                  name="salesDate"
                  type="date"
                  value={form.salesDate}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Bill Summary */}
            {price > 0 && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-5">
                <p className="text-white font-semibold text-sm mb-4">💰 Bill Summary</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Vehicle Price</p>
                    <p className="text-white font-semibold text-lg">{fmt(price)}</p>
                  </div>
                  <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">🏷️ Discount</p>
                    <p className="text-red-400 font-semibold text-lg">- {fmt(discount)}</p>
                  </div>
                  <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Final Price</p>
                    <p className="text-emerald-400 font-bold text-lg">{fmt(finalPrice)}</p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{
                      background: pendingAmount > 0 ? '#451a03' : '#022c22',
                      border: pendingAmount > 0 ? '1px solid #92400e' : '1px solid #065f46'
                    }}>
                    <p className="text-slate-400 text-xs mb-1">Pending Amount</p>
                    <p className="font-bold text-lg"
                      style={{ color: pendingAmount > 0 ? '#fbbf24' : '#34d399' }}>
                      {fmt(pendingAmount)}
                    </p>
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="bg-slate-800/60 rounded-lg px-4 py-3 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Price:</span>
                    <span className="text-white font-medium">{fmt(price)}</span>
                  </div>
                  <span className="text-slate-600">−</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Discount:</span>
                    <span className="text-red-400 font-medium">{fmt(discount)}</span>
                  </div>
                  <span className="text-slate-600">=</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Final Price:</span>
                    <span className="text-emerald-400 font-bold">{fmt(finalPrice)}</span>
                  </div>
                  <span className="text-slate-600">·</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Paid:</span>
                    <span className="text-white font-medium">{fmt(paidAmount)}</span>
                  </div>
                  <span className="text-slate-600">·</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Status:</span>
                    <span className={paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}>
                      {paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : editId ? '💾 Update Sale' : '💾 Save Sale'}
            </button>
          </form>
        </div>
      )}

      {/* Sales Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">
          All Sales ({sales.length})
        </h2>
        {fetchLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sales.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No sales records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Customer', 'Vehicle', 'Type', 'Price', 'Discount', 'Final Price', 'Paid', 'Pending', 'Pay Mode', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id} className="table-row">
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      {s.customerName}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {s.vehicleName}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {s.vehicleType || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {fmt(s.price)}
                    </td>
                    <td className="px-4 py-3 text-red-400">
                      {s.discount > 0 ? `- ${fmt(s.discount)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">
                      {fmt(s.finalPrice)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {fmt(s.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-semibold">
                      {fmt(s.pendingAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                        {s.paymentMode || 'Cash'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={s.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {fmtDate(s.salesDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(s)}
                          className="btn-secondary text-xs py-1 px-2">
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="btn-danger text-xs py-1 px-2">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}