import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ✅ Named export (FIXES YOUR ERROR)
export const saveInvoice = (invoice) => {
  const existing = JSON.parse(localStorage.getItem("invoices")) || [];
  existing.push(invoice);
  localStorage.setItem("invoices", JSON.stringify(existing));
};

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const storedInvoices = JSON.parse(localStorage.getItem("invoices")) || [];
    setInvoices(storedInvoices);
  }, []);

  // ✅ Generate PDF
  const downloadPDF = async (id) => {
    const input = document.getElementById(`invoice-${id}`);
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 180, 0);
    pdf.save(`invoice_${id}.pdf`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Invoice History</h2>

      {invoices.length === 0 ? (
        <p>No invoices found</p>
      ) : (
        invoices.map((inv, index) => (
          <div
            key={index}
            id={`invoice-${index}`}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "20px",
              background: "#fff",
            }}
          >
            <h3>Invoice #{index + 1}</h3>
            <p><strong>Name:</strong> {inv.name}</p>
            <p><strong>Vehicle:</strong> {inv.vehicle}</p>
            <p><strong>Price:</strong> ₹{inv.price}</p>
            <p><strong>Date:</strong> {inv.date}</p>

            <button onClick={() => downloadPDF(index)}>
              Download PDF
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default InvoiceHistory;