# 🏍️ SpeedyWheels - Bike Workshop Management Portal

A full-stack, enterprise-grade **Bike Workshop Management Portal** built with **React.js**, **Node.js**, **Express.js**, and **MongoDB Atlas**, styled with a modern **Purple & White** aesthetic.

Designed for motorcycle and scooter garages, authorized service centers, and independent repair workshops.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18+ (Vite) | High-performance SPA with modern React hooks & context |
| **UI Design** | Tailwind CSS & Lucide Icons | White background with purple sidebar, cards, and accents |
| **Backend** | Node.js & Express.js | RESTful modular API with Express router & middlewares |
| **Database** | MongoDB Atlas & Mongoose | Flexible NoSQL documents with fallback in-memory data store |
| **Authentication** | JWT (JSON Web Tokens) & Bcrypt | Secure role-based auth (Admin, Mechanic, Manager) |
| **Invoicing & Export** | Native Print CSS & CSV Engine | Professional printable Tax Invoices, Job Cards, and Excel exports |
| **Hosting** | Hostinger VPS / Nginx / PM2 | Production-ready configuration with SSL & reverse proxy |

---

## 📐 Design Direction
- **White background** with sleek royal purple sidebar (`#581c87` / `#4c1d95`)
- **Purple primary buttons** and highlighted active menu states
- **White dashboard cards** with subtle drop-shadows and purple borders
- **Light purple highlights** (`#f5f3ff`, `#ede9fe`)
- **Clean tables** with purple headers, monospace badge identifiers, and status chips
- **Modern typography** with rounded card layouts (rounded-2xl)
- **100% Responsive** across desktop, tablet, and mobile with slide-over navigation

---

## 🚀 Key Modules & Capabilities

### 1. 📊 Dashboard Module
- **Live Operation Metrics**:
  - Total Customers & Registered Bikes
  - Today's Service Bookings
  - Completed vs. Pending Active Services
  - Today's Collection vs. Monthly Gross Revenue
  - Outstanding Dues across all customers
- **Upcoming Service Reminders Card**:
  - Highlights bikes approaching maintenance targets (+90 days or mileage thresholds)
  - One-click phone calling action
- **Active & Recent Job Cards Table**:
  - Real-time status badges (`Booked`, `In Progress`, `Ready`, `Delivered`)
  - Bill totals & outstanding balances

### 2. 👥 Customers & Bike Registry Module
- **Customer Registration**: Name, mobile (indexed), email, address, and special notes
- **Multiple Bike Registration**: Customers can register multiple two-wheelers under one profile
- **Bike Specifications**: Brand (Royal Enfield, Honda, Yamaha, KTM, TVS, Bajaj, etc.), model, uppercase registration plate number, fuel type, and current odometer reading
- **Customer Details Drawer**: Complete bike inventory and chronological workshop visit timeline

### 3. 🔧 Service Management & Job Cards
- **Job Card Generation**: Auto-incrementing format (`JC-2026-0001`)
- **Vehicle & Customer Selector**: Select customer to automatically filter their registered bikes
- **Complaint Logging**: Interactive tag-based customer complaint input
- **Itemized Estimation Engine**:
  - Dynamic **Spare Parts table** with part number, quantity, unit price, and automated item totals
  - Dynamic **Labour Charges table** with custom task descriptions
  - Automatic subtotal, discount, GST (18%) calculation, and grand total
- **Odometer Tracking**: Auto-updates the bike's current kilometre reading
- **Next Service Scheduler**: Calculates next service date (+90 days) and kilometre (+3,000 km)
- **Lifecycle Tracking**: `Booked` ➔ `In Progress` ➔ `Ready` ➔ `Delivered`
- **Printable Job Card**: Formatted for thermal or A4 physical printing with customer signature lines

### 4. 💳 Payment Management & Invoicing
- **Multi-Stage Payment Collection**: Advance token, partial milestones, and final settlement
- **Automated Balance Calculation**: Dynamically updates remaining balance and payment status (`Pending`, `Partial`, `Paid`)
- **Payment Modes**: UPI (GPay/PhonePe/QR), Cash, Credit/Debit Card (POS), and Bank Transfer (NEFT/IMPS)
- **Transaction Traceability**: Reference numbers and counter receiver records
- **Tax Invoice & Payment Receipt**: Clean, printable GST bill of supply with workshop header and warranty details

