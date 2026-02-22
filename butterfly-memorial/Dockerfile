FROM node:20-alpine

WORKDIR /app

# Install deps first (cached unless package.json changes)
COPY package*.json ./
RUN npm install

# Source is volume-mounted in dev — this is only for standalone builds
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
