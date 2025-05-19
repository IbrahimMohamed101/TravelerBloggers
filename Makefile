.PHONY: help start dev dev-with-db test install lint format docker-build docker-up docker-down docker-clean migrate seed clean swagger health kill-port logs restart reset-db

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

start: ## Start the application
	npm start

dev: ## Start the application in development mode
	@echo "Ensure your local database is running on localhost:5432"
	npm run dev

# dev-with-db: ## Start both database and application in development mode
#	docker-compose up -d db
#	sleep 5  # Wait for db to initialize
#	npm run dev

test: ## Run tests
	npm test

install: ## Install dependencies
	npm install

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format

# docker-pull: ## Pull Docker images
#	docker pull bitnami/postgresql:latest
#	docker pull bitnami/prometheus:latest
#	docker pull bitnami/grafana:latest
#	docker pull bitnami/node-exporter:latest

# docker-build: docker-pull ## Build Docker image
#	docker-compose build

# docker-up-db: ## Start database container
#	@echo "Starting database..."
#	docker-compose up -d db
#	@echo "Waiting for database to initialize..."
#	sleep 15

# docker-up-monitoring: ## Start monitoring services
#	@echo "Starting monitoring services..."
#	@echo "Starting Prometheus..."
#	docker-compose up -d prometheus
#	sleep 5
#	@echo "Starting Node Exporter..."
#	docker-compose up -d node-exporter
#	sleep 5
#	@echo "Starting Grafana..."
#	docker-compose up -d grafana
#	sleep 5

# docker-up-backend: ## Start backend service
#	@echo "Starting backend service..."
#	docker-compose up -d backend

# docker-up: docker-up-db docker-up-monitoring docker-up-backend ## Start all Docker containers

# docker-down: ## Stop Docker containers
#	docker-compose down

# docker-clean: ## Remove Docker containers and images
#	docker-compose down -v --rmi all
#	docker system prune -f --volumes
#	docker builder prune -f

migrate: ## Run database migrations
	npm run migrate

seed: ## Seed database
	npm run seed

clean: ## Clean node_modules and logs
	rm -rf node_modules
	rm -rf logs/*.log

swagger: ## Open Swagger UI in browser
	@echo "Open http://localhost:3000/api-docs in your browser"

health: ## Check if server is running
	curl -I http://localhost:3000/status

kill-port: ## Kill any process using port 3000
	@echo "Killing process on port 3000 if exists..."
	-@lsof -ti:3000 | xargs kill -9

# logs: ## Show Docker logs for backend
#	docker-compose logs -f backend

# restart: ## Restart backend and database
#	make docker-down
#	make docker-up

# reset-db: ## Rebuild the database from scratch
#	make docker-down
#	docker volume prune -f
#	make docker-up
#	make migrate
#	make seed
