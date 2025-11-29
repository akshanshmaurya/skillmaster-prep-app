# PrepPro Backend API

Backend server for PrepPro application with MongoDB integration.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cp env.example .env
```

Then edit `.env` and add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/preppro?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 3. Get MongoDB Connection String

**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (Free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Replace `<database-name>` with `preppro`

**Option B: Local MongoDB**
```
MONGODB_URI=mongodb://localhost:27017/preppro
```

### 4. Run the Backend Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

### Optional: Enable Online Code Execution (HackerEarth)

Add your HackerEarth credentials to `backend/.env` to run user code via the online compiler instead of local compilers:

```env
HE_API_URL=https://api.hackerearth.com/v3/code/run/
HE_CLIENT_ID=your-client-id     # optional
HE_CLIENT_SECRET=your-secret    # required
HE_TIME_LIMIT_SECONDS=5
HE_MEMORY_LIMIT_KB=262144
HE_TIMEOUT_MS=15000
```

Notes:

- When enabled, coding answers in Interview use the online judge. If not set, the app falls back to local execution.
- Your solution functions should follow the signature used in the editor templates: `solution(input: string)` for JS/Python and print the result to STDOUT.

## API Endpoints

### Authentication


#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
 
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
 
```json
{
  "message": "User created successfully",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token-here"
}
```


#### POST `/api/auth/login`
Login to existing account.

**Request Body:**
 
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
 
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "rank": 127,
    "totalScore": 1685,
    ...
  },
  "token": "jwt-token-here"
}
```


#### GET `/api/auth/me`
Get current authenticated user.

**Headers:**
 
```text
Authorization: Bearer <jwt-token>
```

**Response:**
 
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    ...
  }
}
```

### User Data


#### PATCH `/api/user/update`
Update user profile information.

**Headers:**
 
```text
Authorization: Bearer <jwt-token>
```

**Request Body:**
 
```json
{
  "name": "Updated Name",
  "bio": "My bio",
  "college": "MIT",
  "gradYear": 2025
}
```


#### PATCH `/api/user/stats`
Update user statistics.

**Headers:**
 
```text
Authorization: Bearer <jwt-token>
```

**Request Body:**
 
```json
{
  "totalScore": 1800,
  "testsCompleted": 30,
  "questionsSolved": 400,
  "accuracy": 85
}
```


#### GET `/api/user/:id`
Get user by ID.

**Headers:**
 
```text
Authorization: Bearer <jwt-token>
```

## Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  name: string,
  createdAt: Date,
  updatedAt: Date,
  
  // Stats
  rank: number,
  totalScore: number,
  testsCompleted: number,
  questionsSolved: number,
  studyHours: number,
  accuracy: number,
  avgTime: number,
  
  // Profile
  avatar: string,
  bio: string,
  college: string,
  gradYear: number,
  targetRole: string,
  
  // Arrays
  skills: Array<{skill, level, total, badge}>,
  achievements: Array<{name, icon, date, rarity}>,
  activityData: Array<{date, questions, hours}>
}
```

## Technology Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Development:** tsx (TypeScript execution)

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token-based authentication
- ✅ HTTP-only cookies (can be enabled)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Error handling

## Next Steps

1. Update frontend to call backend API at `http://localhost:5000`
2. Add more endpoints as needed (tests, leaderboard, etc.)
3. Add rate limiting and additional security
4. Deploy backend to production (e.g., Vercel, Railway, Render)

