import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('invoices') || '[]');
    setInvoices(data);
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this invoice from history?')) return;
    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    localStorage.setItem('invoices', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    if (!window.confirm('Clear all invoice history? This cannot be undone.')) return;
    setInvoices([]);
    localStorage.removeItem('invoices');
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => {
    try { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; } catch { return '—'; }
  };
  const fmtDateTime = (d) => {
    try { return d ? new Date(d).toLocaleString('en-IN') : '—'; } catch { return '—'; }
  };

  const filtered = invoices.filter(inv =>
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
    inv.vehicleName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSaved = invoices.reduce((s, inv) => s + (inv.totalBill || 0), 0);
  const totalCollected = invoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0);
  const totalDue = invoices.reduce((s, inv) => s + (inv.balanceDue || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Invoice History</h1>
          <p className="text-slate-400 text-sm">All saved invoices · stored locally on this device</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/invoice')} className="btn-primary">
            + Create New Invoice
          </button>
          {invoices.length > 0 && (
            <button onClick={handleClearAll} className="btn-danger text-sm">
              🗑 Clear All
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-slate-400 text-sm">Total Invoices</p>
            <p className="text-2xl font-bold text-white mt-1">{invoices.length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Total Billed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(totalSaved)}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Total Collected</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{fmt(totalCollected)}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Total Due</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{fmt(totalDue)}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, invoice number or vehicle..."
          className="input-field"
        />
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-400 text-xl mb-2">🧾</p>
          <p className="text-slate-400 font-medium">No saved invoices found</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            Create and save invoices from the Invoice page
          </p>
          <button onClick={() => navigate('/invoice')} className="btn-primary">
            Create Invoice
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inv) => (
            <div key={inv.id} className="card border border-slate-700 overflow-hidden">

              {/* Invoice Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    🧾
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-white font-bold">{inv.customerName}</p>
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                        {inv.invoiceNo}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {inv.vehicleName && `${inv.vehicleName} · `}
                      Saved: {fmtDateTime(inv.savedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-lg">{fmt(inv.totalBill)}</p>
                    {inv.balanceDue > 0 && (
                      <p className="text-amber-400 text-xs">Due: {fmt(inv.balanceDue)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                    className="btn-secondary text-xs py-1.5 px-3">
                    {expanded === inv.id ? '▲ Hide' : '▼ Details'}
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="btn-danger text-xs py-1.5 px-3">
                    🗑
                  </button>
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-700/30 rounded-lg px-4 py-3">
                <div>
                  <p className="text-slate-400 text-xs">Invoice Date</p>
                  <p className="text-white text-sm font-medium">{fmtDate(inv.invoiceDate)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Service Date</p>
                  <p className="text-white text-sm font-medium">{fmtDate(inv.serviceDate)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Bill</p>
                  <p className="text-emerald-400 text-sm font-bold">{fmt(inv.totalBill)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Amount Paid</p>
                  <p className="text-white text-sm font-medium">{fmt(inv.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Balance Due</p>
                  <p className="text-sm font-bold"
                    style={{ color: inv.balanceDue > 0 ? '#fbbf24' : '#34d399' }}>
                    {fmt(inv.balanceDue)}
                  </p>
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === inv.id && (
                <div className="mt-4 space-y-4">

                  {/* Customer + Vehicle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Customer</p>
                      <p className="text-white font-semibold">{inv.customerName}</p>
                      {inv.customerPhone && <p className="text-slate-300 text-sm">📞 {inv.customerPhone}</p>}
                      {inv.customerEmail && <p className="text-slate-300 text-sm">✉️ {inv.customerEmail}</p>}
                      {inv.customerAddress && <p className="text-slate-300 text-sm">📍 {inv.customerAddress}</p>}
                    </div>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Vehicle</p>
                      <p className="text-white font-semibold">{inv.vehicleName || '—'}</p>
                      {inv.vehicleCompany && <p className="text-slate-300 text-sm">Brand: {inv.vehicleCompany}</p>}
                      {inv.vehicleType && <p className="text-slate-300 text-sm">Type: {inv.vehicleType}</p>}
                      {inv.vehicleYear && <p className="text-slate-300 text-sm">Year: {inv.vehicleYear}</p>}
                      {inv.kmRun && <p className="text-slate-300 text-sm">KM: {inv.kmRun}</p>}
                    </div>
                  </div>

                  {/* Service Description */}
                  {inv.serviceType && (
                    <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-3">
                      <p className="text-blue-400 text-xs font-semibold uppercase mb-1">Service Work</p>
                      <p className="text-white text-sm">{inv.serviceType}</p>
                    </div>
                  )}

                  {/* Spare Items */}
                  {inv.spareItems?.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Spare Parts Used</p>
                      <div className="border border-slate-600 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-700/50">
                              <th className="text-left px-4 py-2 text-slate-400 text-xs">#</th>
                              <th className="text-left px-4 py-2 text-slate-400 text-xs">Part Name</th>
                              <th className="text-center px-4 py-2 text-slate-400 text-xs">Qty</th>
                              <th className="text-right px-4 py-2 text-slate-400 text-xs">Unit Price</th>
                              <th className="text-right px-4 py-2 text-slate-400 text-xs">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.spareItems.map((item, idx) => (
                              <tr key={idx} className="border-t border-slate-700">
                                <td className="px-4 py-2 text-slate-400 text-xs">{idx + 1}</td>
                                <td className="px-4 py-2 text-white text-xs">{item.description}</td>
                                <td className="px-4 py-2 text-slate-300 text-xs text-center">{item.qty}</td>
                                <td className="px-4 py-2 text-slate-300 text-xs text-right">{fmt(item.unitPrice)}</td>
                                <td className="px-4 py-2 text-emerald-400 text-xs text-right font-semibold">
                                  {fmt((parseFloat(item.qty) || 1) * (parseFloat(item.unitPrice) || 0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Other Charges */}
                  {inv.otherCharges?.filter(c => c.description)?.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Other Charges</p>
                      <div className="space-y-1">
                        {inv.otherCharges.filter(c => c.description).map((c, idx) => (
                          <div key={idx} className="flex justify-between bg-slate-700/40 rounded px-3 py-2">
                            <span className="text-white text-xs">{c.description}</span>
                            <span className="text-blue-400 text-xs font-semibold">{fmt(c.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bill Breakdown */}
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-3">Bill Breakdown</p>
                    <div className="space-y-1.5 text-sm max-w-xs ml-auto">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Spares</span>
                        <span className="text-white">{fmt(inv.spareItems?.reduce((s, r) => s + (parseFloat(r.unitPrice) || 0) * (parseFloat(r.qty) || 1), 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Labour</span>
                        <span className="text-white">{fmt(inv.labourCost)}</span>
                      </div>
                      {inv.otherTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Other</span>
                          <span className="text-white">{fmt(inv.otherTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-600 pt-1.5">
                        <span className="text-slate-400">Gross</span>
                        <span className="text-white font-semibold">{fmt(inv.grossTotal)}</span>
                      </div>
                      {inv.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Discount</span>
                          <span className="text-red-400">- {fmt(inv.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-600 pt-1.5">
                        <span className="text-emerald-400 font-semibold">Total Bill</span>
                        <span className="text-emerald-400 font-bold text-base">{fmt(inv.totalBill)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Paid ({inv.paymentMode})</span>
                        <span className="text-white">{fmt(inv.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t-2 border-slate-500 pt-1.5">
                        <span className="font-bold" style={{ color: inv.balanceDue > 0 ? '#fbbf24' : '#34d399' }}>
                          Balance Due
                        </span>
                        <span className="font-bold" style={{ color: inv.balanceDue > 0 ? '#fbbf24' : '#34d399' }}>
                          {fmt(inv.balanceDue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {inv.notes && (
                    <div className="bg-slate-700/20 rounded-xl p-3">
                      <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Notes</p>
                      <p className="text-slate-300 text-sm">{inv.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}