FROM node:20-alpine

WORKDIR /app

# Copiar manifests del monorepo antes de instalar
COPY package*.json ./
COPY packages/ ./packages/
COPY website/package*.json ./website/

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY website/ ./website/

ENV PATH=/app/node_modules/.bin:$PATH

WORKDIR /app/website

EXPOSE 4173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
