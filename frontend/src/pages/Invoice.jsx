import React, { useState, useRef } from 'react';
import { searchCustomers } from '../api';
import { saveInvoice } from './InvoiceHistory';

const emptySpare = () => ({ description: '', qty: 1, unitPrice: '', total: 0 });
const emptyOther = () => ({ description: '', amount: '' });

export default function Invoice() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [form, setForm] = useState({
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerName: '', customerPhone: '', customerEmail: '', customerAddress: '',
    vehicleName: '', vehicleType: '', vehicleCompany: '', vehicleModel: '', vehicleYear: '',
    serviceType: '', serviceDate: new Date().toISOString().split('T')[0],
    kmRun: '', labourCost: '', discount: '', paidAmount: '', paymentMode: 'Cash', notes: '',
    companyName: 'Palani Motors EV Showroom', companyAddress: 'Tamil Nadu, India',
    companyPhone: '', companyEmail: '', companyGST: ''
  });

  const [spareRows, setSpareRows] = useState([emptySpare()]);
  const [otherRows, setOtherRows] = useState([emptyOther()]);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef(null);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSearch = async (val) => {
    setQuery(val);
    setForm(prev => ({ ...prev, customerName: val }));
    if (!val.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    setSearching(true);
    try { const { data } = await searchCustomers(val); setSuggestions(data); setShowDropdown(true); }
    catch { setSuggestions([]); }
    setSearching(false);
  };

  const handleSelectCustomer = (c) => {
    setQuery(c.name); setShowDropdown(false);
    setForm(prev => ({ ...prev, customerName: c.name, customerPhone: c.phone || '', customerEmail: c.email || '', customerAddress: c.address || '' }));
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSpareChange = (idx, field, val) => {
    const updated = spareRows.map((r, i) => {
      if (i !== idx) return r;
      const newRow = { ...r, [field]: val };
      newRow.total = (parseFloat(newRow.qty) || 1) * (parseFloat(newRow.unitPrice) || 0);
      return newRow;
    });
    setSpareRows(updated);
  };

  const handleOtherChange = (idx, field, val) =>
    setOtherRows(otherRows.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const sparesTotal = spareRows.reduce((s, r) => s + (parseFloat(r.unitPrice) || 0) * (parseFloat(r.qty) || 1), 0);
  const labourTotal = parseFloat(form.labourCost) || 0;
  const otherTotal = otherRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const grossTotal = sparesTotal + labourTotal + otherTotal;
  const discount = parseFloat(form.discount) || 0;
  const totalBill = Math.max(0, grossTotal - discount);
  const paidAmount = parseFloat(form.paidAmount) || 0;
  const balanceDue = Math.max(0, totalBill - paidAmount);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  const handlePrint = () => { window.print(); };

  const handleSaveInvoice = () => {
    const invoiceData = {
      ...form, spareRows, otherRows,
      sparesTotal, labourTotal, otherTotal, grossTotal,
      discount, totalBill, paidAmount, balanceDue,
      savedAt: new Date().toISOString()
    };
    const ok = saveInvoice(invoiceData);
    setSaveMsg(ok ? '✓ Invoice saved!' : 'Failed to save.');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Invoice Generator</h1>
          <p className="text-slate-400 text-sm">Create and print service invoices for customers</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          {saveMsg && <span className="text-emerald-400 text-sm bg-emerald-900/30 border border-emerald-700 px-3 py-1.5 rounded-lg">{saveMsg}</span>}
          <button onClick={handleSaveInvoice} className="btn-secondary">💾 Save Invoice</button>
          <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary">
            {showPreview ? '✕ Close Preview' : '👁 Preview Invoice'}
          </button>
          <button onClick={handlePrint} className="btn-primary">🖨️ Print / Save PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-5">

          <div className="card">
            <h3 className="text-white font-semibold mb-4">📋 Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Invoice Number</label><input name="invoiceNo" value={form.invoiceNo} onChange={handleChange} className="input-field" /></div>
              <div><label className="label">Invoice Date</label><input name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleChange} className="input-field" /></div>
              <div><label className="label">Due Date</label><input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="input-field" /></div>
              <div><label className="label">Payment Mode</label>
                <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className="input-field">
                  {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-white font-semibold mb-4">🏢 Company Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Company Name</label><input name="companyName" value={form.companyName} onChange={handleChange} className="input-field" /></div>
              <div className="col-span-2"><label className="label">Company Address</label><input name="companyAddress" value={form.companyAddress} onChange={handleChange} className="input-field" /></div>
              <div><label className="label">Phone</label><input name="companyPhone" value={form.companyPhone} onChange={handleChange} placeholder="+91 xxxxx xxxxx" className="input-field" /></div>
              <div><label className="label">Email</label><input name="companyEmail" value={form.companyEmail} onChange={handleChange} placeholder="company@email.com" className="input-field" /></div>
              <div><label className="label">GST Number</label><input name="companyGST" value={form.companyGST} onChange={handleChange} placeholder="GST number" className="input-field" /></div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-white font-semibold mb-4">👤 Customer Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Customer Name <span className="text-slate-500 font-normal text-xs">(search or type)</span></label>
                <div className="relative">
                  <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search existing customer..." className="input-field" />
                  {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>}
                  {showDropdown && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {suggestions.map((c) => (
                        <li key={c._id} onClick={() => handleSelectCustomer(c)} className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm">
                          <p className="text-white font-medium">{c.name}</p>
                          <p className="text-slate-400 text-xs">{c.phone}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div><label className="label">Phone</label><input name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="Mobile number" className="input-field" /></div>
              <div><label className="label">Email</label><input name="customerEmail" value={form.customerEmail} onChange={handleChange} placeholder="Email address" className="input-field" /></div>
              <div className="col-span-2"><label className="label">Address</label><input name="customerAddress" value={form.customerAddress} onChange={handleChange} placeholder="Full address" className="input-field" /></div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-white font-semibold mb-4">🚗 Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Vehicle Name / Model</label><input name="vehicleName" value={form.vehicleName} onChange={handleChange} placeholder="e.g. Nexon EV Max" className="input-field" /></div>
              <div><label className="label">Company / Brand</label><input name="vehicleCompany" value={form.vehicleCompany} onChange={handleChange} placeholder="e.g. Tata Motors" className="input-field" /></div>
              <div><label className="label">Vehicle Type</label>
                <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className="input-field">
                  <option value="">Select type</option>
                  {['Sedan', 'SUV', 'Hatchback', 'MUV', '2-Wheeler', '3-Wheeler'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Year</label><input name="vehicleYear" value={form.vehicleYear} onChange={handleChange} placeholder="e.g. 2023" className="input-field" /></div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-white font-semibold mb-4">🔧 Service Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="label">Service Description</label>
                <textarea name="serviceType" value={form.serviceType} onChange={handleChange} placeholder="Describe the service work done..." rows={2} className="input-field resize-none" />
              </div>
              <div><label className="label">Service Date</label><input name="serviceDate" type="date" value={form.serviceDate} onChange={handleChange} className="input-field" /></div>
              <div><label className="label">KM Run</label><input name="kmRun" value={form.kmRun} onChange={handleChange} placeholder="Odometer reading" className="input-field" /></div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-xs font-semibold uppercase">Spare Parts</p>
                <button type="button" onClick={() => setSpareRows([...spareRows, emptySpare()])} className="text-emerald-400 text-xs hover:text-emerald-300">+ Add Row</button>
              </div>
              <div className="border border-slate-600 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-700/50">
                      <th className="text-left px-3 py-2 text-slate-400 text-xs">Description</th>
                      <th className="text-left px-3 py-2 text-slate-400 text-xs">Qty</th>
                      <th className="text-left px-3 py-2 text-slate-400 text-xs">Unit Price</th>
                      <th className="text-left px-3 py-2 text-slate-400 text-xs">Total</th>
                      <th className="px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {spareRows.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-700">
                        <td className="px-2 py-1.5"><input value={row.description} onChange={(e) => handleSpareChange(idx, 'description', e.target.value)} placeholder="Spare part name" className="input-field text-xs py-1.5" /></td>
                        <td className="px-2 py-1.5 w-16"><input type="number" value={row.qty} onChange={(e) => handleSpareChange(idx, 'qty', e.target.value)} className="input-field text-xs py-1.5" min="1" /></td>
                        <td className="px-2 py-1.5 w-24"><input type="number" value={row.unitPrice} onChange={(e) => handleSpareChange(idx, 'unitPrice', e.target.value)} placeholder="0" className="input-field text-xs py-1.5" /></td>
                        <td className="px-2 py-1.5 text-emerald-400 text-xs font-semibold w-20">{fmt((parseFloat(row.qty) || 1) * (parseFloat(row.unitPrice) || 0))}</td>
                        <td className="px-1 py-1.5">
                          <button onClick={() => spareRows.length > 1 ? setSpareRows(spareRows.filter((_, i) => i !== idx)) : setSpareRows([emptySpare()])}
                            className="text-red-400 hover:text-red-300 text-xs w-6 h-6 flex items-center justify-center">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="label">Labour Cost (₹)</label><input name="labourCost" type="number" value={form.labourCost} onChange={handleChange} placeholder="0" className="input-field" /></div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-xs font-semibold uppercase">Other Charges</p>
                <button type="button" onClick={() => setOtherRows([...otherRows, emptyOther()])} className="text-emerald-400 text-xs hover:text-emerald-300">+ Add Row</button>
              </div>
              <div className="space-y-2">
                {otherRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8"><input value={row.description} onChange={(e) => handleOtherChange(idx, 'description', e.target.value)} placeholder="e.g. Courier, Transport" className="input-field text-sm py-2" /></div>
                    <div className="col-span-3"><input type="number" value={row.amount} onChange={(e) => handleOtherChange(idx, 'amount', e.target.value)} placeholder="0" className="input-field text-sm py-2" /></div>
                    <div className="col-span-1">
                      <button onClick={() => otherRows.length > 1 ? setOtherRows(otherRows.filter((_, i) => i !== idx)) : setOtherRows([emptyOther()])}
                        className="w-7 h-7 flex items-center justify-center rounded bg-red-900/40 text-red-400 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">🏷️ Discount (₹)</label><input name="discount" type="number" value={form.discount} onChange={handleChange} placeholder="0" className="input-field" /></div>
              <div><label className="label">Amount Paid (₹)</label><input name="paidAmount" type="number" value={form.paidAmount} onChange={handleChange} placeholder="0" className="input-field" /></div>
            </div>
          </div>

          <div className="card">
            <label className="label">Notes / Terms</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="e.g. Thank you for your business. Payment due within 7 days." rows={3} className="input-field resize-none" />
          </div>

          <div className="card bg-slate-700/50">
            <h3 className="text-white font-semibold mb-3">💰 Bill Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Spares Total</span><span className="text-white">{fmt(sparesTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Labour</span><span className="text-white">{fmt(labourTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Other Charges</span><span className="text-white">{fmt(otherTotal)}</span></div>
              <div className="flex justify-between border-t border-slate-600 pt-2"><span className="text-slate-400">Gross Total</span><span className="text-white font-semibold">{fmt(grossTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Discount</span><span className="text-red-400">- {fmt(discount)}</span></div>
              <div className="flex justify-between border-t border-slate-600 pt-2"><span className="text-emerald-400 font-semibold">Total Bill</span><span className="text-emerald-400 font-bold text-lg">{fmt(totalBill)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Amount Paid</span><span className="text-white">{fmt(paidAmount)}</span></div>
              <div className="flex justify-between border-t border-slate-600 pt-2">
                <span className="font-semibold" style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>Balance Due</span>
                <span className="font-bold text-lg" style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>{fmt(balanceDue)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSaveInvoice} className="btn-secondary px-5">💾 Save</button>
            <button onClick={handlePrint} className="btn-primary flex-1 py-3 text-base">🖨️ Print Invoice / Save as PDF</button>
            <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary px-6">👁 Preview</button>
          </div>
        </div>

        {showPreview && (
          <div className="sticky top-4">
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 bg-slate-700 flex items-center justify-between">
                <p className="text-white font-semibold text-sm">Invoice Preview</p>
                <button onClick={handlePrint} className="btn-primary text-xs py-1.5">🖨️ Print</button>
              </div>
              <div className="overflow-auto max-h-[80vh] p-1">
                <div ref={printRef} id="invoice-print" className="bg-white text-gray-800 p-8 min-h-[800px]" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{form.companyName}</h1>
                      <p className="text-gray-500 text-sm mt-1">{form.companyAddress}</p>
                      {form.companyPhone && <p className="text-gray-500 text-sm">📞 {form.companyPhone}</p>}
                      {form.companyEmail && <p className="text-gray-500 text-sm">✉️ {form.companyEmail}</p>}
                      {form.companyGST && <p className="text-gray-500 text-sm">GST: {form.companyGST}</p>}
                    </div>
                    <div className="text-right">
                      <div className="bg-gray-900 text-white px-6 py-3 rounded-lg">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Invoice</p>
                        <p className="text-xl font-bold">{form.invoiceNo}</p>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Date: {fmtDate(form.invoiceDate)}</p>
                      {form.dueDate && <p className="text-sm text-gray-500">Due: {fmtDate(form.dueDate)}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</p>
                      <p className="font-bold text-gray-900 text-lg">{form.customerName || '—'}</p>
                      {form.customerPhone && <p className="text-gray-600 text-sm">📞 {form.customerPhone}</p>}
                      {form.customerEmail && <p className="text-gray-600 text-sm">✉️ {form.customerEmail}</p>}
                      {form.customerAddress && <p className="text-gray-600 text-sm">📍 {form.customerAddress}</p>}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Vehicle Details</p>
                      <p className="font-bold text-gray-900">{form.vehicleName || '—'}</p>
                      {form.vehicleCompany && <p className="text-gray-600 text-sm">Brand: {form.vehicleCompany}</p>}
                      {form.vehicleType && <p className="text-gray-600 text-sm">Type: {form.vehicleType}</p>}
                      {form.vehicleYear && <p className="text-gray-600 text-sm">Year: {form.vehicleYear}</p>}
                      {form.kmRun && <p className="text-gray-600 text-sm">KM Run: {form.kmRun}</p>}
                    </div>
                  </div>
                  {(form.serviceType || form.serviceDate) && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                      <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Service Details</p>
                      {form.serviceDate && <p className="text-gray-700 text-sm">Date: {fmtDate(form.serviceDate)}</p>}
                      {form.serviceType && <p className="text-gray-700 text-sm mt-1">{form.serviceType}</p>}
                    </div>
                  )}
                  <table className="w-full mb-6" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#111827', color: 'white' }}>
                        <th className="text-left px-4 py-3 text-sm">#</th>
                        <th className="text-left px-4 py-3 text-sm">Description</th>
                        <th className="text-center px-4 py-3 text-sm">Qty</th>
                        <th className="text-right px-4 py-3 text-sm">Unit Price</th>
                        <th className="text-right px-4 py-3 text-sm">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spareRows.filter(r => r.description).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{row.description}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-600">{row.qty}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-600">{fmt(row.unitPrice)}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">{fmt((parseFloat(row.qty) || 1) * (parseFloat(row.unitPrice) || 0))}</td>
                        </tr>
                      ))}
                      {labourTotal > 0 && (
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td className="px-4 py-2 text-sm text-gray-500">{spareRows.filter(r => r.description).length + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">Labour Charges</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-600">1</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-600">{fmt(labourTotal)}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">{fmt(labourTotal)}</td>
                        </tr>
                      )}
                      {otherRows.filter(r => r.description).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td className="px-4 py-2 text-sm text-gray-500">—</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{row.description}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-600">1</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-600">{fmt(row.amount)}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">{fmt(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end mb-6">
                    <div className="w-64">
                      <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Subtotal</span><span>{fmt(grossTotal)}</span></div>
                      {discount > 0 && <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Discount</span><span className="text-red-500">- {fmt(discount)}</span></div>}
                      <div className="flex justify-between py-2 border-t border-gray-200 font-bold text-base"><span>Total</span><span>{fmt(totalBill)}</span></div>
                      {paidAmount > 0 && <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Paid ({form.paymentMode})</span><span className="text-green-600">{fmt(paidAmount)}</span></div>}
                      <div className="flex justify-between py-2 border-t-2 border-gray-900 font-bold text-lg">
                        <span>Balance Due</span>
                        <span style={{ color: balanceDue > 0 ? '#d97706' : '#16a34a' }}>{fmt(balanceDue)}</span>
                      </div>
                    </div>
                  </div>
                  {form.notes && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                      <p className="text-gray-600 text-sm">{form.notes}</p>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4 mt-6 text-center text-gray-400 text-xs">
                    Thank you for choosing {form.companyName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: fixed; top: 0; left: 0; width: 100%; background: white !important; color: black !important; padding: 20px; }
        }
      `}</style>
    </div>
  );
}