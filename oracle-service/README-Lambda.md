# Rendex Oracle - AWS Lambda Deployment

This is the AWS Lambda version of the Rendex CDI Oracle service. It provides a serverless, cost-effective solution for updating CDI rates on the blockchain.

## 🚀 Benefits of Lambda over EC2

- **Cost-effective**: Pay only when the function runs (~$0.20/month for daily updates)
- **Serverless**: No server management required
- **Automatic scaling**: Handles traffic spikes automatically
- **Built-in scheduling**: Uses EventBridge for cron-like scheduling
- **Better reliability**: AWS manages the infrastructure
- **Easier deployment**: Simple deployment and updates

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js 22+** installed locally
4. **Deployed CDIOracle contract** on the blockchain
5. **Oracle wallet private key**
6. **Ethereum RPC endpoint** (Infura, Alchemy, etc.)

## 🔧 Setup

### 1. Install Dependencies

```bash
# Install Serverless Framework globally
npm install -g serverless

# Install project dependencies
npm install
```

### 2. Configure Environment Variables

```bash
# Set required environment variables
export RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
export PRIVATE_KEY="your_private_key_here"
export CDI_ORACLE_ADDRESS="0x...your_deployed_contract_address"

# Or create a .env file
cp env.example .env
# Edit .env with your values
```

### 3. Deploy to AWS Lambda

```bash
# Make deployment script executable
chmod +x deploy-lambda.sh

# Deploy
./deploy-lambda.sh
```

## 🏗️ Architecture

```
EventBridge (CloudWatch Events)
    ↓ (Daily at midnight UTC)
AWS Lambda Function
    ↓
Fetch CDI from BCB API
    ↓
Apply 120% multiplier
    ↓
Update smart contract
    ↓
Return result
```

## 📊 Configuration

### Lambda Settings

- **Runtime**: Node.js 22.x
- **Memory**: 512 MB
- **Timeout**: 300 seconds (5 minutes)
- **Schedule**: Daily at midnight UTC (configurable)

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RPC_URL` | Ethereum RPC endpoint | `https://sepolia.infura.io/v3/...` |
| `PRIVATE_KEY` | Oracle wallet private key | `0x1234...` |
| `CDI_ORACLE_ADDRESS` | Deployed contract address | `0xabcd...` |

## 🚀 Deployment Options

### Option 1: Serverless Framework (Recommended)

```bash
# Deploy to production
serverless deploy --stage prod

# Deploy to development
serverless deploy --stage dev

# Remove deployment
serverless remove --stage prod
```

### Option 2: Manual AWS CLI

```bash
# Create deployment package
npm run package

# Create Lambda function
aws lambda create-function \
  --function-name rendex-oracle-update-cdi \
  --runtime nodejs22.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda-oracle.handler \
  --zip-file fileb://lambda-oracle.zip \
  --timeout 300 \
  --memory-size 512

# Set environment variables
aws lambda update-function-configuration \
  --function-name rendex-oracle-update-cdi \
  --environment Variables='{RPC_URL="YOUR_RPC_URL",PRIVATE_KEY="YOUR_PRIVATE_KEY",CDI_ORACLE_ADDRESS="YOUR_CONTRACT_ADDRESS"}'
```

## 📅 Scheduling

The function is automatically scheduled to run daily at midnight UTC using EventBridge (CloudWatch Events).

### Custom Schedule

To change the schedule, modify the `serverless.yml` file:

```yaml
events:
  - schedule:
      rate: cron(0 12 * * ? *)  # Daily at noon UTC
      # or
      rate: rate(1 hour)         # Every hour
      # or
      rate: rate(5 minutes)      # Every 5 minutes
```

## 🧪 Testing

### Local Testing

```bash
# Test locally
npm test

# Test with Serverless offline
serverless offline
```

### AWS Testing

```bash
# Invoke function manually
aws lambda invoke \
  --function-name rendex-oracle-update-cdi-prod \
  --payload '{}' \
  response.json

# Check logs
aws logs tail /aws/lambda/rendex-oracle-update-cdi-prod --follow
```

## 📊 Monitoring

### CloudWatch Logs

- **Log Group**: `/aws/lambda/rendex-oracle-update-cdi-prod`
- **Retention**: 14 days (configurable)
- **Metrics**: Duration, errors, invocations

### CloudWatch Alarms

Set up alarms for:
- Function errors
- Duration exceeding threshold
- Failed invocations

### Example Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "Oracle-Errors" \
  --alarm-description "Oracle function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=rendex-oracle-update-cdi-prod
```

## 🔒 Security

### IAM Roles

The function uses a minimal IAM role with only necessary permissions:
- CloudWatch Logs access
- Lambda execution permissions

### Environment Variables

- **Private keys** are encrypted at rest
- **No sensitive data** in code
- **Environment-specific** configurations

## 💰 Cost Estimation

### Monthly Costs (US East)

- **Lambda executions**: ~$0.20 (30 daily executions × $0.00000667)
- **CloudWatch Logs**: ~$0.50 (30 MB of logs)
- **EventBridge**: ~$0.00 (first 100 events free)
- **Total**: ~$0.70/month

### Cost Optimization

- Use provisioned concurrency for consistent performance
- Optimize memory allocation
- Set appropriate log retention periods

## 🚨 Troubleshooting

### Common Issues

1. **Timeout errors**: Increase timeout or optimize code
2. **Memory errors**: Increase memory allocation
3. **Permission errors**: Check IAM roles and policies
4. **Network errors**: Verify RPC endpoint and VPC settings

### Debug Commands

```bash
# Check function configuration
aws lambda get-function --function-name rendex-oracle-update-cdi-prod

# Check recent logs
aws logs describe-log-streams \
  --log-group-name /aws/lambda/rendex-oracle-update-cdi-prod \
  --order-by LastEventTime \
  --descending \
  --max-items 5

# Test function with payload
aws lambda invoke \
  --function-name rendex-oracle-update-cdi-prod \
  --payload '{"test": true}' \
  response.json
```

## 🔄 Updates and Maintenance

### Updating the Function

```bash
# Deploy updates
serverless deploy --stage prod

# Or update specific function
serverless deploy function --function updateCDI --stage prod
```

### Rollback

```bash
# Rollback to previous version
serverless rollback --stage prod
```

## 📚 Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Serverless Framework Documentation](https://www.serverless.com/)
- [CloudWatch Events Documentation](https://docs.aws.amazon.com/eventbridge/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 🤝 Support

For issues or questions:
1. Check CloudWatch logs
2. Review this documentation
3. Check AWS Lambda console
4. Contact the development team
