# Multi-stage Dockerfile

# Stage 1: Build React Frontend
FROM node:18-alpine as client-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Server (Node + TeXLive)
FROM node:18-bullseye-slim

# 1. Install TeXLive (Full LaTeX distribution for compiling resumes)
# We use apt-get to install a solid subset of TeXLive to keep size managed but functional.
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-xetex \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Setup Backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ ./

# 3. Copy Built Frontend from Stage 1
# server.js is configured to serve '../frontend/dist'
COPY --from=client-build /app/frontend/dist ../frontend/dist

# 4. Expose Port
ENV PORT=8000
EXPOSE 8000

# 5. Start Application
CMD ["node", "server.js"]
