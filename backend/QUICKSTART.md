# Quick Start Guide

## 🎯 Get Started in 3 Steps

### Step 1: Install Dependencies (1 minute)

```bash
cd backend
npm install
```

### Step 2: Configure MongoDB (2 minutes)

1. **Get FREE MongoDB Atlas account:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up (it's free!)
   - Create a free M0 cluster
   - Get your connection string

2. **Create `.env` file:**
   ```bash
   # In the backend folder, create a file named .env
   ```

3. **Add this to `.env`:**
   ```env
   MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/preppro?retryWrites=true&w=majority
   JWT_SECRET=my-secret-key-123456789
   PORT=5000
   CORS_ORIGIN=http://localhost:3000
   ```

   Replace `youruser:yourpass@cluster0.xxxxx.mongodb.net` with your actual connection string from MongoDB Atlas.

### Step 3: Run the Server (10 seconds)

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server is running on port 5000
```

## ✅ That's It!

Now run your frontend:
```bash
# In a NEW terminal, from the root folder
cd ..
npm run dev
```

Visit `http://localhost:3000` and try signing up!

## 🧪 Test Your Setup

**Create a test account:**
1. Click "Get Started" on homepage
2. Click "Create one"
3. Fill in:
   - Name: Test User
   - Email: test@test.com
   - Password: 123456
4. Click "Create Account"

If it works, you'll be redirected to the dashboard! 🎉

## 📌 MongoDB Atlas Quick Setup

1. **Sign up:** https://www.mongodb.com/cloud/atlas/register
2. **Create FREE cluster:** Click "Build a Database" → "M0 Free"
3. **Create user:** Security → Database Access → Add User
4. **Whitelist IP:** Security → Network Access → Add IP (use 0.0.0.0/0 for all IPs)
5. **Get connection:** Database → Connect → Drivers → Copy string

## ❓ Need Help?

Check `backend/README.md` for detailed API documentation and troubleshooting.

