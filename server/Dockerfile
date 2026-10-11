# Tactic-Topia game server. Node 24 runs the TypeScript directly (no build step); the server shares
# the rules engine (engine/) and the bots (sim/bots.ts) with the app and the simulations.
# Build from the project root:  docker build -f server/Dockerfile .
FROM node:24-slim
WORKDIR /app
COPY package.json ./
COPY engine engine
COPY sim/bots.ts sim/bots.ts
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev
COPY server/src server/src
ENV PORT=8080 DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server/src/index.ts"]
