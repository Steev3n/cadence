# cadence

Run both development servers from the project root:

```sh
make dev
```

The frontend runs at http://localhost:3000 and the backend at
http://localhost:8000 (API docs: http://localhost:8000/docs).
Press Ctrl+C to stop both servers.

Requires Node.js/npm, uv, and make. Before the first run, install the frontend
dependencies with `cd frontend && npm install`. uv installs backend dependencies
automatically.

To run just one server, use `make dev-frontend` or `make dev-backend`.