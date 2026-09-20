FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
COPY tests ./tests
RUN npm run build
RUN cp -R src/views dist/views

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
RUN useradd --create-home --uid 10001 autopilot \
  && mkdir -p /var/lib/social-autopilot \
  && chown -R autopilot:autopilot /app /var/lib/social-autopilot
USER autopilot
EXPOSE 3000
CMD ["node", "dist/index.js"]
