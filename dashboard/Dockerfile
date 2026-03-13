FROM node:20-alpine

WORKDIR /app

# Copiar monorepo completo (necesario para @viernes/ui)
COPY package*.json ./
COPY packages/ ./packages/

# Instalar dependencias raíz (workspaces)
RUN npm install

# Copiar dashboard
COPY dashboard/ ./dashboard/

WORKDIR /app/dashboard

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]