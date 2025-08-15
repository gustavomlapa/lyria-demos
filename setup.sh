#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

PROJECT_ID="seu-project-id"
REPO_NAME="cloud-run-source-deploy"
SECRET_NAME="VITE_GEMINI_API_KEY"
REGION="us-central1"


echo "--- Iniciando configuração do ambiente para o Cloud Run ---"

# 1. Configura o gcloud para usar o projeto correto
echo "1. Configurando o projeto GCP para: ${PROJECT_ID}"
gcloud config set project ${PROJECT_ID}

# 2. Ativa as APIs necessárias
echo "2. Ativando as APIs necessárias (Cloud Run, Artifact Registry, Cloud Build, Secret Manager)..."
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com

# 3. Cria o repositório no Artifact Registry se ele não existir
echo "3. Verificando o repositório do Artifact Registry: ${REPO_NAME}"
if ! gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} --project=${PROJECT_ID} &> /dev/null; then
  echo "-> Criando o repositório do Artifact Registry..."
  gcloud artifacts repositories create ${REPO_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="Repositório para imagens da aplicação Lyria Demos" \
    --project=${PROJECT_ID}
else
  echo "-> Repositório '${REPO_NAME}' já existe."
fi

# 4. Verifica e cria o Secret no Secret Manager se ele não existir
echo "4. Verificando a existência do Secret: ${SECRET_NAME}"
if ! gcloud secrets describe ${SECRET_NAME} --project=${PROJECT_ID} &> /dev/null; then
  echo "-> Secret '${SECRET_NAME}' não encontrado."
  echo -n "   Por favor, insira o valor da API Key para criar o secret e pressione [ENTER]: "
  read -s API_KEY_VALUE
  echo
  if [ -z "${API_KEY_VALUE}" ]; then
    echo "Nenhum valor inserido. Abortando."
    exit 1
  fi
  # Cria o secret com o valor inserido pelo usuário
  printf "%s" "${API_KEY_VALUE}" | gcloud secrets create ${SECRET_NAME} \
    --replication-policy="automatic" \
    --data-file=-
    --project=${PROJECT_ID} > /dev/null
  echo "-> Secret '${SECRET_NAME}' criado com sucesso."
else
  echo "-> Secret '${SECRET_NAME}' já existe."
fi

# 5. Concede permissões para a conta de serviço do Cloud Build
echo "5. Concedendo permissões do IAM para a conta de serviço do Cloud Build..."
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
BUILD_SERVICE_ACCOUNT="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Permissão para fazer upload de imagens para o Artifact Registry
echo "-> Concedendo permissão 'Artifact Registry Writer'..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
    --role="roles/artifactregistry.writer" \
    --condition=None > /dev/null

# Permissão para fazer deploy no Cloud Run
echo "-> Concedendo permissão 'Cloud Run Admin'..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
    --role="roles/run.admin" \
    --condition=None > /dev/null

# Permissão para que a conta do Cloud Build possa atuar como a conta de serviço do Cloud Run (necessário para o deploy)
echo "-> Concedendo permissão 'Service Account User'..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
    --role="roles/iam.serviceAccountUser" \
    --condition=None > /dev/null

# Permissão para o Cloud Build acessar o Secret Manager
echo "-> Concedendo permissão 'Secret Manager Secret Accessor' para o Secret '${SECRET_NAME}'..."
gcloud secrets add-iam-policy-binding ${SECRET_NAME} \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=${PROJECT_ID} > /dev/null

# 6. Enviando o build para o Cloud Build...
echo "6. Enviando o build para o Cloud Build..."
# Submete o build. O cloudbuild.yaml já está configurado para usar o secret.
gcloud builds submit . --config=cloudbuild.yaml

echo "--- ✅ Configuração e deploy iniciados com sucesso! ---"
echo "Acompanhe o progresso do build no console do Google Cloud."

