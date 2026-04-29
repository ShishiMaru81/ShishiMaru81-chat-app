FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY apps/task-worker ./apps/task-worker
COPY packages ./packages
RUN npm ci --include=dev --legacy-peer-deps
RUN npm run clean:artifacts
RUN npm run build --workspace=@chat/types
RUN npm run build --workspace=@chat/db
RUN npm run build --workspace=@chat/services
RUN npm run build --workspace=@chat/task-worker

EXPOSE 4444
CMD ["npm", "run", "start", "--workspace=@chat/task-worker"]