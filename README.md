# Admin Panel Backend API

Node.js/Express backend API for the Admin Panel application.

## Features

- User authentication (Register, Login, Password Reset)
- JWT token-based authorization
- Reservation management system
- MongoDB database integration
- Role-based access control (RBAC)
- CORS support for frontend integration
- Input validation and error handling

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Password Hashing:** bcryptjs
- **Environment:** dotenv

## Installation

```bash
npm install
```

## Environment Variables

Use the included `.env` template in the root directory, or create a local copy with these values:

```
MONGODB_URI=******cluster.mongodb.net/admin-panel
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
NODE_ENV=development
FRONTEND_URL=https://admin-panel-9zcg-jet.vercel.app
```

## Running the Server

```bash
# Development with nodemon
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify` - Verify JWT token

### Reservations
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create new reservation
- `GET /api/reservations/:id` - Get reservation by ID
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation
- `GET /api/reservations/stats/overview` - Get dashboard statistics

## Project Structure

```
admin-panel-backend/
├── server.js
├── package.json
├── .env
├── .gitignore
├── routes/
│   ├── auth.js
│   └── reservations.js
├── models/
│   ├── User.js
│   └── Reservation.js
├── middleware/
│   └── auth.js
└── config/
    └── database.js
```

## License

MIT
