FROM node:24.19.0-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --chown=node:node . .

USER node

EXPOSE 3000

CMD ["npm", "start"]

LABEL com.machine-tracker.component="api" \
      com.machine-tracker.version="1.0.1"