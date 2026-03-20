# ⚡ EV Showroom CMS — Version 2

A full-stack EV showroom management system with **automatic stock deduction**, **manual spare parts entry per service**, **manual service type description**, and **dual service reminders** (90 days from sale OR last service).

---

## 🆕 What's New in Version 2

| Feature | v1 | v2 |
|---|---|---|
| Service Type | Dropdown (fixed options) | ✅ Free-text input (type anything) |
| Spare Parts in Service | Single total cost field | ✅ Add multiple parts: Name + Price + Qty each |
| Total Bill Calculation | Labour + one spare cost field | ✅ Labour + sum of all individual spare parts |
| Vehicle Stock after Sale | Manual | ✅ Auto-decremented when sale is saved |
| Spare Stock after Service | Manual | ✅ Auto-decremented per spare part used |
| Service Reminder | 90 days from last service only | ✅ 90 days from last service **AND** from sale date (first-time reminder) |
| Database | ev-showroom | ✅ ev-showroom-v2 (fresh DB) |

---

## 🛠️ Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React.js, Tailwind CSS, Axios, React Router |
| Backend   | Node.js, Express.js, JWT Auth |
| Database  | MongoDB + Mongoose |

---

## ⚙️ Prerequisites

- **Node.js v18+** → https://nodejs.org
- **MongoDB** (local or Atlas) → https://www.mongodb.com/try/download/community

---

## 🚀 Setup Instructions

### Step 1 — Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Ubuntu / Linux
sudo systemctl start mongod

# Windows
mongod
```

### Step 2 — Backend Setup

```bash
cd ev-showroom-cms-v2/backend
npm install
npm run dev
```

✅ Backend → **http://localhost:5000**

You'll see:
```
Server running on port 5000
MongoDB Connected: localhost
```

### Step 3 — Frontend Setup (new terminal)

```bash
cd ev-showroom-cms-v2/frontend
npm install
npm start
```

✅ Frontend → **http://localhost:3000**

### Step 4 — First Login

1. Go to **http://localhost:3000/signup**
2. Create your admin account
3. Redirected to Dashboard automatically

---

## 🗄️ Database Info

- **Database Name:** `ev-showroom-v2`
- **Connection:** `mongodb://localhost:27017/ev-showroom-v2` (set in `backend/.env`)

### Collections (auto-created)

| Collection | Description |
|---|---|
| `users` | Admin login accounts |
| `customers` | Customer profiles |
| `sales` | Vehicle sale records |
| `services` | Service records with spare items |
| `vehicles` | Vehicle inventory (auto-decremented) |
| `spares` | Spare parts inventory (auto-decremented) |

---

## 🔑 Key Logic Explained

### Spare Parts in Service
- Admin adds **multiple spare parts** per service (name + price + qty)
- Total Spare Cost = sum of (price × qty) for each row
- **Total Bill = Labour Cost + Total Spare Cost** (auto-calculated)
- On save, each spare part's quantity is **auto-decremented** in `spares` collection by name match

### Vehicle Stock After Sale
- When a sale is saved, the matching vehicle name in `vehicles` collection is found (case-insensitive)
- Quantity is **auto-decremented by 1**
- If stock is 0, it stays at 0 (no negative stock)

### Service Reminders (Dual Logic)
**Type 1 — After Service:**
- `nextServiceDate` = `serviceDate + 90 days` (stored in DB when service is created)
- Shows on dashboard when `nextServiceDate` ≤ 30 days from today

**Type 2 — After Purchase (first service):**
- Triggers when a vehicle was sold 60–90 days ago
- Only shown if NO service record exists yet for that customer + vehicle
- Reminds the customer to bring the vehicle in for its first service

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register |
| POST | /api/auth/login | Login |
| GET/POST | /api/customers | List / Add customers |
| GET | /api/customers/search?q= | Autocomplete search |
| GET/POST | /api/sales | List / Add sales |
| PUT | /api/sales/:id/payment | Mark sale payment |
| GET/POST | /api/services | List / Add services |
| PUT | /api/services/:id/payment | Mark service payment |
| GET | /api/dashboard-stats | Full dashboard data |
| GET/POST/PUT/DELETE | /api/vehicles | Vehicle stock CRUD |
| GET/POST/PUT/DELETE | /api/spares | Spare stock CRUD |

