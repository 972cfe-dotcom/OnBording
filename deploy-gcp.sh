#!/bin/bash

# Google Cloud Platform Deployment Script for HR Management System
# This script sets up the complete infrastructure on GCP

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="hr-management-system"
DB_INSTANCE_NAME="hr-postgres"
DB_NAME="hr_system"
DB_USER="hr_admin"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_error "No project set. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
fi

print_status "Using project: $PROJECT_ID"

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sql-component.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    --project=$PROJECT_ID

print_success "APIs enabled successfully"

# Create Cloud SQL instance
print_status "Creating Cloud SQL PostgreSQL instance..."
if ! gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID &>/dev/null; then
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_14 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --project=$PROJECT_ID
    
    print_success "Cloud SQL instance created: $DB_INSTANCE_NAME"
else
    print_warning "Cloud SQL instance $DB_INSTANCE_NAME already exists"
fi

# Create database
print_status "Creating database and user..."
if ! gcloud sql databases describe $DB_NAME --instance=$DB_INSTANCE_NAME --project=$PROJECT_ID &>/dev/null; then
    gcloud sql databases create $DB_NAME \
        --instance=$DB_INSTANCE_NAME \
        --project=$PROJECT_ID
    print_success "Database created: $DB_NAME"
fi

# Generate secure password for database user
DB_PASSWORD=$(openssl rand -base64 32)

# Create database user
if ! gcloud sql users describe $DB_USER --instance=$DB_INSTANCE_NAME --project=$PROJECT_ID &>/dev/null; then
    gcloud sql users create $DB_USER \
        --instance=$DB_INSTANCE_NAME \
        --password=$DB_PASSWORD \
        --project=$PROJECT_ID
    print_success "Database user created: $DB_USER"
fi

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID --format="value(connectionName)")

# Create JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Store secrets in Secret Manager
print_status "Storing secrets in Secret Manager..."

# Database URL
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"
echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=- --project=$PROJECT_ID || \
echo -n "$DATABASE_URL" | gcloud secrets versions add database-url --data-file=- --project=$PROJECT_ID

# JWT Secret
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- --project=$PROJECT_ID || \
echo -n "$JWT_SECRET" | gcloud secrets versions add jwt-secret --data-file=- --project=$PROJECT_ID

print_success "Secrets stored in Secret Manager"

# Grant Cloud Run access to secrets
print_status "Setting up IAM permissions..."
SERVICE_ACCOUNT="$PROJECT_ID@appspot.gserviceaccount.com"
gcloud secrets add-iam-policy-binding database-url \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding jwt-secret \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID

# Build and deploy
print_status "Building and deploying to Cloud Run..."
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --project=$PROJECT_ID

# Deploy to Cloud Run with secrets
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars NODE_ENV=production \
    --set-secrets DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest \
    --set-cloudsql-instances $CONNECTION_NAME \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300 \
    --project=$PROJECT_ID

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)")

print_success "Deployment completed successfully!"
echo ""
echo "==================================================="
echo "📊 HR Management System Deployment Summary"
echo "==================================================="
echo "🌐 Service URL: $SERVICE_URL"
echo "🗄️  Database Instance: $DB_INSTANCE_NAME"
echo "📊 Database Name: $DB_NAME"
echo "👤 Database User: $DB_USER"
echo "🔐 Secrets stored in Secret Manager"
echo "==================================================="
echo ""
echo "Next steps:"
echo "1. Access your application at: $SERVICE_URL"
echo "2. Set up your database schema by running the setup script"
echo "3. Test the registration functionality"
echo ""
print_success "Your HR Management System is ready to use!"

# Save deployment info
cat > deployment-info.txt << EOF
HR Management System - Google Cloud Deployment
============================================

Service URL: $SERVICE_URL
Project ID: $PROJECT_ID
Region: $REGION
Database Instance: $DB_INSTANCE_NAME
Database Name: $DB_NAME
Connection Name: $CONNECTION_NAME

Deployed on: $(date)
EOF

print_status "Deployment information saved to deployment-info.txt"