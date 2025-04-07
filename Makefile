.PHONY: help start dev dev-with-db test install lint format docker-build docker-up docker-down docker-clean migrate seed clean swagger health kill-port logs restart reset-db

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

start: ## Start the application
	npm start

dev: ## Start the application in development mode (requires docker-up first)
	@echo "Ensure database is running (run 'make docker-up' first)"
	npm run dev

dev-with-db: ## Start both database and application in development mode
	docker-compose up -d db
	sleep 5  # Wait for db to initialize
	npm run dev

test: ## Run tests
	npm test

install: ## Install dependencies
	npm install

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format

docker-build: ## Build Docker image
	docker-compose build

docker-up: ## Start Docker containers (including database)
	docker-compose up -d db
	sleep 5  # Wait for db to initialize
	docker-compose up -d --no-recreate

docker-down: ## Stop Docker containers
	docker-compose down

docker-clean: ## Remove Docker containers and images
	docker-compose down -v --rmi all

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

logs: ## Show Docker logs for backend
	docker-compose logs -f backend

restart: ## Restart backend and database
	make docker-down
	make docker-up

reset-db: ## Rebuild the database from scratch
	make docker-down
	docker volume prune -f
	make docker-up
	make migrate
	make seed
