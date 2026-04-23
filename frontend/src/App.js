import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AddCustomer from './pages/AddCustomer';
import Sales from './pages/Sales';
import Service from './pages/Service';
import ViewCustomer from './pages/ViewCustomer';
import VehicleStock from './pages/VehicleStock';
import SpareStock from './pages/SpareStock';
import Payments from './pages/Payments';
import Invoice from './pages/Invoice';
import InvoiceHistory from './pages/InvoiceHistory';
import Sidebar from './components/Sidebar';

const PrivateLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-auto">{children}</main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/add-customer" element={<PrivateLayout><AddCustomer /></PrivateLayout>} />
        <Route path="/sales" element={<PrivateLayout><Sales /></PrivateLayout>} />
        <Route path="/service" element={<PrivateLayout><Service /></PrivateLayout>} />
        <Route path="/payments" element={<PrivateLayout><Payments /></PrivateLayout>} />
        <Route path="/view-customer" element={<PrivateLayout><ViewCustomer /></PrivateLayout>} />
        <Route path="/invoice" element={<PrivateLayout><Invoice /></PrivateLayout>} />
        <Route path="/invoice-history" element={<PrivateLayout><InvoiceHistory /></PrivateLayout>} />
        <Route path="/vehicle-stock" element={<PrivateLayout><VehicleStock /></PrivateLayout>} />
        <Route path="/spare-stock" element={<PrivateLayout><SpareStock /></PrivateLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;