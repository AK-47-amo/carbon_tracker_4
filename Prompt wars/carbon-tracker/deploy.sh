#!/usr/bin/env bash
# Carbon Tracker — GCS Static Website Deploy Script
# Run this after `gcloud auth login` and `gcloud config set project YOUR_PROJECT_ID`

set -e

BUCKET_NAME="carbon-tracker-$(gcloud config get-value project 2>/dev/null | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')"
PROJECT=$(gcloud config get-value project 2>/dev/null)

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Carbon Tracker — GCS Static Website Deployer      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Project:  $PROJECT"
echo "  Bucket:   gs://$BUCKET_NAME"
echo ""

# 1. Create bucket (ignore if already exists)
echo "▶ Creating bucket..."
gcloud storage buckets create "gs://$BUCKET_NAME" \
  --location=US \
  --uniform-bucket-level-access 2>/dev/null || echo "  (bucket already exists)"

# 2. Make bucket publicly readable
echo "▶ Setting public access..."
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" \
  --member=allUsers \
  --role=roles/storage.objectViewer

# 3. Upload all static files
echo "▶ Uploading files..."
gcloud storage cp index.html "gs://$BUCKET_NAME/"
gcloud storage cp -r css/ "gs://$BUCKET_NAME/css/"
gcloud storage cp -r js/  "gs://$BUCKET_NAME/js/"

# 4. Set website config
echo "▶ Configuring static website..."
gcloud storage buckets update "gs://$BUCKET_NAME" \
  --web-main-page-suffix=index.html \
  --web-error-page=index.html

# 5. Print the URL
echo ""
echo "✅ Deploy complete!"
echo ""
echo "  🌐 Website URL:"
echo "     https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo ""
