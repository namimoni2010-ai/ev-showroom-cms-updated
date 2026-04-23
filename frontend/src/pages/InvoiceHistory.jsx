import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'palani_invoices_v1';

export function saveInvoice(invoice) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const idx = existing.findIndex(i => i.invoiceNo === invoice.invoiceNo);
    if (idx >= 0) { existing[idx] = { ...invoice, savedAt: new Date().toISOString() }; }
    else { existing.unshift({ ...invoice, savedAt: new Date().toISOString() }); }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch { return false; }
}

export default function InvoiceHistory({ onLoad }) {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setInvoices(data);
    } catch { setInvoices([]); }
  }, []);

  const handleDelete = (invoiceNo) => {
    if (!window.confirm('Delete this invoice?')) return;
    const updated = invoices.filter(i => i.invoiceNo !== invoiceNo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setInvoices(updated);
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  const filtered = invoices.filter(inv => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inv.customerName?.toLowerCase().includes(q) ||
      inv.invoiceNo?.toLowerCase().includes(q) ||
      inv.vehicleName?.toLowerCase().includes(q) ||
      inv.customerPhone?.includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Invoice History</h1>
          <p className="text-slate-400 text-sm">All saved invoices — search by customer name, invoice number or vehicle</p>
        </div>
        <span className="text-slate-400 text-sm bg-slate-700 px-3 py-1.5 rounded-lg">
          {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card mb-5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, invoice no, vehicle or phone..."
            className="input-field pl-9 text-base"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-lg">✕</button>
          )}
        </div>
        {search && (
          <p className="text-slate-400 text-xs mt-2">
            {filtered.length === 0
              ? 'No invoices found.'
              : `Showing ${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`}
          </p>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">🧾</p>
          <p className="text-white font-semibold text-lg mb-2">No Invoices Saved Yet</p>
          <p className="text-slate-400 text-sm">Go to Invoice Generator and click "Save Invoice" to store invoices here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-white font-semibold">No results for "{search}"</p>
          <p className="text-slate-400 text-sm mt-1">Try searching by customer name, invoice number, or vehicle.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const isExpanded = expandedId === inv.invoiceNo;
            const balanceDue = Math.max(0, (inv.totalBill || 0) - (inv.paidAmount || 0));
            return (
              <div key={inv.invoiceNo} className="card p-0 overflow-hidden">
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : inv.invoiceNo)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🧾</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">{inv.customerName || '—'}</p>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{inv.invoiceNo}</span>
                        {balanceDue > 0
                          ? <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">⏳ Due {fmt(balanceDue)}</span>
                          : <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">✅ Paid</span>
                        }
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {inv.vehicleName && <span>{inv.vehicleName} · </span>}
                        {inv.customerPhone && <span>{inv.customerPhone} · </span>}
                        Saved: {fmtDate(inv.savedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">{fmt(inv.totalBill)}</p>
                      <p className="text-slate-400 text-xs">{fmtDate(inv.invoiceDate)}</p>
                    </div>
                    <div className="flex gap-2">
                      {onLoad && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onLoad(inv); }}
                          className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium"
                        >
                          📂 Load
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(inv.invoiceNo); }}
                        className="text-xs bg-red-900/40 hover:bg-red-800 text-red-400 px-2 py-1.5 rounded-lg"
                      >
                        🗑
                      </button>
                    </div>
                    <span className="text-slate-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-700 p-4 bg-slate-800/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Customer</p>
                        <p className="text-white font-medium text-sm">{inv.customerName || '—'}</p>
                        {inv.customerPhone && <p className="text-slate-400 text-xs">{inv.customerPhone}</p>}
                        {inv.customerEmail && <p className="text-slate-400 text-xs">{inv.customerEmail}</p>}
                        {inv.customerAddress && <p className="text-slate-400 text-xs">{inv.customerAddress}</p>}
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Vehicle</p>
                        <p className="text-white font-medium text-sm">{inv.vehicleName || '—'}</p>
                        {inv.vehicleCompany && <p className="text-slate-400 text-xs">{inv.vehicleCompany}</p>}
                        {inv.vehicleType && <p className="text-slate-400 text-xs">{inv.vehicleType}</p>}
                        {inv.kmRun && <p className="text-slate-400 text-xs">KM: {inv.kmRun}</p>}
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Service</p>
                        <p className="text-white text-sm">{inv.serviceType || '—'}</p>
                        {inv.serviceDate && <p className="text-slate-400 text-xs">Date: {fmtDate(inv.serviceDate)}</p>}
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Bill Summary</p>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Total Bill</span>
                            <span className="text-emerald-400 font-semibold">{fmt(inv.totalBill)}</span>
                          </div>
                          {inv.discount > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Discount</span>
                              <span className="text-red-400">- {fmt(inv.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Paid</span>
                            <span className="text-white">{fmt(inv.paidAmount)}</span>
                          </div>
                          <div className="flex justify-between text-xs border-t border-slate-700 pt-0.5">
                            <span className="text-slate-400">Balance</span>
                            <span style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }} className="font-semibold">{fmt(balanceDue)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {inv.spareRows?.filter(r => r.description)?.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Spare Parts</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-700">
                              <th className="text-left py-1 pr-4">Part</th>
                              <th className="text-center py-1 pr-4">Qty</th>
                              <th className="text-right py-1 pr-4">Unit Price</th>
                              <th className="text-right py-1">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.spareRows.filter(r => r.description).map((r, i) => (
                              <tr key={i} className="border-b border-slate-700/50">
                                <td className="py-1 pr-4 text-white">{r.description}</td>
                                <td className="py-1 pr-4 text-center text-slate-300">{r.qty}</td>
                                <td className="py-1 pr-4 text-right text-slate-300">{fmt(r.unitPrice)}</td>
                                <td className="py-1 text-right text-emerald-400 font-medium">
                                  {fmt((parseFloat(r.qty) || 1) * (parseFloat(r.unitPrice) || 0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}