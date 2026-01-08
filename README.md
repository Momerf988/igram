# igram App

A simple Instagram-like application with creator and consumer roles.

## Features

- **Registration**: Consumers can register for new accounts
- **Login**: Both creators and consumers can login
- **Home Page**: Displays all posts created by the creator
- **Consumer Features**: View posts, like posts, comment on posts
- **Creator Features**: All consumer features + create, edit, delete posts

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React.js, React Router
- **Authentication**: JWT (JSON Web Tokens)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas connection string)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory (or update the existing one):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/igram
JWT_SECRET=your-secret-key-change-this-in-production
```

4. Start the backend server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

**Note**: A default creator account will be automatically created:
- Email: `creator@igram.com`
- Password: `creator123`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

## Usage

1. **Register as Consumer**: 
   - Go to `/register`
   - Fill in username, email, and password
   - Click Register

2. **Login**:
   - Go to `/login`
   - Enter email and password
   - Click Login

3. **Home Page**:
   - View all posts
   - Like posts by clicking the heart icon
   - Comment on posts using the comment form
   - If you're the creator, you can:
     - Create new posts (click "Create Post" button)
     - Edit posts (click "Edit" button on your posts)
     - Delete posts (click "Delete" button on your posts)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new consumer
- `POST /api/auth/login` - Login (creator or consumer)

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get a single post
- `POST /api/posts` - Create a post (creator only)
- `PUT /api/posts/:id` - Update a post (creator only)
- `DELETE /api/posts/:id` - Delete a post (creator only)

### Comments
- `POST /api/comments` - Add a comment
- `GET /api/comments/post/:postId` - Get comments for a post
- `DELETE /api/comments/:id` - Delete a comment

### Likes
- `POST /api/likes/:postId` - Toggle like on a post
- `GET /api/likes/:postId/status` - Check like status

## Project Structure

```
igram-app/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   └── likes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.js
│   └── package.json
└── README.md
```

## Notes

- Make sure MongoDB is running before starting the backend
- The creator account is static (only one creator exists)
- All consumers must register before they can login
- Image URLs should be valid URLs pointing to images on the web
