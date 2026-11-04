.PHONY: dev dev-frontend dev-backend

dev:
	$(MAKE) -j2 dev-frontend dev-backend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uv run fastapi dev app/main.py
