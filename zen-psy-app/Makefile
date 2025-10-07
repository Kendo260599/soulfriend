.PHONY: dev test lint build db:reset seed clean

# Development
dev:
	npm run dev

# Testing
test:
	npm run test

# Linting
lint:
	npm run lint

# Build
build:
	npm run build

# Database operations
db:reset:
	npx prisma migrate reset --force

seed:
	npx prisma db seed

# Clean
clean:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf .next
	rm -rf dist

# Docker operations
docker:up:
	docker compose up -d

docker:down:
	docker compose down

docker:logs:
	docker compose logs -f

# Full setup
setup: clean
	npm install
	npm run build
	npx prisma migrate dev
	npm run seed
