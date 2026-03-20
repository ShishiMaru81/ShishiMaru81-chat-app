# Chat App

A production-oriented real-time chat monorepo built with Next.js 15, Socket.IO, MongoDB, and Turborepo.

## Overview

This repository is structured to separate web UI, real-time transport, and shared domain code. It supports direct and group conversations, presence, delivery and seen tracking, and admin moderation flows.

## Core capabilities

- Real-time direct and group messaging
- Typing indicators and online presence
- Message reactions, edits, and deletes
- Delivery and seen states
- NextAuth-based authentication (Google and credentials/OTP)
- Image upload signing through ImageKit
- Admin APIs for moderation and reporting
- Docker Compose setup for local or containerized development

## Monorepo structure

```text
.
├── apps/
│   ├── web/        # Next.js app (UI + API routes)
│   └── socket/     # Socket.IO transport server
├── packages/
│   ├── db/         # Mongo connection + models
│   ├── services/   # Shared business logic, validators, repositories
│   ├── redis/      # Redis and presence helpers
│   └── types/      # Shared types and socket event contracts
├── docker/
├── nginx/
├── docker-compose.yml
└── turbo.json
```

## Architecture

1. The web app handles pages, authentication, and API endpoints.
2. API routes use shared packages for validation, persistence, and normalization.
3. The socket app handles real-time connections and room-based event broadcasting.
4. Shared contracts in packages/types keep client and server payloads aligned.
5. Redis is used for scalable socket coordination, with development-friendly behavior when not configured.

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB
- Redis (recommended)

## Environment configuration

Create a root .env file.

```env
# Core
MONGODB_URI=mongodb://localhost:27017/chat-app
NEXTAUTH_SECRET=replace_with_a_strong_secret
NEXTAUTH_URL=http://localhost:3000

# Socket and internal bridge
INTERNAL_SECRET=replace_with_shared_internal_secret
ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ImageKit (required if image upload is enabled)
NEXT_PUBLIC_PUBLIC_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
NEXT_PUBLIC_URI_ENDPOINT=

# Email/OTP (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

## Local development

1. Install dependencies.

```bash
npm install
```

2. Start all workspaces in development mode.

```bash
npm run dev
```

3. Open the applications.
- Web: http://localhost:3000
- Socket server: http://localhost:3001

## Scripts

From the repository root:

| Script | Description |
| --- | --- |
| npm run dev | Runs development mode for all workspaces via Turborepo |
| npm run build | Builds all workspaces |
| npm run start | Starts production targets where defined |
| npm run lint | Runs lint tasks across workspaces |
| npm run clean | Runs clean tasks across workspaces |

## Docker

To run with containers:

```bash
docker compose up --build
```

The compose stack includes:

- nginx
- nextapp
- socket
- redis

## Troubleshooting

- If ports 3000 or 3001 are busy, stop the existing processes and restart.
- If authentication fails, verify NEXTAUTH_SECRET and NEXTAUTH_URL.
- If realtime events do not connect, verify ORIGIN, INTERNAL_SECRET, and NEXT_PUBLIC_SOCKET_URL.

