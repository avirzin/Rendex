# Makefile for Rendex Docker operations

.PHONY: help build build-dev up up-dev down logs clean test deploy-prod

# Default target
help:
	@echo "Available commands:"
	@echo "  build      - Build production Docker image"
	@echo "  build-dev  - Build development Docker image"
	@echo "  up         - Start production services"
	@echo "  up-dev     - Start development services"
	@echo "  down       - Stop all services"
	@echo "  logs       - Show logs for all services"
	@echo "  clean      - Remove all containers, images, and volumes"
	@echo "  test       - Run tests in Docker"
	@echo "  deploy-prod - Deploy to production"

# Build production image
build:
	docker-compose build frontend

# Build development image
build-dev:
	docker-compose build frontend-dev

# Start production services
up:
	docker-compose up -d

# Start development services
up-dev:
	docker-compose up -d frontend-dev

# Start all development services (including optional ones)
up-dev-full:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Show logs
logs:
	docker-compose logs -f

# Show logs for specific service
logs-frontend:
	docker-compose logs -f frontend

logs-frontend-dev:
	docker-compose logs -f frontend-dev

# Clean everything
clean:
	docker-compose down -v --rmi all
	docker system prune -f

# Run tests in Docker
test:
	docker-compose run --rm frontend-dev npm test

# Run contract tests
test-contracts:
	docker-compose run --rm frontend-dev npm run test:contracts

# Deploy to production
deploy-prod:
	docker-compose -f docker-compose.prod.yml up -d

# Build and push to registry (customize registry URL)
push:
	docker build -t rendex:latest .
	docker tag rendex:latest your-registry/rendex:latest
	docker push your-registry/rendex:latest

# Development helpers
install-deps:
	docker-compose run --rm frontend-dev npm install

# Access container shell
shell:
	docker-compose exec frontend-dev sh

# Database operations (if using PostgreSQL)
db-migrate:
	docker-compose run --rm frontend-dev npm run migrate

db-seed:
	docker-compose run --rm frontend-dev npm run seed

# Blockchain operations
deploy-contracts:
	docker-compose run --rm frontend-dev npm run deploy:sepolia

verify-contracts:
	docker-compose run --rm frontend-dev npm run verify:sepolia

# Smart contract development
compile:
	docker-compose run --rm frontend-dev npm run build

test-contracts:
	docker-compose run --rm frontend-dev npm test

test-coverage:
	docker-compose run --rm frontend-dev npm run test:coverage

deploy-local:
	docker-compose run --rm frontend-dev npm run deploy:local

hardhat-node:
	docker-compose run --rm frontend-dev npm run node

lint-contracts:
	docker-compose run --rm frontend-dev npm run lint

clean-contracts:
	docker-compose run --rm frontend-dev npm run clean

# Health check
health:
	curl -f http://localhost:3000/api/health || echo "Health check failed"

# Oracle Service commands
oracle-logs:
	docker-compose logs -f oracle-service

oracle-manual:
	docker-compose exec oracle-service npm run manual

oracle-status:
	docker-compose exec oracle-service node -e "console.log('Oracle service is running')"

# Start oracle service only
up-oracle:
	docker-compose up -d oracle-service

# Stop oracle service only
down-oracle:
	docker-compose stop oracle-service

# Restart oracle service
restart-oracle:
	docker-compose restart oracle-service

# Test oracle service
test-oracle:
	docker-compose run --rm oracle-service npm test 