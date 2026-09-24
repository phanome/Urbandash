# UrbanDash — Driver Payout Dashboard

UrbanDash is a full-stack operations dashboard and payout calculation engine built for delivery executive management. It processes complex shift hours, delivery distance, peak/rain conditions, streak incentives, and rejection penalties into an automated, transparent earnings breakdown.

---

## 🌐 Live Deployments

- **Frontend (Vercel):** [https://urbandash-gilt.vercel.app](https://urbandash-gilt.vercel.app)
- **Backend API (Render):** [https://urbandash-h1uh.onrender.com/api](https://urbandash-h1uh.onrender.com/api)
- **Database:** MongoDB Atlas (Cloud Cluster)

---

## ⚡ Key Features

- **Automated Payout Engine:** Computes base pay, hourly shift pay, time-of-day peak multipliers, rain surcharges, long-distance bonuses, streak incentives, and rejection deductions.
- **Interactive Multi-Step Add Driver Modal:**
  - **Step 1: Driver Info & Shift Times** — Input name, custom/auto-generated ID, and shift times.
  - **Step 2: Deliveries Builder** — Add individual deliveries with interactive condition chips (Peak, Rain, >8km, Rejected).
  - **Step 3: Real-Time Preview** — Integrates dry-run calculation (`POST /api/calculate`) to review exact payout structure before saving.
- **Driver Management:**
  - **Detailed Drawer View** — Detailed breakdown of per-delivery bonuses, shift duration, KPIs, and dispute notices.
  - **Inline Delete Action** — Hover table rows to trigger delete prompt with inline confirmation banner (`DELETE /api/drivers/:id`).
- **Clean Architecture & Design System:** Minimalist UI with CSS design tokens, responsive typography, status badges, and loading states.

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3 (Vanilla CSS with custom variables), Modern JavaScript (ES6+ async/await)
- **Backend:** Node.js, Express.js, Mongoose ODM
- **Database:** MongoDB Atlas (Cloud Instance)
- **Hosting & CI/CD:** Vercel (Frontend), Render (Backend), GitHub

---

## 📡 API Endpoints

### 1. Fetch All Drivers Summary
```http
GET /api/drivers
```
Returns summary metrics (shift hours, delivery counts, status badges, total payout) for all drivers.

### 2. Fetch Driver Detailed Payout
```http
GET /api/payout/:driverId
```
Returns comprehensive payout breakdown including individual delivery line items, condition tags, shift pay qualification, and KPI totals.

### 3. Dry-Run Payout Calculation
```http
POST /api/calculate
```
Calculates payout breakdown for input driver data **without** saving to MongoDB. Used for real-time modal previews.

### 4. Create & Save Driver
```http
POST /api/drivers
```
Validates payload, auto-generates driver ID if missing, persists new driver to MongoDB Atlas, and returns calculated payout.

### 5. Delete Driver
```http
DELETE /api/drivers/:driverId
```
Removes driver record from MongoDB Atlas database by `driverId`.

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB Atlas URI (or local MongoDB instance)

### 1. Clone Repository
```bash
git clone https://github.com/phanome/Urbandash.git
cd Urbandash
```

### 2. Configure Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/urbandash?retryWrites=true&w=majority
PORT=3001
```

Start backend server:
```bash
npm start
```
*Backend runs on `http://localhost:3001`.*

### 3. Run Frontend
Open `frontend/index.html` in your browser or serve using any static server (e.g. `npx serve frontend`).
