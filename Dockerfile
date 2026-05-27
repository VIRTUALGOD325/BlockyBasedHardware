# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /apps

COPY package*.json ./
RUN npm install

COPY . .

# Vite bakes these into the bundle at build time — must be ARGs not ENVs
ARG VITE_BASE_PATH=/hardware/
ARG VITE_COMPILE_SERVER_URL=/api/compile
ARG VITE_SCRATCH_API_URL=/api/scratch/api

RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /apps/dist /usr/share/nginx/html

# SPA on port 5173; paths under /hardware/ fall back to index.html
RUN printf 'server {\n\
    listen 5173;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location /hardware/ {\n\
        try_files $uri $uri/ /hardware/index.html;\n\
    }\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|wasm)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
