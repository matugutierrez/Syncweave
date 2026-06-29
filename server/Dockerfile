FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages/crdt/package.json packages/crdt/
COPY server/package.json server/
RUN npm install
COPY . .
RUN npm run build --workspace packages/crdt && npm run build --workspace server

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/crdt/dist ./packages/crdt/dist
COPY --from=build /app/packages/crdt/package.json ./packages/crdt/
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/
EXPOSE 8080
CMD ["node", "server/dist/index.js"]
