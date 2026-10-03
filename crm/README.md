# Warranty CRM Web Portal (`warranty-crm`)

> **Operational After-Sales Service Portal & POS Counter Interface for UIT CARE.**  
> Built with **Next.js 16 (App Router + Turbopack)**, **React 19**, **Tailwind CSS v4**, **TanStack React Query v5**, and **Valtio**.

---

## 1. Overview & Architecture

The `crm` web portal is designed for high-speed counter operations, real-time ticket tracking, and multi-role service dispatch.

### Tech Stack:
- **Framework**: Next.js 16 (Turbopack engine, App Router).
- **Core UI**: React 19, Tailwind CSS v4, Lucide Icons.
- **Client State**: Valtio (Lightweight reactive proxy store for authentication and persistent session state).
- **Server State**: TanStack React Query v5 (Optimistic caching, automated background refetching, mutation states).
- **Network**: Axios with customized Interceptors (Automated queueing and silent JWT token refresh).
- **Printing**: POS 80mm Thermal Receipt CSS layout with `@media print`.

---

## 2. Dedicated Role Portals & Pages

| Route | Target Role | Key Features |
| :--- | :--- | :--- |
| **`/login`** | All Staff | Secure login with **1-Click Demo** buttons for Manager, Receptionist, and Technician roles. |
| **`/tra-cuu`** | Public / Customers | Unauthenticated lookup portal allowing customers to check repair status via Ticket Code or Phone Number. |
| **`/reception`** | Receptionist (POS) | Customer creation, device intake, problem logging, and instant **80mm Thermal Receipt** printing. |
| **`/technician`** | Technician | Interactive workbench: view assigned repairs, input technical diagnosis, allocate parts from inventory, update statuses. |
| **`/cashier`** | Cashier / Billing | Review labor charges and billable parts, apply warranty discounts, process payments, and print thermal tax invoices. |
| **`/dashboard`** | Manager | Executive analytics: revenue trends, ticket turnaround times, SLA delay notifications, invoice discrepancy audit. |
| **`/inventory`** | Manager | Parts stock monitoring, low-stock warnings, and warehouse restocking. |
| **`/employees`** | Manager | Personnel directory, role assignment, and access control management. |

---

## 3. Key Technical Standards

### 3.1 Design System & Color Policy
- **Palette**: Warm enterprise palette featuring **Sand**, **Espresso**, and **Bronze** tones.
- **Rule**: All UI components use centralized Tailwind CSS tokens (`bg-sand-50`, `border-sand-200`, `text-bronze-600`) and constants from `@/common/constants`. Arbitrary hex codes in components are prohibited.

### 3.2 Silent JWT Refresh Interceptor
When the short-lived access token expires:
1. Axios interceptor catches the `401 Unauthorized` response.
2. Queues all ongoing requests so no user action is dropped.
3. Issues a background POST to `/api/auth/refresh` using the stored refresh token.
4. Seamlessly replays all queued requests with the new bearer token without user interruption.

### 3.3 POS Thermal Receipt Printing
Receipts and invoices are built with print-specific styling:
- Monospace font alignment for tabular line items.
- Fixed 80mm width layout with zero margin overflow.
- Clean barcode and QR code placements for customer ticket scans.

---

## 4. Environment Variables

Create `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port for Next.js web server |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001/api` | Base URL of the Core API Gateway |

---

## 5. Development & Build Scripts

```bash
# Install dependencies
pnpm install

# Start development server with Turbopack hot reload
pnpm run dev

# Run ESLint check
pnpm run lint

# Build production application bundle
pnpm run build

# Start production server
pnpm run start
```
