# Imposter Artist

A real-time multiplayer party game where everyone contributes one stroke to
the same doodle — except one player, the **imposter**, who doesn't know the
word and has to blend in. After a few rounds, everyone votes on who they
think the imposter is.

React + Redux on the client, Go + Gorilla WebSocket on the server.

## Running locally

You'll need:

- Node 18+ and `yarn` (or `npm`)
- Go 1.20+

```bash
# 1. install frontend deps and start the dev server
yarn install
yarn start

# 2. in a separate shell, start the Go backend
cd server
go run main.go
```

The frontend is served at <http://localhost:3000> and talks to the backend
at <ws://localhost:8000/ws>. The dev server auto-detects this; set
`REACT_APP_WS_URL` if you need to point at a different backend.

## Configuration

The server reads a couple of environment variables. See `.env.example`.

| Variable          | Default                                                | Purpose                                                                                |
| ----------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000`          | Comma-separated list of allowed WebSocket origins. Set to `*` to fully open the upgrader. |
| `REACT_APP_WS_URL` | Inferred from `window.location`                        | Override the WebSocket URL the frontend connects to.                                   |

`/healthz` on the backend returns `200 ok` and is handy as a readiness
probe.

## Deploying

Two deployable units:

1. **Frontend** — the output of `yarn build` is a static bundle you can drop
   on any static host (Netlify, Cloudflare Pages, S3 + CloudFront, …).
   At build time, set `REACT_APP_WS_URL` so the bundle knows where the
   backend lives in production.
2. **Backend** — `go build ./server` produces a single binary that listens
   on port `8000` (hardcoded in `server/types/exports.go`). Run it behind
   any reverse proxy that can forward WebSocket upgrades. Remember to set
   `ALLOWED_ORIGINS` to your frontend's domain.

## Game rules

- 2+ players per room. One secret word is picked. One random player becomes
  the imposter; the rest see the word.
- Players take turns drawing on a **shared canvas**. During your turn you
  add as many strokes as you like, then hit **End my turn** to pass the
  pen to the next player.
- After N rounds (configurable), everyone votes for who they think is
  the imposter. Tied votes count as an escape — the artists didn't agree.
- Catching the imposter awards each artist 1 point; a successful sneak
  awards the imposter 2. Scores accumulate across games in the same lobby.

## Repository layout

```
src/                  # React frontend
  components/         # UI
  assets/dist/        # WebSocket client + message router
  utils/storage/      # Redux store, persistence, action helpers
  types/              # Shared TS types
server/               # Go backend
  dist/               # HTTP + WebSocket entrypoints
  game/               # Room state machine, phases, voting, etc.
  types/              # Wire types (mirror of src/types where it counts)
  web/                # Action name constants
  main.go             # Calls dist.AppServer
public/               # CRA static assets
```

## Contributing

Bug reports and PRs welcome. Keep things roughly in the existing coding
style. If you add a backend action, also wire its handler in
`server/dist/handlers.go`, register the action name in
`server/web/socketActions.go`, and add a case to the client router in
`src/assets/dist/contact.ts`.

## License

[GPL-3.0](./LICENSE).