---

## 🐛 Troubleshooting

**MongoDB not connecting:**
```bash
sudo systemctl start mongod   # Linux
brew services start mongodb-community  # Mac
```

**npm install fails:**
```bash
npm install --legacy-peer-deps
```

**Port in use:**
```bash
npx kill-port 5000
npx kill-port 3000
```

**Tailwind not loading:**
```bash
cd frontend && npm install tailwindcss autoprefixer postcss
```


A full-stack web application for managing an Electric Vehicle Showroom — customers, sales, service records, inventory, and payments.

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|--------------------------------------|
| Frontend  | React.js, Tailwind CSS, Axios, React Router |
| Backend   | Node.js, Express.js, JWT Auth        |
| Database  | MongoDB + Mongoose                   |

---

## 📁 Project Structure

```
ev-showroom-cms/
├── backend/
│   ├── config/db.js
│   ├── models/          (User, Customer, Sales, Service, VehicleStock, SpareStock)
│   ├── routes/          (auth, customers, sales, services, vehicles, spares, dashboard)
│   ├── controllers/     (auth, customer, sales, service, dashboard)
│   ├── middleware/authMiddleware.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/       (Login, Signup, Dashboard, AddCustomer, Sales, Service, ViewCustomer, VehicleStock, SpareStock)
    │   ├── components/  (Sidebar, CustomerSearch)
    │   ├── api.js
    │   ├── App.js
    │   └── index.css
    ├── public/index.html
    ├── tailwind.config.js
    └── package.json
```

---

## ⚙️ Prerequisites

Make sure you have these installed:

- **Node.js** v18 or above → https://nodejs.org
- **MongoDB** (local) → https://www.mongodb.com/try/download/community
  - OR use **MongoDB Atlas** (free cloud) → https://cloud.mongodb.com
- **npm** (comes with Node.js)

---

## 🚀 Installation & Setup

### Step 1 — Clone / Extract the Project

```bash
# If you downloaded the zip, extract it and navigate into the folder:
cd ev-showroom-cms
```

---

### Step 2 — Start MongoDB

**Option A — Local MongoDB:**
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows — start MongoDB from Services or run:
mongod
```

**Option B — MongoDB Atlas (Cloud):**
1. Go to https://cloud.mongodb.com and create a free cluster
2. Get your connection string, e.g.:
   `mongodb+srv://username:password@cluster.mongodb.net/ev-showroom`
3. Replace `MONGO_URI` in `backend/.env` with your Atlas URI

---

### Step 3 — Setup Backend

```bash
cd ev-showroom-cms/backend

# Install dependencies
npm install

# Configure environment variables
# Open backend/.env and verify/update these values:
```

**`backend/.env`** contents:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ev-showroom
JWT_SECRET=ev_showroom_super_secret_jwt_key_2024
```

```bash
# Start the backend server
npm run dev
```

✅ Backend will run at: **http://localhost:5000**

You should see:
```
Server running on port 5000
MongoDB Connected: localhost
```

---

### Step 4 — Setup Frontend

Open a **new terminal window/tab**:

```bash
cd ev-showroom-cms/frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

✅ Frontend will run at: **http://localhost:3000**

The browser should open automatically. If not, visit http://localhost:3000 manually.

---

## 🔐 First Time Setup

1. Visit **http://localhost:3000/signup**
2. Create your admin account (name, email, password)
3. You'll be automatically redirected to the **Dashboard**

---

## 📋 Features Guide

### Dashboard
- Shows total customers, sales, services counts
- Total pending payment amount
- List of all pending payments (sales + services) with one-click "Mark Paid" button
- Service reminders for vehicles due within 30 days

