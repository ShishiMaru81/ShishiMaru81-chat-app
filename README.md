# 🚀 Real-Time Chat Application

A production-grade real-time chat application built with **Next.js 15**, featuring group & direct messaging, authentication, optimistic UI updates, and live WebSocket communication.

This project demonstrates scalable system design, clean architecture separation, and modern real-time application patterns.

---

## ✨ Features

### 💬 Messaging
- Real-time messaging with Socket.IO
- Group & direct conversations
- Message edit & delete
- Emoji reactions
- Delivery & seen receipts
- Day-based message grouping
- Typing indicators
- Online/offline presence tracking

### ⚡ User Experience
- Optimistic UI with temporary messages
- Smooth auto-scroll behavior
- Dark/Light theme support
- Clean and responsive UI

### 📁 Media Support
- Image uploads
- File attachments
- Profile picture management
- Secure upload signing via ImageKit

### 🔐 Authentication & Security
- NextAuth authentication (Credentials + OAuth)
- Session-based authentication
- OTP verification system
- Role-based access control (Admin/User)
- API rate limiting
- Input validation with schema validation
- Protected routes via middleware

### 📊 Admin System
- Admin dashboard
- User role management
- Ban/Unban users
- Conversation analytics
- System stats overview

### 🌐 Advanced Features
- Offline message queue (IndexedDB)
- Multi-device synchronization
- DTO-based server-client normalization
- Socket event contract architecture
- Redis adapter support for scaling
- Docker support

---

## 🏗 Architecture Overview

```
Client (Next.js Frontend)
        ↓
Next.js API Routes (Business Logic + DB Writes)
        ↓
MongoDB (Persistence Layer)

Socket Server (Transport Layer Only)
        ↓
Room-Based Event Broadcasting
```

### Architecture Principles

- Separation of business logic and transport layer
- Optimistic UI updates
- DTO-based data normalization
- Scalable socket room broadcasting
- Clean modular folder structure
- Production-ready structure

---

## 🛠 Tech Stack

### Frontend
- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Zustand (State Management)

### Backend
- Next.js API Routes
- Express + Socket.IO (Transport Layer)

### Database
- MongoDB with Mongoose

### Authentication
- NextAuth.js

### File Storage
- ImageKit

### DevOps
- Docker
- Redis Adapter

---

## 📂 Project Structure

```
├── src
│   ├── app
│   │   ├── api
│   │   ├── (chat)
│   │   ├── admin
│   │   └── auth
│   ├── components
│   │   ├── home
│   │   ├── chat
│   │   └── admin
│   ├── models
│   ├── store
│   ├── lib
│   ├── context
│   └── types
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.socket
└── socket.ts
```

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

NEXT_PUBLIC_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

---

## 🧪 Getting Started

### 1️⃣ Install dependencies

```
npm install
```

### 2️⃣ Run the Next.js development server

```
npm run dev
```

### 3️⃣ Start the socket server (if separate)

```
npm run dev:socket
```

### 4️⃣ Open in browser

```
http://localhost:3000
```

---

## 🐳 Docker Setup

Run the full stack (Next.js + Socket + MongoDB + Redis):

```
docker-compose up --build
```

---

## 📡 Real-Time Event Flow

1. User sends message
2. Optimistic message added to UI
3. API route saves message to MongoDB
4. Server normalizes message to DTO
5. Socket server broadcasts to conversation room
6. Clients replace temporary message with confirmed one
7. Delivery & seen updates are emitted back to sender

---

## 🔒 Security Measures

- Session validation in API routes
- Server-side sender verification
- Role-based access checks
- Rate limiting on authentication & messaging endpoints
- Secure upload token generation
- Input validation using schemas
- Protected admin routes

---

## 📈 Future Improvements

- End-to-End Encryption (E2EE)
- Two-Factor Authentication (2FA)
- Push Notifications
- Advanced search with MongoDB aggregation
- Unit & integration testing suite
- CI/CD pipeline
- Mobile application version

---

## 🧠 What This Project Demonstrates

- Real-time system architecture
- Scalable WebSocket design
- State management at scale
- Clean client-server separation
- Optimistic UI implementation
- Production-grade folder structure
- Admin control system implementation

---

## 👨‍💻 Author

**Harshdeep Singh**  
Full-Stack Developer  
Focused on real-time systems & scalable backend architecture  

---

## 📜 License

MIT License