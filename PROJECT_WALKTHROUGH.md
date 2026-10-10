# JensnMart project walkthrough

Use this as a speaking guide when explaining the project. Source files also have short comments at the top and comments above named functions and API endpoints. Start at the entry points, then follow one request through the layers.

## What the project does

JensnMart is a marketplace application with two user areas. Vendors browse products, manage a cart, place orders, and view their profile, notifications, and transactions. Administrators manage products and categories, vendors and admin accounts, orders, payments, reports, notifications, and customer contact messages.

## The request path

```text
React page or component
        │ calls the shared Axios client
        ▼
http://localhost:5000/api (Express routes)
        │ authentication / role / approval middleware
        ▼
route handler ── reads or changes data through a Mongoose model
        │
        ▼
MongoDB ── JSON response back to React
```

The browser application is in `frontend/`; the API and database integration are in `backend/`. The frontend API client adds a saved bearer token to requests. The backend verifies that token and checks the user role for protected operations. The frontend route guard improves navigation, but backend middleware is the security boundary for data and actions.

## Start and explain the application

Run each app in its own terminal from the project folder:

```powershell
cd backend
npm start
```

```powershell
cd frontend
npm start
```

The React development server is normally at `http://localhost:3000`; the API listens on port `5000`. The backend reads its MongoDB and service configuration from `backend/.env`. Keep those values private when presenting or sharing screenshots.

## Frontend tour

- `frontend/src/index.js` mounts React into the HTML root and imports global styles.
- `frontend/src/App.js` defines browser routes, role protected areas, and the global toast and chatbot widgets. The `/admin` route nests administrator pages under `AdminLayout`; vendor pages have their own routes.
- `frontend/src/services/api.js` centralizes the API base URL and attaches the login token from browser storage to outgoing requests.
- `frontend/src/components/` contains shared UI such as the header, footer, protected route, order progress timeline, confirmation toast, and chatbot.
- `frontend/src/pages/` contains public entry flows: login, account registration, password recovery, and contact form.
- `frontend/src/vendor/pages/` contains vendor dashboard, shopping cart and checkout, profile, orders, transactions, notifications, and shared vendor navigation.
- `frontend/src/admin/` contains the administrator layout and the screens for inventory, product entry/import, vendors, admins, orders, payments, categories, reports, notifications, and contact messages.
- CSS files beside a page or component style that feature. `frontend/src/index.css` supplies app-wide styles.

### A frontend request example

When a page loads data, its effect or loader calls `api.get(...)`. The shared Axios client adds the token. The page stores the returned JSON in React state, and React renders the updated screen. Form handlers follow the reverse path: gather values, call `api.post` or `api.put`, then update the UI or show a toast based on the response.

## Backend tour

- `backend/server.js` loads environment configuration, installs CORS and JSON parsing, serves uploaded files, mounts each router under `/api`, starts the MongoDB connection, and listens on port 5000.
- `backend/routes/` is the API layer. Route handlers validate/interpret requests, call models or helper services, and send status codes and JSON responses.
- `backend/middleware/` contains token authentication, optional authentication, role authorization, and the check that a vendor has admin approval.
- `backend/models/` defines Mongoose schemas: the field shapes, defaults, validation rules, and references used to store application records.
- `backend/config/upload.js` configures image uploads to disk and chooses folders for product and vendor profile images.
- `backend/utils/notificationService.js` creates in-app notifications and optionally emails vendors or administrators.
- `backend/utils/mailer.js` prepares outbound email/SMS helpers from environment configuration.
- `backend/uploads/` is runtime storage for uploaded images; it is served under `/uploads`.

## Main data records

| Model | What it represents |
| --- | --- |
| `Admin` | Admin or manager account, approval, and password reset fields |
| `Vendor` | Vendor account, approval, profile, and delivery addresses |
| `Category`, `SubCategory` | Product grouping; a subcategory belongs to a category |
| `Product` | Product details, stock, image path, category, and optional vendor |
| `Cart` | A vendor's active cart and its product quantities |
| `Order` | Checkout snapshot, totals, commission, delivery status, and status history |
| `Payment` | Payment method/status and payment-provider identifiers linked to an order |
| `Notification` | Read/unread messages addressed to an admin or vendor |
| `ContactMessage` | Public contact form submissions and their review status |
| `RestockSubscription` | A vendor's request to be notified when an out-of-stock product returns |

MongoDB references connect records (for example, a cart item references a product). Order product details are also copied into the order at checkout so a later product change does not rewrite the historical purchase description/price.

## Features worth demonstrating

1. **Sign in and authorization:** login returns a token and role; the frontend stores them, and backend middleware verifies the token and access role on protected endpoints.
2. **Catalog and inventory:** administrators create/edit products and categories; product routes can also parse spreadsheet imports. Vendors fetch the catalog and can search/filter it in the dashboard.
3. **Cart and checkout:** cart routes persist quantities; checkout checks the vendor and stock, creates an order and payment record, and updates inventory. Payment routes handle payment creation and verification when the payment provider is configured.
4. **Order lifecycle:** order status changes are recorded, shown in vendor/admin screens, and can trigger notifications.
5. **Notifications and restock:** the notification helper centralizes database notifications and optional email; vendors can request a restock alert for unavailable products.
6. **Operations and communication:** admin reports aggregate sales/order data; contact messages and notification pages support ongoing administration.

For a live demo, use test accounts and payment credentials only. Payment/email/AI features depend on valid service configuration, and database-backed features depend on a successful MongoDB connection.

## Suggested presentation order

1. State the two roles and the marketplace problem the app addresses.
2. Show `App.js` to explain navigation and the admin/vendor split.
3. Open `api.js`, one screen, its matching route file, and the relevant model to show a complete request path.
4. Demonstrate a simple catalog read, then explain cart → order → payment as the main business flow.
5. Point out middleware as the backend access-control layer and the notification service as shared cross-feature logic.
6. Close with the MongoDB and external-service configuration requirements.

## Quick route map

The server mounts route files beneath these prefixes: `/api/admin`, `/api/vendor`, `/api/products`, `/api/orders`, `/api/cart`, `/api/categories`, `/api/subcategories`, `/api/payments`, `/api/notifications`, `/api/ai`, and `/api/contact`. Each route file documents its endpoint purpose near its registration; consult it for the exact HTTP method and path.

## Files that are intentionally not commented inline

JSON files such as `package.json`, lockfiles, `manifest.json`, and `jsconfig.json` do not allow comments; adding them would make the files invalid. Images are binary assets, so their purpose is described here instead of inside the image data. `backend/.env` contains private runtime configuration and is intentionally left untouched. The code and stylesheet files contain file-purpose notes and meaningful function or endpoint comments.
