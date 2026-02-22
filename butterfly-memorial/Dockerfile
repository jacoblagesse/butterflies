FROM node:20-alpine

WORKDIR /app

# Install deps at startup (volume mount overwrites build-time node_modules)
COPY package*.json ./

EXPOSE 5173

CMD ["sh", "-c", "npm install --include=dev && npm run dev -- --host 0.0.0.0"]
