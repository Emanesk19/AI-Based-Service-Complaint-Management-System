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
