PM ?= pnpm

##########################################################
# API_URL must match VITE_API_PROXY_TARGET               #
# in .env.development                                    #
##########################################################
API_URL ?= http://localhost:3000

.DEFAULT_GOAL := help
.PHONY: help setup dev check-tools check-api

help: ## List the available commands
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

setup: check-tools ## First install after cloning: dependencies from the lockfile
	$(PM) install --frozen-lockfile
	@echo "Setup done. Start the API (make dev in hevy-personal-dashboard-api), then run: make dev"

dev: check-api ## Run the Vite dev server on http://localhost:5173
	$(PM) run dev

check-tools:
	@for tool in node $(PM); do \
		command -v $$tool >/dev/null 2>&1 || { echo "Missing required tool: $$tool"; exit 1; }; \
	done

check-api:
	@curl -s -o /dev/null --max-time 2 $(API_URL) || echo "Warning: no API on $(API_URL). Start it with make dev in hevy-personal-dashboard-api."
