# COMP229 Booking System Application

Backend REST API for a cat booking system (Node.js, Express, MongoDB, JWT).
Cat lovers can sign up, sign in, and book time to spend with cats owned by their owners (create / view / update / cancel bookings).

## Setup

```
cd server
npm install
# create a .env file using .env.example
npm start
```

## Environment variables

| Name | Description |
|---|---|
| ATLASDB | MongoDB connection string |
| SECRETKEY | Secret key used to sign JWT tokens |
| PORT | Server port (default 3000) |

## Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | /api/users | No | Sign up |
| POST | /api/users/signin | No | Sign in (returns token) |
| GET | /api/users | Admin | List users |
| GET | /api/users/:id | Owner/Admin | Get user |
| PUT | /api/users/:id | Owner/Admin | Update user |
| DELETE | /api/users/:id | Owner/Admin | Delete user |
| GET | /api/bookings | Yes | List my bookings (admin: all) |
| GET | /api/bookings/:id | Owner/Admin | Get booking |
| POST | /api/bookings | Yes | Create booking |
| PUT | /api/bookings/:id | Owner/Admin | Update booking |
| DELETE | /api/bookings/:id | Owner/Admin | Cancel booking (soft delete) |

Protected routes need the header: `Authorization: Bearer <token>`

## Booking rules

- End date must be after start date (400)
- The same cat cannot be booked twice for overlapping times (409)
- Only admins can change a booking's status (`pending` / `confirmed` / `cancelled`)
