# PROMATCH

Vietnamese-language platform helping university students discover capstone topics, form complementary teams, manage project workspaces, browse company-sponsored project briefs, and showcase portfolios.

## Roles
- Sinh viên (student)
- Giảng viên (instructor)
- Doanh nghiệp (enterprise)
- Cựu sinh viên (alumni)
- Quản trị viên (admin)

A role switcher in the top bar lets reviewers swap roles via `useSwitchRole`.

## Architecture

Monorepo (pnpm workspaces). All UI text is Vietnamese. No emojis in UI.

### Artifacts
- `artifacts/promatch` — React + Vite frontend (wouter routing, shadcn/ui, Tailwind v4, framer-motion, recharts). 22 pages covering all features.
- `artifacts/api-server` — Express backend serving `/api/*` with seeded in-memory mock data (no DB required for demo).
- `artifacts/mockup-sandbox` — Component preview workspace.

### Shared libraries
- `lib/api-spec/openapi.yaml` — Source of truth API contract (30+ endpoints).
- `lib/api-client-react` — Generated React Query hooks (Orval).
- `lib/api-zod` — Generated Zod schemas. Barrel `src/index.ts` only re-exports `./generated/api` (re-exporting `./generated/types` causes duplicate export errors).

### Backend data store
`artifacts/api-server/src/data/store.ts` seeds skills, users (12 across 5 roles), portfolios (5 students), 20 topics, 5 calls-for-projects, 5 active projects with milestones/members/tasks, contributions, 6 archived projects, notifications, moderation queue. `sessionState.currentUserId` tracks the active demo user.

### Recommendation logic
- **Hybrid Score** for topic recommendations: `0.4·SMS + 0.35·IAS + 0.25·PQS` computed in `/api/topics/recommend`.
- **Skill complementarity** for teammate recommendations in `/api/teams/recommend` (shared + complementary skills, gap analysis vs topic).
- **AI topic generation** quota: 10/month per student tracked in `aiQuotaByUser`.

## Pages (frontend routes)
- `/` Dashboard (role-aware)
- `/portfolio`, `/portfolio/public/:userId`
- `/topics`, `/topics/:topicId`, `/topics/recommended`, `/topics/ai`
- `/trends`
- `/marketplace`, `/marketplace/:callId`, `/marketplace/new`
- `/teams`
- `/projects`, `/projects/:projectId` (Kanban, milestones, contributions, activity)
- `/instructor` (instructor dashboard)
- `/knowledge`, `/knowledge/:archiveId`
- `/notifications`, `/settings`
- `/analytics`, `/admin`, `/admin/users`, `/admin/moderation`

## Conventions
- React Query hook query options always require both `enabled` and `queryKey` together (the generated client needs `queryKey` even when only setting `enabled`).
- Mutation params use exact OpenAPI names: `useResolveModeration` → `{ reportId, data }`, `useMarkNotificationRead` → `{ notificationId }`, `useUpdateTask` → `{ taskId, data }`.
- Role types are inlined as `"student" | "instructor" | ...` in `promatch` (no `@workspace/api-zod` dep on the frontend).
