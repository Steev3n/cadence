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

For a shortcut from any directory, add this alias to your shell configuration
(`~/.zshrc` for zsh or `~/.bashrc` for bash), adjusting the path if needed:

```sh
alias cadence='make -C /Users/steve/Desktop/git_projects/cadence dev'
```

Open a new terminal after adding the alias, then run `cadence`.
