import React, { useState } from 'react';
import {
  searchCustomers, getCustomerById,
  getSalesByCustomer, getServicesByCustomer,
  updateSale, updateService, deleteSale, deleteService,
  getPaymentHistory
} from '../api';

export default function ViewCustomer() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sales, setSales] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedSale, setExpandedSale] = useState(null);
  const [expandedService, setExpandedService] = useState(null);
  const [servicePayHistory, setServicePayHistory] = useState({});

  // Edit states
  const [editSaleId, setEditSaleId] = useState(null);
  const [editSaleForm, setEditSaleForm] = useState({});
  const [editServiceId, setEditServiceId] = useState(null);
  const [editServiceForm, setEditServiceForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    setSearching(true);
    try { const { data } = await searchCustomers(val); setSuggestions(data); setShowDropdown(true); }
    catch { setSuggestions([]); }
    setSearching(false);
  };

  const handleSelect = async (customer) => {
    setShowDropdown(false);
    setQuery(customer.name);
    setLoading(true);
    setEditSaleId(null);
    setEditServiceId(null);
    setEditSuccess('');
    try {
      const [cRes, saleRes, svcRes] = await Promise.all([
        getCustomerById(customer._id),
        getSalesByCustomer(customer._id),
        getServicesByCustomer(customer._id)
      ]);
      setSelected(cRes.data);
      setSales(saleRes.data);
      setServices(svcRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadPayHistory = async (serviceId) => {
    if (servicePayHistory[serviceId]) return;
    try {
      const { data } = await getPaymentHistory(serviceId);
      setServicePayHistory(prev => ({ ...prev, [serviceId]: data }));
    } catch { }
  };

  // Sale Edit
  const handleEditSale = (sale) => {
    setEditSaleId(sale._id);
    setEditSaleForm({
      vehicleName: sale.vehicleName || '',
      vehicleType: sale.vehicleType || '',
      range: sale.range || '',
      price: sale.price || '',
      discount: sale.discount || 0,
      paidAmount: sale.paidAmount || 0,
      paymentMode: sale.paymentMode || 'Cash',
      salesDate: sale.salesDate ? new Date(sale.salesDate).toISOString().split('T')[0] : ''
    });
    setEditSuccess('');
  };

  const handleSaveSale = async (saleId) => {
    setEditLoading(true);
    try {
      const price = parseFloat(editSaleForm.price) || 0;
      const discount = parseFloat(editSaleForm.discount) || 0;
      const finalPrice = Math.max(0, price - discount);
      const paidAmount = parseFloat(editSaleForm.paidAmount) || 0;
      const pendingAmount = Math.max(0, finalPrice - paidAmount);
      const paymentStatus = pendingAmount <= 0 && finalPrice > 0 ? 'Paid' : 'Pending';
      await updateSale(saleId, { ...editSaleForm, price, discount, finalPrice, paidAmount, pendingAmount, paymentStatus });
      setEditSaleId(null);
      setEditSuccess('Sale updated successfully!');
      const saleRes = await getSalesByCustomer(selected._id);
      setSales(saleRes.data);
    } catch { alert('Update failed'); }
    setEditLoading(false);
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Delete this sale record?')) return;
    try {
      await deleteSale(saleId);
      const saleRes = await getSalesByCustomer(selected._id);
      setSales(saleRes.data);
    } catch { alert('Delete failed'); }
  };

  // Service Edit
  const handleEditService = (svc) => {
    setEditServiceId(svc._id);
    setEditServiceForm({
      vehicleName: svc.vehicleName || '',
      kmRun: svc.kmRun || '',
      serviceType: svc.serviceType || '',
      labourCost: svc.labourCost || 0,
      discount: svc.discount || 0,
      paidAmount: svc.paidAmount || 0,
      paymentMode: svc.paymentMode || 'Cash',
      serviceDate: svc.serviceDate ? new Date(svc.serviceDate).toISOString().split('T')[0] : ''
    });
    setEditSuccess('');
  };

  const handleSaveService = async (svcId) => {
    setEditLoading(true);
    try {
      await updateService(svcId, editServiceForm);
      setEditServiceId(null);
      setEditSuccess('Service updated successfully!');
      const svcRes = await getServicesByCustomer(selected._id);
      setServices(svcRes.data);
    } catch { alert('Update failed'); }
    setEditLoading(false);
  };

  const handleDeleteService = async (svcId) => {
    if (!window.confirm('Delete this service record?')) return;
    try {
      await deleteService(svcId);
      const svcRes = await getServicesByCustomer(selected._id);
      setServices(svcRes.data);
    } catch { alert('Delete failed'); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  const statusBadge = (s) => {
    if (s === 'Completed' || s === 'Paid') return <span className="badge-paid">{s}</span>;
    if (s === 'Partially Paid') return <span className="text-xs text-blue-400 bg-blue-900/30 border border-blue-800 px-2.5 py-0.5 rounded-full">{s}</span>;
    return <span className="badge-pending">{s}</span>;
  };

  const totalSalesPending = sales.filter(s => s.paymentStatus === 'Pending').reduce((a, s) => a + (s.pendingAmount || 0), 0);
  const totalSvcPending = services.filter(s => ['Pending', 'Partially Paid'].includes(s.paymentStatus)).reduce((a, s) => a + (s.pendingAmount || 0), 0);

  return (
    <div>
      <h1 className="page-title">View Customer</h1>
      <p className="page-subtitle">Search customer to view full profile, sales, service history and edit records</p>

      {/* Search */}
      <div className="card mb-6">
        <label className="label">Search by Name or Phone Number</label>
        <div className="relative max-w-lg">
          <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type customer name or phone..." className="input-field pr-10" />
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-52 overflow-y-auto">
              {suggestions.map((c) => (
                <li key={c._id} onClick={() => handleSelect(c)}
                  className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0">
                  <p className="text-white text-sm font-medium">{c.name}</p>
                  <p className="text-slate-400 text-xs">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
          {showDropdown && query && suggestions.length === 0 && !searching && (
            <div className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 px-4 py-3 text-slate-400 text-sm">
              No customers found
            </div>
          )}
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}

      {selected && !loading && (
        <div className="space-y-6">

          {editSuccess && (
            <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg text-sm">
              ✓ {editSuccess}
            </div>
          )}

          {/* Customer Profile */}
          <div className="card">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                {selected.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3">
                    <p className="text-slate-400 text-xs">Phone</p>
                    <p className="text-white font-medium mt-0.5">{selected.phone}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3">
                    <p className="text-slate-400 text-xs">Email</p>
                    <p className="text-white font-medium mt-0.5">{selected.email || '—'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3">
                    <p className="text-slate-400 text-xs">Address</p>
                    <p className="text-white font-medium mt-0.5">{selected.address || '—'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3">
                    <p className="text-slate-400 text-xs">Total Pending</p>
                    <p className="text-amber-400 font-bold text-lg mt-0.5">{fmt(totalSalesPending + totalSvcPending)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3 text-center">
                    <p className="text-slate-400 text-xs">Total Sales</p>
                    <p className="text-emerald-400 text-xl font-bold">{sales.length}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3 text-center">
                    <p className="text-slate-400 text-xs">Total Services</p>
                    <p className="text-blue-400 text-xl font-bold">{services.length}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3 text-center">
                    <p className="text-slate-400 text-xs">Sales Pending</p>
                    <p className="text-amber-400 text-xl font-bold">{fmt(totalSalesPending)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SALES HISTORY ── */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🚗 Sales History
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{sales.length}</span>
              {totalSalesPending > 0 && <span className="ml-auto text-xs text-amber-400">Pending: {fmt(totalSalesPending)}</span>}
            </h3>
            {sales.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No sales records found</p>
            ) : (
              <div className="space-y-4">
                {sales.map((s) => (
                  <div key={s._id} className="bg-slate-700/30 border border-slate-600 rounded-xl overflow-hidden">
                    {/* Sale Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-600/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center text-lg">🚗</div>
                        <div>
                          <p className="text-white font-semibold">{s.vehicleName}</p>
                          <p className="text-slate-400 text-xs">{s.vehicleType || '—'} · {s.range || '—'} · {fmtDate(s.salesDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(s.paymentStatus)}
                        <button onClick={() => { setExpandedSale(expandedSale === s._id ? null : s._id); }}
                          className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg">
                          {expandedSale === s._id ? '▲ Hide' : '▼ Details'}
                        </button>
                        <button onClick={() => handleEditSale(s)}
                          className="btn-secondary text-xs py-1.5 px-3">✏️ Edit</button>
                        <button onClick={() => handleDeleteSale(s._id)}
                          className="btn-danger text-xs py-1.5 px-3">🗑</button>
                      </div>
                    </div>

                    {/* Sale Summary Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-5 py-3">
                      <div><p className="text-slate-400 text-xs">Vehicle Price</p><p className="text-white font-semibold">{fmt(s.price)}</p></div>
                      <div><p className="text-slate-400 text-xs">Discount</p><p className="text-red-400 font-semibold">- {fmt(s.discount)}</p></div>
                      <div><p className="text-slate-400 text-xs">Final Price</p><p className="text-emerald-400 font-bold">{fmt(s.finalPrice)}</p></div>
                      <div><p className="text-slate-400 text-xs">Paid</p><p className="text-white font-semibold">{fmt(s.paidAmount)}</p></div>
                      <div><p className="text-slate-400 text-xs">Pending</p>
                        <p className="font-semibold" style={{ color: s.pendingAmount > 0 ? '#fbbf24' : '#34d399' }}>{fmt(s.pendingAmount)}</p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedSale === s._id && (
                      <div className="px-5 py-4 bg-slate-800/50 border-t border-slate-600/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div><p className="text-slate-400 text-xs mb-1">Payment Mode</p>
                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{s.paymentMode || 'Cash'}</span>
                          </div>
                          <div><p className="text-slate-400 text-xs mb-1">Sales Date</p>
                            <p className="text-white">{fmtDate(s.salesDate)}</p>
                          </div>
                          <div><p className="text-slate-400 text-xs mb-1">Vehicle Type</p>
                            <p className="text-white">{s.vehicleType || '—'}</p>
                          </div>
                          <div><p className="text-slate-400 text-xs mb-1">Range</p>
                            <p className="text-white">{s.range || '—'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edit Sale Form */}
                    {editSaleId === s._id && (
                      <div className="px-5 py-4 bg-slate-800/80 border-t border-emerald-800/50">
                        <p className="text-emerald-400 text-sm font-semibold mb-3">✏️ Edit Sale Record</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="label">Vehicle Name</label>
                            <input value={editSaleForm.vehicleName} onChange={(e) => setEditSaleForm({ ...editSaleForm, vehicleName: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">Vehicle Type</label>
                            <select value={editSaleForm.vehicleType} onChange={(e) => setEditSaleForm({ ...editSaleForm, vehicleType: e.target.value })} className="input-field">
                              <option value="">Select type</option>
                              {['Sedan', 'SUV', 'Hatchback', 'MUV', '2-Wheeler', '3-Wheeler'].map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="label">Range (km)</label>
                            <input value={editSaleForm.range} onChange={(e) => setEditSaleForm({ ...editSaleForm, range: e.target.value })} className="input-field" placeholder="e.g. 400 km" />
                          </div>
                          <div>
                            <label className="label">Price (₹)</label>
                            <input type="number" value={editSaleForm.price} onChange={(e) => setEditSaleForm({ ...editSaleForm, price: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">Discount (₹)</label>
                            <input type="number" value={editSaleForm.discount} onChange={(e) => setEditSaleForm({ ...editSaleForm, discount: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">Amount Paid (₹)</label>
                            <input type="number" value={editSaleForm.paidAmount} onChange={(e) => setEditSaleForm({ ...editSaleForm, paidAmount: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">Payment Mode</label>
                            <select value={editSaleForm.paymentMode} onChange={(e) => setEditSaleForm({ ...editSaleForm, paymentMode: e.target.value })} className="input-field">
                              {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="label">Sales Date</label>
                            <input type="date" value={editSaleForm.salesDate} onChange={(e) => setEditSaleForm({ ...editSaleForm, salesDate: e.target.value })} className="input-field" />
                          </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button onClick={() => handleSaveSale(s._id)} disabled={editLoading} className="btn-primary text-sm">
                            {editLoading ? 'Saving...' : '💾 Save Changes'}
                          </button>
                          <button onClick={() => setEditSaleId(null)} className="btn-secondary text-sm">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SERVICE HISTORY ── */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🔧 Service History
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{services.length}</span>
              {totalSvcPending > 0 && <span className="ml-auto text-xs text-amber-400">Pending: {fmt(totalSvcPending)}</span>}
            </h3>
            {services.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No service records found</p>
            ) : (
              <div className="space-y-4">
                {services.map((s) => (
                  <div key={s._id} className="bg-slate-700/30 border border-slate-600 rounded-xl overflow-hidden">
                    {/* Service Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-600/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center text-lg">🔧</div>
                        <div>
                          <p className="text-white font-semibold">{s.vehicleName}</p>
                          <p className="text-slate-400 text-xs">{fmtDate(s.serviceDate)} · {s.kmRun ? `${s.kmRun.toLocaleString()} km` : '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(s.paymentStatus)}
                        <button onClick={() => {
                          setExpandedService(expandedService === s._id ? null : s._id);
                          if (expandedService !== s._id) loadPayHistory(s._id);
                        }} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg">
                          {expandedService === s._id ? '▲ Hide' : '▼ Details'}
                        </button>
                        <button onClick={() => handleEditService(s)} className="btn-secondary text-xs py-1.5 px-3">✏️ Edit</button>
                        <button onClick={() => handleDeleteService(s._id)} className="btn-danger text-xs py-1.5 px-3">🗑</button>
                      </div>
                    </div>

                    {/* Service Description */}
                    {s.serviceType && (
                      <div className="px-5 py-2 bg-slate-800/30 border-b border-slate-700/50">
                        <p className="text-slate-400 text-xs">Service Description:</p>
                        <p className="text-white text-sm mt-0.5">{s.serviceType}</p>
                      </div>
                    )}

                    {/* Service Bill Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 px-5 py-3">
                      <div><p className="text-slate-400 text-xs">Spares</p><p className="text-white font-semibold">{fmt(s.spareCost)}</p></div>
                      <div><p className="text-slate-400 text-xs">Labour</p><p className="text-white font-semibold">{fmt(s.labourCost)}</p></div>
                      <div><p className="text-slate-400 text-xs">Others</p><p className="text-white font-semibold">{fmt(s.otherChargesTotal)}</p></div>
                      <div><p className="text-slate-400 text-xs">Discount</p><p className="text-red-400 font-semibold">- {fmt(s.discount)}</p></div>
                      <div><p className="text-slate-400 text-xs">Total Bill</p><p className="text-emerald-400 font-bold">{fmt(s.totalBill)}</p></div>
                      <div><p className="text-slate-400 text-xs">Pending</p>
                        <p className="font-semibold" style={{ color: s.pendingAmount > 0 ? '#fbbf24' : '#34d399' }}>{fmt(s.pendingAmount)}</p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedService === s._id && (
                      <div className="px-5 py-4 bg-slate-800/50 border-t border-slate-600/50 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                          {/* Spare Parts */}
                          {s.spareItems?.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Spare Parts Used</p>
                              {s.spareItems.map((item, i) => (
                                <div key={i} className="bg-slate-700/60 rounded px-3 py-2 mb-1 flex justify-between">
                                  <p className="text-white text-xs">{item.spareName} × {item.quantity}</p>
                                  <p className="text-emerald-400 text-xs">{fmt(item.sellingPrice * item.quantity)}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Other Charges */}
                          {s.otherCharges?.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Other Charges</p>
                              {s.otherCharges.map((c, i) => (
                                <div key={i} className="bg-slate-700/60 rounded px-3 py-2 mb-1 flex justify-between">
                                  <p className="text-white text-xs">{c.description}</p>
                                  <p className="text-blue-400 text-xs">{fmt(c.amount)}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Bill Breakdown */}
                          <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Bill Breakdown</p>
                            <div className="bg-slate-700/60 rounded px-3 py-3 space-y-1.5 text-xs">
                              <div className="flex justify-between"><span className="text-slate-400">Spares</span><span className="text-white">{fmt(s.spareCost)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Labour</span><span className="text-white">{fmt(s.labourCost)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Other</span><span className="text-white">{fmt(s.otherChargesTotal)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Gross</span><span className="text-white">{fmt(s.grossTotal || s.totalBill)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Discount</span><span className="text-red-400">- {fmt(s.discount)}</span></div>
                              <div className="flex justify-between border-t border-slate-600 pt-1.5">
                                <span className="text-emerald-400 font-semibold">Total Bill</span>
                                <span className="text-emerald-400 font-bold">{fmt(s.totalBill)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Paid</span>
                                <span className="text-white">{fmt(s.paidAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-amber-400">Pending</span>
                                <span className="text-amber-400 font-semibold">{fmt(s.pendingAmount)}</span>
                              </div>
                              {s.paymentCompletionDate && (
                                <div className="flex justify-between border-t border-slate-600 pt-1.5">
                                  <span className="text-emerald-400">Completed On</span>
                                  <span className="text-emerald-400">{fmtDate(s.paymentCompletionDate)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment History */}
                        {servicePayHistory[s._id]?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Payment History</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-400">
                                    <th className="text-left pb-2">#</th>
                                    <th className="text-left pb-2">Date</th>
                                    <th className="text-left pb-2">Amount</th>
                                    <th className="text-left pb-2">Method</th>
                                    <th className="text-left pb-2">Note</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {servicePayHistory[s._id].map((p, idx) => (
                                    <tr key={p._id} className="border-t border-slate-700">
                                      <td className="py-1.5 text-slate-400">{idx + 1}</td>
                                      <td className="py-1.5 text-white">{fmtDate(p.paymentDate)}</td>
                                      <td className="py-1.5 text-emerald-400 font-semibold">{fmt(p.amount)}</td>
                                      <td className="py-1.5"><span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{p.method}</span></td>
                                      <td className="py-1.5 text-slate-400">{p.note || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Next Service */}
                        <div className="flex gap-4 text-sm">
                          <div><span className="text-slate-400">Next Service Due: </span><span className="text-blue-400 font-semibold">{fmtDate(s.nextServiceDate)}</span></div>
                          <div><span className="text-slate-400">Payment Mode: </span><span className="text-white">{s.paymentMode || 'Cash'}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Edit Service Form */}
                    {editServiceId === s._id && (
                      <div className="px-5 py-4 bg-slate-800/80 border-t border-emerald-800/50">
                        <p className="text-emerald-400 text-sm font-semibold mb-3">✏️ Edit Service Record</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="label">Vehicle Name</label>
                            <input value={editServiceForm.vehicleName} onChange={(e) => setEditServiceForm({ ...editServiceForm, vehicleName: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">KM Run</label>
                            <input type="number" value={editServiceForm.kmRun} onChange={(e) => setEditServiceForm({ ...editServiceForm, kmRun: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">Service Type</label>
                            <input value={editServiceForm.serviceType} onChange={(e) => setEditServiceForm({ ...editServiceForm, serviceType: e.target.value })} className="input-field" placeholder="Describe service" />
                          </div>
                          <div>
                            <label className="label">Labour Cost (₹)</label>
                            <input type="number" value={editServiceForm.labourCost} onChange={(e) => setEditServiceForm({ ...editServiceForm, labourCost: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">Discount (₹)</label>
                            <input type="number" value={editServiceForm.discount} onChange={(e) => setEditServiceForm({ ...editServiceForm, discount: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">Amount Paid (₹)</label>
                            <input type="number" value={editServiceForm.paidAmount} onChange={(e) => setEditServiceForm({ ...editServiceForm, paidAmount: e.target.value })} className="input-field" />
                          </div>
                          <div>
                            <label className="label">Payment Mode</label>
                            <select value={editServiceForm.paymentMode} onChange={(e) => setEditServiceForm({ ...editServiceForm, paymentMode: e.target.value })} className="input-field">
                              {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="label">Service Date</label>
                            <input type="date" value={editServiceForm.serviceDate} onChange={(e) => setEditServiceForm({ ...editServiceForm, serviceDate: e.target.value })} className="input-field" />
                          </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button onClick={() => handleSaveService(s._id)} disabled={editLoading} className="btn-primary text-sm">
                            {editLoading ? 'Saving...' : '💾 Save Changes'}
                          </button>
                          <button onClick={() => setEditServiceId(null)} className="btn-secondary text-sm">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}