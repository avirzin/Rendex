#!/bin/bash

# Rendex Oracle Lambda Deployment Script
set -e

echo "🚀 Deploying Rendex Oracle to AWS Lambda..."

# Check if required environment variables are set
if [ -z "$RPC_URL" ]; then
    echo "❌ Error: RPC_URL environment variable is not set"
    echo "Please set it to your Ethereum RPC endpoint (e.g., Infura)"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    echo "Please set it to your oracle wallet private key"
    exit 1
fi

if [ -z "$CDI_ORACLE_ADDRESS" ]; then
    echo "❌ Error: CDI_ORACLE_ADDRESS environment variable is not set"
    echo "Please set it to your deployed CDIOracle contract address"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed"
    echo "Please install AWS CLI first: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to AWS Lambda
echo "🚀 Deploying to AWS Lambda..."
serverless deploy --stage prod --verbose

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test the function: aws lambda invoke --function-name rendex-oracle-update-cdi-prod --payload '{}' response.json"
echo "2. Check CloudWatch logs for execution details"
echo "3. Monitor the scheduled execution (daily at midnight UTC)"
echo "4. Set up CloudWatch alarms for error monitoring"
echo ""
echo "🔗 API Gateway URL: Check the deployment output above"
echo "📊 CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home"
echo "⚡ Lambda Console: https://console.aws.amazon.com/lambda/home"


