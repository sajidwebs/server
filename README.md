# Pamsforce Backend API

This is the backend API for the Pamsforce application, built with Node.js, Express, and PostgreSQL.

## Table of Contents
1. [Getting Started](#getting-started)
2. [API Endpoints](#api-endpoints)
3. [Authentication](#authentication)
4. [Database Schema](#database-schema)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### Installation
1. Clone the repository
2. Navigate to the `server` directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables in `.env` file
5. Start the server:
   ```bash
   npm start
   ```

### Environment Variables
Create a `.env` file in the server directory with the following variables:
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pamsforce-db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /profile` - Get current user profile

### User Routes (`/api/users`)
- `GET /` - Get all users (admin only)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (admin only)

### Doctor Routes (`/api/doctors`)
- `GET /` - Get all doctors
- `GET /:id` - Get doctor by ID
- `POST /` - Create new doctor
- `PUT /:id` - Update doctor
- `DELETE /:id` - Delete doctor

### Chemist Routes (`/api/chemists`)
- `GET /` - Get all chemists
- `GET /:id` - Get chemist by ID
- `POST /` - Create new chemist
- `PUT /:id` - Update chemist
- `DELETE /:id` - Delete chemist

### Activity Routes (`/api/activities`)
- `GET /` - Get all activities
- `GET /:id` - Get activity by ID
- `POST /` - Create new activity
- `PUT /:id` - Update activity
- `DELETE /:id` - Delete activity

### Sales Routes (`/api/sales`)
- `GET /` - Get all sales
- `GET /:id` - Get sale by ID
- `POST /` - Create new sale
- `PUT /:id` - Update sale
- `DELETE /:id` - Delete sale

### Day Call Routes (`/api/daycalls`)
- `GET /` - Get all day calls
- `GET /:id` - Get day call by ID
- `POST /` - Create new day call
- `PUT /:id` - Update day call
- `DELETE /:id` - Delete day call

### Projection Routes (`/api/projections`)
- `GET /` - Get all projections
- `GET /:id` - Get projection by ID
- `POST /` - Create new projection
- `PUT /:id` - Update projection
- `DELETE /:id` - Delete projection

### Business Routes (`/api/business`)
- `GET /` - Get all business entries
- `GET /:id` - Get business entry by ID
- `POST /` - Create new business entry
- `PUT /:id` - Update business entry
- `DELETE /:id` - Delete business entry

### Notification Routes (`/api/notifications`)
- `GET /` - Get all notifications
- `GET /:id` - Get notification by ID
- `POST /` - Create new notification (admin only)
- `PUT /:id/read` - Mark notification as read
- `DELETE /:id` - Delete notification

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Process
1. User sends POST request to `/api/auth/login` with email and password
2. Server validates credentials
3. If valid, server generates JWT token with user ID and email
4. Server returns token and user information
5. Client stores token (typically in localStorage or secure cookies)
6. For subsequent requests, client includes token in Authorization header:
   ```
   Authorization: Bearer <token>
   ```

### Token Validation
All protected routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

The server validates the token and attaches the user object to the request for use in route handlers.

## Database Schema

The application uses PostgreSQL with the following tables:

### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'manager') DEFAULT 'user',
  isActive BOOLEAN DEFAULT true,
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Doctors
```sql
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  specialty VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Chemists
```sql
CREATE TABLE chemists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Activities
```sql
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  startTime TIME,
  endTime TIME,
  status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
  location VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Sales
```sql
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  productId INTEGER,
  productName VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  totalAmount DECIMAL(10,2) NOT NULL,
  chemistId INTEGER,
  date DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (chemistId) REFERENCES chemists(id)
);
```

### Day Calls
```sql
CREATE TABLE day_calls (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  date DATE NOT NULL,
  startTime TIME,
  endTime TIME,
  location VARCHAR(255),
  purpose VARCHAR(255),
  status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
  remarks TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Projections
```sql
CREATE TABLE projections (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  productId INTEGER,
  productName VARCHAR(255) NOT NULL,
  projectedQuantity INTEGER NOT NULL,
  actualQuantity INTEGER DEFAULT 0,
  projectedAmount DECIMAL(10,2) NOT NULL,
  actualAmount DECIMAL(10,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Business Entries
```sql
CREATE TABLE business (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  doctorId INTEGER NOT NULL,
  productId INTEGER,
  productName VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  date DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (doctorId) REFERENCES doctors(id)
);
```

### Notifications
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
  isRead BOOLEAN DEFAULT false,
  readAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## Error Handling

The API follows standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "message": "Error description",
  "errors": [] // Optional, for validation errors
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address
- Exceeding the limit returns a 429 status code

## Development

### Running in Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Deployment

### Production Build
```bash
npm start
```

### Environment
Set `NODE_ENV=production` in production environments.

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.