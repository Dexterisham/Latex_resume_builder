# Optimized Dockerfile for Backend-only (Render)
FROM node:18-bullseye-slim

# 1. Install TeXLive (Minimized for size but functional)
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-xetex \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Setup Backend Dependencies
COPY backend/package*.json ./
RUN npm install --production

# 3. Copy Backend Source (includes data/templates we just populated)
COPY backend/ ./

# 4. Expose dynamic Port (Render uses 10000 or the $PORT env)
ENV PORT=10000
EXPOSE 10000

# 5. Start Backend Server
CMD ["node", "server.js"]
