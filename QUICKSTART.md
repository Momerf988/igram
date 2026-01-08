# Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB running (local or MongoDB Atlas)

## Step 1: Start MongoDB
Make sure MongoDB is running on your system.

## Step 2: Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mini-instagram
JWT_SECRET=your-secret-key-change-this-in-production
```

Start the backend:
```bash
npm start
```

The backend will automatically create a default creator account:
- Email: `creator@instagram.com`
- Password: `creator123`

## Step 3: Setup Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

## Step 4: Use the App

1. **Register as Consumer**: Go to Register page and create an account
2. **Login**: Use your credentials or the creator account
3. **Home Page**: 
   - View all posts
   - Like and comment on posts
   - If logged in as creator, you can create, edit, and delete posts

## Default Creator Account
- Email: `creator@instagram.com`
- Password: `creator123`

Enjoy your Mini Instagram app! 🎉
