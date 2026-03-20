import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5002/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);

// Customers
export const addCustomer = (data) => API.post('/customers', data);
export const getCustomers = () => API.get('/customers');
export const searchCustomers = (q) => API.get(`/customers/search?q=${encodeURIComponent(q)}`);
export const getCustomerById = (id) => API.get(`/customers/${id}`);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);

// Sales
export const addSale = (data) => API.post('/sales', data);
export const getSales = () => API.get('/sales');
export const getSalesByCustomer = (id) => API.get(`/sales/customer/${id}`);
export const updateSalePayment = (id, data) => API.put(`/sales/${id}/payment`, data);
export const updateSale = (id, data) => API.put(`/sales/${id}`, data);
export const deleteSale = (id) => API.delete(`/sales/${id}`);

// Services
export const addService = (data) => API.post('/services', data);
export const getServices = () => API.get('/services');
export const getServiceById = (id) => API.get(`/services/${id}`);
export const getServicesByCustomer = (id) => API.get(`/services/customer/${id}`);
export const addServicePayment = (id, data) => API.post(`/services/${id}/payment`, data);
export const getPaymentHistory = (id) => API.get(`/services/${id}/payments`);
export const updateServicePayment = (id, data) => API.put(`/services/${id}/payment`, data);
export const updateService = (id, data) => API.put(`/services/${id}`, data);
export const deleteService = (id) => API.delete(`/services/${id}`);

// Dashboard
export const getDashboardStats = () => API.get('/dashboard-stats');

// Vehicles
export const addVehicle = (data) => API.post('/vehicles', data);
export const getVehicles = () => API.get('/vehicles');
export const updateVehicle = (id, data) => API.put(`/vehicles/${id}`, data);
export const deleteVehicle = (id) => API.delete(`/vehicles/${id}`);

// Spares
export const addSpare = (data) => API.post('/spares', data);
export const getSpares = () => API.get('/spares');
export const updateSpare = (id, data) => API.put(`/spares/${id}`, data);
export const deleteSpare = (id) => API.delete(`/spares/${id}`);

export default API;
