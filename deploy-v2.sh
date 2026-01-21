#!/bin/bash
# TMS V2 Parallel Deployment Script (Staging/Preview)
# Purpose: Deploy to GCP under new service names to avoid affecting production.

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
REGION="us-central1"
BACKEND_SERVICE="tms-v2-backend"
FRONTEND_SERVICE="tms-v2-frontend"
IMAGE_TAG="v2-latest"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: PROJECT_ID is not set. Please run 'gcloud config set project PROJECT_ID' or set PROJECT_ID env var."
    exit 1
fi

echo "🚀 Starting Parallel Deployment for TMS V2 on PROJECT: $PROJECT_ID..."

# 1. Build and Push Backend
echo "🏗️ Building Backend Image..."
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$IMAGE_TAG -f docker/backend/Dockerfile .
echo "📤 Pushing Backend Image..."
docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$IMAGE_TAG

# 2. Deploy Backend to Cloud Run (to get unique URL)
echo "🚀 Deploying Backend Service: $BACKEND_SERVICE..."
gcloud run deploy $BACKEND_SERVICE \
    --image=gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$IMAGE_TAG \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
    --set-env-vars=NODE_ENV=production,CORS_ORIGIN=* \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=2 \
    --timeout=180

# 3. Get New Backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
echo "✅ New Backend URL: $BACKEND_URL"

# 4. Build and Push Frontend (shipped with new Backend URL)
echo "🏗️ Building Frontend Image..."
docker build --platform linux/amd64 \
    --build-arg VITE_API_BASE_URL=${BACKEND_URL}/api \
    --build-arg VITE_GOOGLE_MAPS_API_KEY=AIzaSyD26kTVaKAlJu3Rc6_bqP9VjLh-HEDmBRs \
    -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$IMAGE_TAG \
    -f docker/frontend/Dockerfile .
echo "📤 Pushing Frontend Image..."
docker push gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$IMAGE_TAG

# 5. Deploy Frontend to Cloud Run
echo "🚀 Deploying Frontend Service: $FRONTEND_SERVICE..."
gcloud run deploy $FRONTEND_SERVICE \
    --image=gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$IMAGE_TAG \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars=VITE_API_BASE_URL=${BACKEND_URL}/api \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=2 \
    --timeout=120

# 6. Final Result
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
echo "------------------------------------------------"
echo "🎉 TMS V2 DEPLOYMENT COMPLETE!"
echo "📍 V2 Frontend Link: $FRONTEND_URL"
echo "📍 V2 Backend Link:  $BACKEND_URL"
echo "------------------------------------------------"
echo "Note: This version is isolated by Service Name. It shares the same database secrets."
