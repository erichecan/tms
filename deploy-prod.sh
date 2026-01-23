#!/bin/bash
# TMS Production Deployment Script
# Purpose: Deploy fully tested refinements to the main production environment.

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
REGION="us-central1"
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"
IMAGE_TAG="latest"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: PROJECT_ID is not set. Please run 'gcloud config set project PROJECT_ID' or set PROJECT_ID env var."
    exit 1
fi

echo "🚀 Starting PRODUCTION Deployment for TMS on PROJECT: $PROJECT_ID..."

# 1. Build and Push Backend
echo "🏗️ Building Backend Image..."
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$IMAGE_TAG -f docker/backend/Dockerfile .
echo "📤 Pushing Backend Image..."
docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$IMAGE_TAG

# 2. Deploy Backend to Cloud Run
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

# 3. Get Backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
echo "✅ Backend URL: $BACKEND_URL"

# 4. Build and Push Frontend (shipped with Backend URL)
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
echo "🎉 TMS PRODUCTION DEPLOYMENT COMPLETE!"
echo "📍 Production Frontend: $FRONTEND_URL"
echo "📍 Production Backend:  $BACKEND_URL"
echo "------------------------------------------------"