### 5. 📈 Reports & Business Intelligence
- **5 Comprehensive Analytical Reports**:
  1. *Service & Job Cards Report*: Date-wise volumes, spare parts totals, labour billing, and GST
  2. *Customer Lifetime Audit*: Registered bikes count, visit frequencies, and total lifetime spend
  3. *Upcoming & Overdue Reminders*: Overdue alerts and upcoming service forecasts
  4. *Pending Dues & Balances*: Defaulter identification with outstanding payment amounts
  5. *Collections by Payment Method*: Reconciliation of UPI vs. Cash vs. Card collections
- **One-Click Excel (CSV) Export**: Instant downloads formatted for spreadsheet analysis
- **Printable Reports**: Ready for printer or PDF archiving

---

## 🗄️ MongoDB Collections Architecture

### `users`
```typescript
{
  name: string,
  email: string (unique, lowercase),
  password: string (bcrypt hashed),
  role: 'admin' | 'manager' | 'mechanic',
  phone: string,
  workshopName: string,
  address: string,
  gstNumber: string,
  createdAt: Date
}
```

### `customers`
```typescript
{
  name: string,
  mobile: string (indexed),
  email: string,
  address: string,
  bikes: [ObjectId ref 'Bike'],
  notes: string,
  createdAt: Date
}
```

### `bikes`
```typescript
{
  customer: ObjectId ref 'Customer',
  brand: string,
  model: string,
  registrationNumber: string (uppercase, indexed),
  currentKilometre: number,
  year: number,
  fuelType: 'Petrol' | 'Electric' | 'Other',
  chassisNumber: string,
  engineNumber: string,
  color: string,
  createdAt: Date
}
```

### `services`
```typescript
{
  jobCardNumber: string (unique, indexed),
  customer: ObjectId ref 'Customer',
  bike: ObjectId ref 'Bike',
  serviceDate: Date,
  deliveryDate: Date,
  serviceType: string,
  customerComplaints: [string],
  workPerformed: string,
  spareParts: [{ name: string, partNumber: string, quantity: number, unitPrice: number, total: number }],
  labourCharges: [{ description: string, amount: number }],
  sparePartsTotal: number,
  labourTotal: number,
  discount: number,
  taxRate: number,
  taxAmount: number,
  totalAmount: number,
  paidAmount: number,
  pendingBalance: number,
  currentKilometre: number,
  nextServiceDate: Date,
  nextServiceKilometre: number,
  status: 'Booked' | 'In Progress' | 'Ready' | 'Delivered' | 'Cancelled',
  paymentStatus: 'Pending' | 'Partial' | 'Paid',
  assignedMechanic: string,
  notes: string,
  createdAt: Date
}
```

### `payments`
```typescript
{
  invoiceNumber: string (unique, indexed),
  service: ObjectId ref 'Service',
  customer: ObjectId ref 'Customer',
  totalAmount: number,
  amountPaid: number,
  paymentType: 'Advance' | 'Partial' | 'Final',
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer',
  transactionReference: string,
  pendingBalance: number,
  paymentDate: Date,
  receivedBy: string,
  notes: string,
  createdAt: Date
}
```

---

## ⚡ Quick Start & Local Development

### 1. Start Backend API
```bash
cd backend
npm run dev
```
- API will start on: `http://localhost:5000`
- If `MONGODB_URI` is not yet configured, the server runs with built-in mock store populated with realistic workshop data.
- To connect your live MongoDB Atlas database, set `MONGODB_URI` in `backend/.env` and optionally run `npm run seed`.

### 2. Start Frontend App
```bash
cd frontend
npm run dev
```
- Open `http://localhost:5173` in your browser.

### 3. Demo Login Credentials
- **Email:** `admin@bikeworkshop.com`
- **Password:** `admin123`
*(Or click the "One-Click Demo Admin Login" button on the login screen)*

---

## 🌐 Production VPS Deployment

Refer to [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for complete instructions on setting up Nginx, PM2, and Let's Encrypt SSL on Hostinger VPS.
