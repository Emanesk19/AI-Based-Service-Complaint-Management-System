# API Endpoint Reference

## Analytics (Phase 1.1)

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/analytics/dashboard` | **Agent** | Comprehensive dashboard metrics |
| `GET` | `/api/analytics/trends` | **Agent** | Ticket volume trends (daily/weekly/monthly) |
| `GET` | `/api/analytics/performance` | **Agent** | Agent performance and rankings |
| `GET` | `/api/analytics/category-breakdown` | **Agent** | Analysis of ticket categories |
| `GET` | `/api/analytics/sla-compliance` | **Agent** | SLA breach tracking and at-risk tickets |
| `GET` | `/api/analytics/predict-resolution-time/:id` | **Agent** | AI forecasted resolution time |
| `GET` | `/api/analytics/recommend-agent/:id` | **Agent** | AI agent assignment recommendation |
| `GET` | `/api/analytics/ticket-clustering` | **Agent** | Identify recurring issue patterns |

## 🔔 Notifications (Phase 2.1)

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/notifications` | **Authenticated** | Get user's notifications |
| `PUT` | `/api/notifications/read-all` | **Authenticated** | Mark all as read |
| `PUT` | `/api/notifications/:id/read` | **Authenticated** | Mark specific notification as read |
| `DELETE` | `/api/notifications/:id` | **Authenticated** | Delete a notification |

## ⚙️ Configuration (Phase 2.2)

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/config/categories` | **Authenticated** | List all ticket categories |
| `GET` | `/api/config/priorities` | **Authenticated** | List all ticket priorities |
| `POST` | `/api/config/categories` | **Admin** | Create new category |
| `DELETE` | `/api/config/categories/:id` | **Admin** | Delete category |
| `POST` | `/api/config/priorities` | **Admin** | Create new priority |
| `DELETE` | `/api/config/priorities/:id` | **Admin** | Delete priority |

## 📊 Reporting & Exports (Phase 3.3)

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/reports/export/csv` | **Admin** | Export tickets to CSV (supports filters) |
| `GET` | `/api/reports/export/pdf` | **Admin** | Export summary dashboard to PDF |

## Quick stats

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/stats/summary` | **Authenticated** | Basic system statistics summary |

## Tickets

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/tickets/search` | **Agent** | Advanced search with filters (q, status, priority, etc.) |
| `GET` | `/api/tickets/all` | **Agent** | Get all tickets with filtering & pagination |
| `GET` | `/api/tickets/:id` | **Authenticated** | Get specific ticket details |
| `POST` | `/api/tickets` | **Authenticated** | Create a new ticket |

## User Management (Admin Only)

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/users` | **Admin** | List all users with filters (search, role, status) |
| `GET` | `/api/users/:id` | **Admin** | Get detailed user profile and activity |
| `PUT` | `/api/users/:id/role` | **Admin** | Update user role (user, agent, admin) |
| `PUT` | `/api/users/:id/status` | **Admin** | Activate/Deactivate user account |

## Authentication

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/auth/register` | **Public** | Register new user/agent |
| `POST` | `/api/auth/login` | **Public** | Login to get JWT token |

---

## Role Definitions
- **Public**: Accessible by anyone
- **Authenticated**: Requires valid JWT token (User or Agent)
- **Agent**: Requires valid JWT token with `role: "agent"`
