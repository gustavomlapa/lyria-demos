# Estágio de build
FROM node:20 AS build

# 1. Declara o argumento de build para recebê-lo do comando docker build
ARG VITE_GEMINI_API_KEY

# 2. Define a variável de ambiente a partir do argumento para que o npm a acesse
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de produção
FROM node:20-alpine AS production
WORKDIR /app
# Copia apenas os artefatos de build e o package.json para a imagem de produção
COPY --from=build /app/dist ./dist
COPY package.json .
# Instala apenas as dependências de produção, incluindo o 'serve'
RUN npm install --only=production
# O comando 'serve' usa a variável de ambiente PORT automaticamente.
# O '-s' serve o conteúdo do diretório 'dist' e o trata como uma SPA.
CMD [ "npx", "serve", "-s", "dist" ]