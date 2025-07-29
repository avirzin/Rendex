# Docker Setup for Rendex

This document explains how to use Docker with the Rendex project for development and production deployment.

## 🐳 Quick Start

### Development Environment

1. **Start development server:**
   ```bash
   make up-dev
   # or
   docker-compose up -d frontend-dev
   ```

2. **Access the application:**
   - Frontend: http://localhost:3001
   - Hardhat Node: http://localhost:8545 (if enabled)

3. **View logs:**
   ```bash
   make logs-frontend-dev
   # or
   docker-compose logs -f frontend-dev
   ```

### Production Environment

1. **Build and start production:**
   ```bash
   make build
   make up
   # or
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000

## 📁 Docker Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Production-optimized multi-stage build |
| `Dockerfile.dev` | Development environment with hot reloading |
| `docker-compose.yml` | Main orchestration file |
| `docker-compose.override.yml` | Development-specific overrides |
| `docker-compose.prod.yml` | Production-specific configuration |
| `.dockerignore` | Files excluded from Docker build context |
| `Makefile` | Convenient commands for common operations |

## 🛠️ Available Commands

### Using Makefile (Recommended)

```bash
# Show all available commands
make help

# Development
make build-dev      # Build development image
make up-dev         # Start development environment
make up-dev-full    # Start all services (including optional ones)
make logs-frontend-dev  # View development logs
make shell          # Access container shell

# Production
make build          # Build production image
make up             # Start production environment
make deploy-prod    # Deploy using production config

# Maintenance
make down           # Stop all services
make clean          # Remove all containers, images, volumes
make logs           # View all logs

# Testing
make test           # Run tests in Docker
make test-contracts # Run smart contract tests

# Blockchain operations
make deploy-contracts  # Deploy contracts to Sepolia
make verify-contracts  # Verify contracts on Etherscan
```

### Using Docker Compose Directly

```bash
# Development
docker-compose up -d frontend-dev
docker-compose logs -f frontend-dev
docker-compose exec frontend-dev sh

# Production
docker-compose up -d
docker-compose logs -f frontend

# Stop everything
docker-compose down
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Alchemy API Key
ALCHEMY_API_KEY=your_alchemy_key_here

# Database (if using PostgreSQL)
POSTGRES_DB=rendex
POSTGRES_USER=rendex_user
POSTGRES_PASSWORD=your_secure_password

# Redis (if using Redis)
REDIS_PASSWORD=your_redis_password

# Blockchain
PRIVATE_KEY=your_private_key_for_deployment
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Customizing Services

#### Enable Optional Services

Edit `docker-compose.override.yml` to enable additional services:

```yaml
# Uncomment to enable Redis
redis:
  ports:
    - "6379:6379"

# Uncomment to enable PostgreSQL
postgres:
  ports:
    - "5432:5432"

# Uncomment to enable Hardhat node
hardhat-node:
  ports:
    - "8545:8545"
```

#### Production Configuration

For production deployment, use the production-specific configuration:

```bash
# Deploy with production settings
docker-compose -f docker-compose.prod.yml up -d

# Or use the make command
make deploy-prod
```

## 🏗️ Architecture

### Development Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend Dev  │    │   Hardhat Node  │    │     Redis       │
│   (Port 3001)   │    │   (Port 8545)   │    │   (Port 6379)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Docker Network │
                    │  rendex-network │
                    └─────────────────┘
```

### Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Frontend      │    │   PostgreSQL    │
│   (Port 80/443) │    │   (Port 3000)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Docker Network │
                    │  rendex-network │
                    └─────────────────┘
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Stop conflicting services
   docker-compose down
   ```

2. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Build cache issues:**
   ```bash
   # Clean build cache
   docker-compose build --no-cache
   ```

4. **Container won't start:**
   ```bash
   # Check logs
   docker-compose logs frontend-dev
   
   # Check container status
   docker-compose ps
   ```

### Performance Optimization

1. **Enable BuildKit for faster builds:**
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

2. **Use volume mounts for development:**
   - Source code is mounted as a volume for hot reloading
   - `node_modules` and `.next` are excluded from mounts

3. **Resource limits:**
   - Production containers have memory limits configured
   - Adjust in `docker-compose.prod.yml` as needed

## 🚀 Deployment

### Local Production Testing

```bash
# Build and run production locally
make build
make up

# Test production build
curl http://localhost:3000
```

### Cloud Deployment

1. **Build and tag image:**
   ```bash
   docker build -t your-registry/rendex:latest .
   ```

2. **Push to registry:**
   ```bash
   docker push your-registry/rendex:latest
   ```

3. **Deploy to cloud:**
   ```bash
   # Update docker-compose.prod.yml with your registry
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Health Checks

The production configuration includes health checks:

```bash
# Check application health
make health

# Or manually
curl -f http://localhost:3000/api/health
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Hardhat Docker Setup](https://hardhat.org/tutorial/docker)

## 🤝 Contributing

When adding new services or modifying Docker configurations:

1. Update the appropriate `docker-compose*.yml` file
2. Add corresponding commands to the `Makefile`
3. Update this documentation
4. Test both development and production configurations 