### Add Customer
- Register new customers with name, phone, email, address
- Data saved to MongoDB `customers` collection

### Sales
- Add new vehicle sale with customer autocomplete search
- Auto-calculates: Final Price = Price − Discount
- Auto-calculates: Pending Amount = Final Price − Paid Amount
- Auto-sets Payment Status: Paid / Pending

### Service
- Add service records with customer autocomplete
- Auto-calculates: Total Bill = Labour Cost + Spare Cost
- Auto-calculates: Next Service Date = Service Date + 90 days

### View Customer
- Search customers by name or phone
- See complete profile with all sales history and service history
- Summary of total pending amounts

### Vehicle Stock
- Add/Edit/Delete vehicles in inventory
- Stock status indicators (In Stock / Low Stock / Out of Stock)

### Spare Parts Stock
- Add/Edit/Delete spare parts
- Search/filter parts
- Total stock value calculator

---

## 🌐 API Endpoints

| Method | Endpoint                        | Description               | Auth |
|--------|---------------------------------|---------------------------|------|
| POST   | /api/auth/signup                | Register user             | No   |
| POST   | /api/auth/login                 | Login user                | No   |
| GET    | /api/customers                  | Get all customers         | Yes  |
| POST   | /api/customers                  | Add customer              | Yes  |
| GET    | /api/customers/search?q=name    | Search customers          | Yes  |
| GET    | /api/customers/:id              | Get customer by ID        | Yes  |
| GET    | /api/sales                      | Get all sales             | Yes  |
| POST   | /api/sales                      | Add sale                  | Yes  |
| GET    | /api/sales/customer/:id         | Sales by customer         | Yes  |
| PUT    | /api/sales/:id/payment          | Update sale payment       | Yes  |
| GET    | /api/services                   | Get all services          | Yes  |
| POST   | /api/services                   | Add service               | Yes  |
| GET    | /api/services/customer/:id      | Services by customer      | Yes  |
| PUT    | /api/services/:id/payment       | Update service payment    | Yes  |
| GET    | /api/dashboard-stats            | Dashboard statistics      | Yes  |
| GET    | /api/vehicles                   | Get all vehicles          | Yes  |
| POST   | /api/vehicles                   | Add vehicle               | Yes  |
| PUT    | /api/vehicles/:id               | Update vehicle            | Yes  |
| DELETE | /api/vehicles/:id               | Delete vehicle            | Yes  |
| GET    | /api/spares                     | Get all spares            | Yes  |
| POST   | /api/spares                     | Add spare part            | Yes  |
| PUT    | /api/spares/:id                 | Update spare part         | Yes  |
| DELETE | /api/spares/:id                 | Delete spare part         | Yes  |

---

## 🐞 Troubleshooting

**MongoDB connection error:**
- Make sure MongoDB service is running
- Check your `MONGO_URI` in `.env`

**CORS error in browser:**
- Make sure backend is running on port 5000
- Make sure frontend is running on port 3000

**`npm install` fails:**
- Try: `npm install --legacy-peer-deps`

**Port already in use:**
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

**Tailwind styles not loading:**
```bash
cd frontend
npm install tailwindcss autoprefixer postcss
```

---

## 📦 Dependencies

### Backend
```
express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv
```

### Frontend
```
react, react-dom, react-router-dom, axios, tailwindcss, autoprefixer, postcss
```

---

## 🔒 Security Notes

- Passwords are hashed using **bcrypt** before storage
- API routes are protected with **JWT Bearer tokens**
- Tokens expire after **7 days**
- Change `JWT_SECRET` in `.env` for production use

---

## 📸 Pages Overview

| Page           | Route             |
|----------------|-------------------|
| Login          | /login            |
| Signup         | /signup           |
| Dashboard      | /dashboard        |
| Add Customer   | /add-customer     |
| Sales          | /sales            |
| Service        | /service          |
| View Customer  | /view-customer    |
| Vehicle Stock  | /vehicle-stock    |
| Spare Stock    | /spare-stock      |
