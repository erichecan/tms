#!/bin/bash
set -e

# ==========================================
# TMS PRODUCTION DEPLOYMENT SCRIPT
# ==========================================

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"
IMAGE_TAG="latest"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting TMS Production Deployment...${NC}"
echo "Project: $PROJECT_ID"
echo "Region:  $REGION"

# ------------------------------------------
# 1. Backend Build & Deploy
# ------------------------------------------
echo -e "\n${BLUE}👉 [1/4] Building Backend (Clean Build)...${NC}"
docker build --no-cache --platform linux/amd64 \
  -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$IMAGE_TAG \
  -f docker/backend/Dockerfile .

echo -e "${BLUE}👉 [2/4] Pushing Backend Image...${NC}"
docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$IMAGE_TAG

echo -e "${BLUE}👉 [3/4] Deploying Backend to Cloud Run...${NC}"
gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$IMAGE_TAG \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest" \
  --set-env-vars="NODE_ENV=production,CORS_ORIGIN=*" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=180

# Get Backend URL for Frontend Build
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format="value(status.url)")
echo -e "${GREEN}✅ Backend Deployed: $BACKEND_URL${NC}"

# ------------------------------------------
# 2. Frontend Build & Deploy
# ------------------------------------------
echo -e "\n${BLUE}👉 [4/4] Building Frontend (Linked to Backend)...${NC}"
# Note: Google Maps Key should ideally be a secret, but for build args in Vite it needs to be explicit or mapped.
# We use the known key here for the build.
docker build --no-cache --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=$BACKEND_URL/api \
  --build-arg VITE_GOOGLE_MAPS_API_KEY=AIzaSyD26kTVaKAlJu3Rc6_bqP9VjLh-HEDmBRs \
  -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$IMAGE_TAG \
  -f docker/frontend/Dockerfile .

echo -e "${BLUE}👉 Pushing Frontend Image...${NC}"
docker push gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$IMAGE_TAG

echo -e "${BLUE}👉 Deploying Frontend to Cloud Run...${NC}"
gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$IMAGE_TAG \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="VITE_API_BASE_URL=$BACKEND_URL/api" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=120

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format="value(status.url)")

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "Backend:  ${GREEN}$BACKEND_URL${NC}"
echo -e "${GREEN}=========================================${NC}"
