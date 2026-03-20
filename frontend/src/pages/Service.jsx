import React, { useState, useEffect, useCallback } from 'react';
import { addService, getServices, deleteService, addServicePayment, getPaymentHistory, getSpares } from '../api';
import CustomerSearch from '../components/CustomerSearch';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer'];
const emptySpare = () => ({ spareId: '', spareName: '', sellingPrice: '', quantity: 1 });
const emptyCharge = () => ({ description: '', amount: '' });
const emptyForm = {
  customerId: '', customerName: '', vehicleName: '', kmRun: '',
  serviceType: '', labourCost: '', discount: '', paidAmount: '',
  serviceDate: '', paymentMode: 'Cash'
};
const emptyPayForm = { amount: '', method: 'Cash', paymentDate: '', note: '' };

export default function Service() {
  const [form, setForm] = useState(emptyForm);
  const [spareRows, setSpareRows] = useState([emptySpare()]);
  const [otherCharges, setOtherCharges] = useState([emptyCharge()]);
  const [services, setServices] = useState([]);
  const [sparesList, setSparesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payHistory, setPayHistory] = useState([]);
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [payLoading, setPayLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    setFetchLoading(true);
    try { const { data } = await getServices(); setServices(data); } catch {}
    setFetchLoading(false);
  }, []);

  const fetchSpares = useCallback(async () => {
    try { const { data } = await getSpares(); setSparesList(data); } catch {}
  }, []);

  useEffect(() => { fetchServices(); fetchSpares(); }, [fetchServices, fetchSpares]);

  // Live calculations
  const labourCost = parseFloat(form.labourCost) || 0;
  const spareCost = spareRows.reduce((s, r) =>
    s + (parseFloat(r.sellingPrice) || 0) * (parseFloat(r.quantity) || 1), 0);
  const otherTotal = otherCharges.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const grossTotal = labourCost + spareCost + otherTotal;
  const discount = parseFloat(form.discount) || 0;
  const totalBill = Math.max(0, grossTotal - discount);
  const paidAmount = parseFloat(form.paidAmount) || 0;
  const pendingAmount = Math.max(0, totalBill - paidAmount);
  const payStatus = paidAmount >= totalBill && totalBill > 0
    ? 'Completed' : paidAmount > 0 ? 'Partially Paid' : 'Pending';

  const getNextServiceDate = () => {
    const d = form.serviceDate ? new Date(form.serviceDate) : new Date();
    const n = new Date(d);
    n.setDate(n.getDate() + 90);
    return n.toLocaleDateString('en-IN');
  };

  const handleSpareSelect = (idx, spareName) => {
    const found = sparesList.find(s => s.spareName === spareName);
    setSpareRows(spareRows.map((r, i) => i === idx
      ? { ...r, spareId: found?._id || '', spareName, sellingPrice: found?.sellingPrice || '' }
      : r));
  };
  const handleSpareChange = (idx, field, val) =>
    setSpareRows(spareRows.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const addSpareRow = () => setSpareRows([...spareRows, emptySpare()]);
  const removeSpareRow = (idx) =>
    spareRows.length === 1 ? setSpareRows([emptySpare()]) : setSpareRows(spareRows.filter((_, i) => i !== idx));

  const handleChargeChange = (idx, field, val) =>
    setOtherCharges(otherCharges.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  const addCharge = () => setOtherCharges([...otherCharges, emptyCharge()]);
  const removeCharge = (idx) =>
    otherCharges.length === 1 ? setOtherCharges([emptyCharge()]) : setOtherCharges(otherCharges.filter((_, i) => i !== idx));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCustomerSelect = (c) => setForm({ ...form, customerId: c._id, customerName: c.name });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.customerId) return setError('Please select a customer');
    if (!form.vehicleName) return setError('Vehicle name is required');
    const validSpares = spareRows.filter(r => r.spareName.trim());
    const validCharges = otherCharges.filter(c => c.description.trim() && c.amount);
    setLoading(true);
    try {
      await addService({
        ...form, labourCost, discount, paidAmount,
        spareItems: validSpares.map(r => ({
          spareId: r.spareId || undefined,
          spareName: r.spareName.trim(),
          sellingPrice: parseFloat(r.sellingPrice) || 0,
          quantity: parseFloat(r.quantity) || 1
        })),
        otherCharges: validCharges.map(c => ({
          description: c.description.trim(),
          amount: parseFloat(c.amount) || 0
        }))
      });
      setSuccess('Service saved! Spare stock updated automatically.');
      setForm(emptyForm);
      setSpareRows([emptySpare()]);
      setOtherCharges([emptyCharge()]);
      setShowForm(false);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service record?')) return;
    try { await deleteService(id); fetchServices(); } catch { alert('Delete failed'); }
  };

  const openPayModal = async (svc) => {
    setPayModal(svc);
    setPayForm(emptyPayForm);
    try { const { data } = await getPaymentHistory(svc._id); setPayHistory(data); }
    catch { setPayHistory([]); }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!payForm.amount) return;
    setPayLoading(true);
    try {
      await addServicePayment(payModal._id, payForm);
      const { data: hist } = await getPaymentHistory(payModal._id);
      setPayHistory(hist);
      setPayForm(emptyPayForm);
      await fetchServices();
      const updated = await getServices();
      const found = updated.data.find(s => s._id === payModal._id);
      if (found) setPayModal(found);
    } catch { alert('Payment failed'); }
    setPayLoading(false);
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  const statusBadge = (s) => {
    if (s === 'Completed') return <span className="badge-paid">✅ Completed</span>;
    if (s === 'Partially Paid') return <span className="text-xs text-blue-400 bg-blue-900/30 border border-blue-800 px-2.5 py-0.5 rounded-full">🔄 Partially Paid</span>;
    return <span className="badge-pending">⏳ Pending</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Service</h1>
          <p className="text-slate-400 text-sm">Billing · Discount · Multi-payment · Spare stock auto-update</p>
        </div>
        <button onClick={() => {
          setShowForm(!showForm);
          setForm(emptyForm);
          setSpareRows([emptySpare()]);
          setOtherCharges([emptyCharge()]);
        }} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New Service'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5">New Service Record</h2>
          {success && <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm">✓ {success}</div>}
          {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Section 1 - Customer & Vehicle */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">① Customer & Vehicle Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Customer Name <span className="text-red-400">*</span></label>
                  <CustomerSearch onSelect={handleCustomerSelect} placeholder="Search customer..." />
                  {form.customerName && <p className="text-emerald-400 text-xs mt-1">✓ {form.customerName}</p>}
                </div>
                <div>
                  <label className="label">Vehicle Name <span className="text-red-400">*</span></label>
                  <input name="vehicleName" value={form.vehicleName} onChange={handleChange}
                    placeholder="e.g. Tata Nexon EV" className="input-field" required />
                </div>
                <div>
                  <label className="label">KM Run</label>
                  <input name="kmRun" type="number" value={form.kmRun} onChange={handleChange}
                    placeholder="Odometer reading" className="input-field" />
                </div>
                <div>
                  <label className="label">Service Type</label>
                  <input name="serviceType" value={form.serviceType} onChange={handleChange}
                    placeholder="e.g. Full service + brake check" className="input-field" />
                </div>
                <div>
                  <label className="label">Service Date</label>
                  <input name="serviceDate" type="date" value={form.serviceDate}
                    onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label">Payment Mode</label>
                  <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className="input-field">
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2 - Spare Parts */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">② Spare Parts Used</p>
              <div className="border border-slate-600 rounded-xl p-4 bg-slate-700/20">
                <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                  <div className="col-span-5 text-slate-400 text-xs font-medium">Part Name</div>
                  <div className="col-span-3 text-slate-400 text-xs font-medium">Selling Price (₹)</div>
                  <div className="col-span-2 text-slate-400 text-xs font-medium">Qty</div>
                  <div className="col-span-1 text-slate-400 text-xs font-medium text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="space-y-2">
                  {spareRows.map((row, idx) => {
                    const rowTotal = (parseFloat(row.sellingPrice) || 0) * (parseFloat(row.quantity) || 1);
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <select value={row.spareName}
                            onChange={(e) => handleSpareSelect(idx, e.target.value)}
                            className="input-field text-sm py-2">
                            <option value="">-- Select Part --</option>
                            {sparesList.map(s => (
                              <option key={s._id} value={s.spareName}>
                                {s.spareName} (Stock: {s.quantity})
                              </option>
                            ))}
                            <option value="__manual__">+ Type manually</option>
                          </select>
                          {row.spareName === '__manual__' && (
                            <input className="input-field text-sm py-2 mt-1"
                              placeholder="Enter part name"
                              onChange={(e) => handleSpareChange(idx, 'spareName', e.target.value)} />
                          )}
                        </div>
                        <div className="col-span-3">
                          <input type="number" value={row.sellingPrice}
                            onChange={(e) => handleSpareChange(idx, 'sellingPrice', e.target.value)}
                            placeholder="Auto-filled" className="input-field text-sm py-2" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="1" value={row.quantity}
                            onChange={(e) => handleSpareChange(idx, 'quantity', e.target.value)}
                            className="input-field text-sm py-2" />
                        </div>
                        <div className="col-span-1 text-emerald-400 text-sm font-semibold text-right">
                          {fmt(rowTotal)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeSpareRow(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-red-900/40 hover:bg-red-800 text-red-400 text-xs">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={addSpareRow}
                  className="mt-3 text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1">
                  <span className="text-lg font-bold">+</span> Add Spare Part
                </button>
              </div>
            </div>

            {/* Section 3 - Labour */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">③ Labour Charges</p>
              <div className="max-w-xs">
                <label className="label">Labour Cost (₹)</label>
                <input name="labourCost" type="number" value={form.labourCost}
                  onChange={handleChange} placeholder="0" className="input-field" />
              </div>
            </div>

            {/* Section 4 - Other Charges */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                ④ Other Charges <span className="text-slate-500 normal-case font-normal">(Courier, Transport, etc.)</span>
              </p>
              <div className="border border-slate-600 rounded-xl p-4 bg-slate-700/20">
                <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                  <div className="col-span-8 text-slate-400 text-xs font-medium">Description</div>
                  <div className="col-span-3 text-slate-400 text-xs font-medium">Amount (₹)</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="space-y-2">
                  {otherCharges.map((c, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-8">
                        <input value={c.description}
                          onChange={(e) => handleChargeChange(idx, 'description', e.target.value)}
                          placeholder="e.g. Courier, Transport, Packaging"
                          className="input-field text-sm py-2" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" value={c.amount}
                          onChange={(e) => handleChargeChange(idx, 'amount', e.target.value)}
                          placeholder="0" className="input-field text-sm py-2" />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button type="button" onClick={() => removeCharge(idx)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-red-900/40 hover:bg-red-800 text-red-400 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addCharge}
                  className="mt-3 text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1">
                  <span className="text-lg font-bold">+</span> Add More Charge
                </button>
              </div>
            </div>

            {/* Section 5 - Bill Summary with Discount */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-5">
              <p className="text-white font-semibold mb-4">💰 Bill Summary</p>

              {/* Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Spares</p>
                  <p className="text-white font-semibold">{fmt(spareCost)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Labour</p>
                  <p className="text-white font-semibold">{fmt(labourCost)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Other Charges</p>
                  <p className="text-white font-semibold">{fmt(otherTotal)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Gross Total</p>
                  <p className="text-white font-semibold">{fmt(grossTotal)}</p>
                </div>
              </div>

              {/* Discount Row */}
              <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="label">🏷️ Discount (₹)</label>
                    <input
                      name="discount"
                      type="number"
                      value={form.discount}
                      onChange={handleChange}
                      placeholder="Enter discount amount (0 for no discount)"
                      className="input-field"
                    />
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4 min-w-[180px] text-right">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Gross Total:</span>
                      <span className="text-white font-medium">{fmt(grossTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Discount:</span>
                      <span className="text-red-400 font-medium">- {fmt(discount)}</span>
                    </div>
                    <div className="border-t border-slate-600 pt-2 flex justify-between">
                      <span className="text-emerald-400 text-sm font-semibold">Total Bill:</span>
                      <span className="text-emerald-400 font-bold text-xl">{fmt(totalBill)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Amount Paid (₹)</label>
                  <input name="paidAmount" type="number" value={form.paidAmount}
                    onChange={handleChange} placeholder="0" className="input-field" />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Pending Amount</p>
                    <p className="font-bold text-lg" style={{ color: pendingAmount > 0 ? '#fbbf24' : '#34d399' }}>
                      {fmt(pendingAmount)}
                    </p>
                    <span className="text-xs mt-1 inline-block">{statusBadge(payStatus)}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Next Service Due</p>
                    <p className="text-blue-400 font-semibold text-sm">{getNextServiceDate()}</p>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary text-base px-8 py-3">
              {loading ? 'Saving...' : '💾 Save Service Record'}
            </button>
          </form>
        </div>
      )}

      {/* Services Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">
          All Service Records ({services.length})
        </h2>
        {fetchLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No service records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Customer', 'Vehicle', 'Spares', 'Labour', 'Others', 'Gross', 'Discount', 'Total', 'Paid', 'Pending', 'Status', 'Date', 'Completed On', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <React.Fragment key={s._id}>
                    <tr className="table-row cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === s._id ? null : s._id)}>
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{s.customerName}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{s.vehicleName}</td>
                      <td className="px-4 py-3 text-slate-300">{fmt(s.spareCost)}</td>
                      <td className="px-4 py-3 text-slate-300">{fmt(s.labourCost)}</td>
                      <td className="px-4 py-3 text-slate-300">{fmt(s.otherChargesTotal)}</td>
                      <td className="px-4 py-3 text-slate-300">{fmt(s.grossTotal || (s.spareCost + s.labourCost + s.otherChargesTotal))}</td>
                      <td className="px-4 py-3 text-red-400">- {fmt(s.discount)}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(s.totalBill)}</td>
                      <td className="px-4 py-3 text-slate-300">{fmt(s.paidAmount)}</td>
                      <td className="px-4 py-3 text-amber-400 font-semibold">{fmt(s.pendingAmount)}</td>
                      <td className="px-4 py-3">{statusBadge(s.paymentStatus)}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(s.serviceDate)}</td>
                      <td className="px-4 py-3 text-emerald-400 whitespace-nowrap">
                        {s.paymentCompletionDate ? fmtDate(s.paymentCompletionDate) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {s.paymentStatus !== 'Completed' && (
                            <button onClick={(e) => { e.stopPropagation(); openPayModal(s); }}
                              className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg">
                              💳 Pay
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); openPayModal(s); }}
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded-lg">
                            📋
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(s._id); }}
                            className="btn-danger text-xs py-1 px-2">🗑</button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === s._id && (
                      <tr className="bg-slate-800/80">
                        <td colSpan={14} className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {s.spareItems?.length > 0 && (
                              <div>
                                <p className="text-slate-400 text-xs font-semibold mb-2 uppercase">Spare Parts</p>
                                {s.spareItems.map((item, i) => (
                                  <div key={i} className="bg-slate-700/60 rounded px-3 py-2 mb-1 flex justify-between">
                                    <p className="text-white text-xs">{item.spareName} × {item.quantity}</p>
                                    <p className="text-emerald-400 text-xs">{fmt(item.sellingPrice * item.quantity)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {s.otherCharges?.length > 0 && (
                              <div>
                                <p className="text-slate-400 text-xs font-semibold mb-2 uppercase">Other Charges</p>
                                {s.otherCharges.map((c, i) => (
                                  <div key={i} className="bg-slate-700/60 rounded px-3 py-2 mb-1 flex justify-between">
                                    <p className="text-white text-xs">{c.description}</p>
                                    <p className="text-blue-400 text-xs">{fmt(c.amount)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div>
                              <p className="text-slate-400 text-xs font-semibold mb-2 uppercase">Bill Breakdown</p>
                              <div className="bg-slate-700/60 rounded px-3 py-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-400">Gross Total</span>
                                  <span className="text-white">{fmt(s.grossTotal || s.totalBill)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-400">Discount</span>
                                  <span className="text-red-400">- {fmt(s.discount)}</span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-slate-600 pt-1">
                                  <span className="text-emerald-400 font-semibold">Total Bill</span>
                                  <span className="text-emerald-400 font-bold">{fmt(s.totalBill)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">Payment Management</h2>
                <p className="text-slate-400 text-sm">{payModal.customerName} · {payModal.vehicleName}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                  <p className="text-slate-400 text-xs mb-1">Total Bill</p>
                  <p className="text-white font-bold text-lg">{fmt(payModal.totalBill)}</p>
                  {payModal.discount > 0 && (
                    <p className="text-red-400 text-xs">Discount: {fmt(payModal.discount)}</p>
                  )}
                </div>
                <div className="bg-emerald-900/30 border border-emerald-800 rounded-xl p-3 text-center">
                  <p className="text-emerald-400 text-xs mb-1">Amount Paid</p>
                  <p className="text-emerald-400 font-bold text-lg">{fmt(payModal.paidAmount)}</p>
                </div>
                <div className="bg-amber-900/30 border border-amber-800 rounded-xl p-3 text-center">
                  <p className="text-amber-400 text-xs mb-1">Pending</p>
                  <p className="text-amber-400 font-bold text-lg">{fmt(payModal.pendingAmount)}</p>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3 mb-5 flex flex-wrap gap-4 text-sm">
                <div><span className="text-slate-400">Service Date: </span>
                  <span className="text-white">{fmtDate(payModal.serviceDate)}</span></div>
                <div><span className="text-slate-400">Status: </span>{statusBadge(payModal.paymentStatus)}</div>
                {payModal.paymentCompletionDate && (
                  <div><span className="text-slate-400">Completed On: </span>
                    <span className="text-emerald-400 font-semibold">{fmtDate(payModal.paymentCompletionDate)}</span>
                  </div>
                )}
              </div>

              {payModal.paymentStatus !== 'Completed' && (
                <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4 mb-5">
                  <h3 className="text-white font-semibold mb-3">Add Payment / Installment</h3>
                  <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Amount (₹) <span className="text-red-400">*</span></label>
                      <input type="number" value={payForm.amount}
                        onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                        placeholder={`Pending: ${fmt(payModal.pendingAmount)}`}
                        className="input-field" required />
                    </div>
                    <div>
                      <label className="label">Payment Method</label>
                      <select value={payForm.method}
                        onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                        className="input-field">
                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Payment Date</label>
                      <input type="date" value={payForm.paymentDate}
                        onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="label">Note (optional)</label>
                      <input value={payForm.note}
                        onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                        placeholder="e.g. 2nd installment" className="input-field" />
                    </div>
                    <div className="sm:col-span-2">
                      <button type="submit" disabled={payLoading} className="btn-primary w-full">
                        {payLoading ? 'Saving...' : '💳 Add Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div>
                <h3 className="text-white font-semibold mb-3">Payment History</h3>
                {payHistory.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No payments recorded yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header">
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">Date</th>
                        <th className="text-left px-3 py-2">Amount</th>
                        <th className="text-left px-3 py-2">Method</th>
                        <th className="text-left px-3 py-2">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payHistory.map((p, idx) => (
                        <tr key={p._id} className="table-row">
                          <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 text-slate-300">{fmtDate(p.paymentDate)}</td>
                          <td className="px-3 py-2 text-emerald-400 font-semibold">{fmt(p.amount)}</td>
                          <td className="px-3 py-2">
                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{p.method}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-400">{p.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-700/50">
                        <td colSpan={2} className="px-3 py-2 text-slate-400 font-semibold">Total Paid</td>
                        <td className="px-3 py-2 text-emerald-400 font-bold">
                          {fmt(payHistory.reduce((s, p) => s + p.amount, 0))}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}