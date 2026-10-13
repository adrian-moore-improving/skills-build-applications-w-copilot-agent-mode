# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app thin and route-oriented so each page fetches the data it owns, renders accessible headings and status text, and shows loading, empty, and error states without business logic in the component tree. Use a shared API helper for the `/api/*` endpoints to keep the UI consistent across activity, team, leaderboard, and workout screens.
- Logic tier decision: Implement the Express API as small route handlers backed by focused services so validation, normalization, and aggregation live in one place, and convert Mongoose cast or lookup errors into deliberate 4xx responses instead of leaking 500s.
- Data tier decision: Use Mongoose schemas as the source of truth for required fields, defaults, and relationships between `User`, `Team`, `Activity`, and `Workout`, and keep seed data idempotent so repeated runs preserve existing records without duplicating seeded content.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes` in POST requests, reject invalid or missing references with 4xx responses, and store a linked activity with computed `points` and `occurredAt` while leaving the schema strict enough to require a user, team, type, minutes, points, and timestamp.
- Team management approach: Require team names and mascots, default `members` to an empty array, preserve member references as ObjectIds in the model, and return member ids cleanly through the API while keeping team creation behavior simple and explicit.
- Leaderboard approach: Aggregate activities by team, sum `points` for each team, and return rows sorted descending by total points with a 1-based rank so the leaderboard reflects live persisted activity data rather than duplicated UI state.
- Workout suggestions approach: Recommend workouts from the matching user’s recent activity pattern or fitness goal, prefer a suggestion whose `focus` matches that signal, include a human-readable `reason`, and return a deliberate 4xx for unknown email addresses so the API fails clearly instead of silently.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - This validates the Mongoose schema contract. Failures indicate missing required fields, default values, or invalid relationship constraints in the data model.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - This validates the Express behavior contract. Failures indicate missing route logic, wrong HTTP status codes, incorrect validation handling, leaderboard aggregation bugs, or mismatched workout recommendations.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - This validates the presentation contract. Failures indicate missing fetch calls, incorrect route handling, missing loading/empty/error states, or inaccessible UI content.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - This catches TypeScript and compile-time issues in the backend, including route/service integration mistakes or invalid imports that the tests may not reach.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - This catches UI build issues, route errors, and TypeScript problems in the React app before it is shipped.
- Expected implementation order driven by these checks:
  1. Fix data model validation and seed behavior first so the contracts are stable.
  2. Repair API route logic and output shape next so the logic tier meets the contract.
  3. Finish the frontend UI and accessibility requirements last, once the backend contract is reliable.
