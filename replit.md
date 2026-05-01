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

### Task file attachments
- Each task card in the Kanban board ("Bảng công việc") has a paperclip icon button (Paperclip icon, hover turns violet).
- Clicking it opens `TaskAttachmentDialog` (`artifacts/promatch/src/components/task-attachment-dialog.tsx`) — a modal showing task meta (title, status, assignee, description) and a full attachment panel.
- **Backend**: `multer` (memory storage, 20 MB limit) handles uploads via:
  - `GET /api/tasks/:taskId/attachments` — list metadata (buffer excluded)
  - `POST /api/tasks/:taskId/attachments` (multipart `file` field) — upload; responds with `TaskAttachment` metadata
  - `DELETE /api/tasks/:taskId/attachments/:attachmentId` — remove
  - `GET /api/tasks/:taskId/attachments/:attachmentId/download` — serve file (Content-Disposition: attachment)
- Attachments stored in `taskAttachments: Map<taskId, TaskAttachmentFile[]>` in-memory in `store.ts`.
- **Dialog UX**: file list with colored type icons (image→green, PDF→red, spreadsheet→emerald, Word→blue, archive→yellow, generic→grey), file size, uploader name, relative time. Download and delete buttons appear on row hover. Drag-and-drop + click-to-browse upload zone. Multiple files selectable at once.
- Download uses a programmatic anchor click against `/api/tasks/{taskId}/attachments/{id}/download` (via `BASE_URL` prefix).

### Student dashboard layout
- `artifacts/promatch/src/pages/home.tsx` `StudentDashboard` is composed of four rows: gradient banner, four colored stat cards, a two-column main area (latest topics + my projects with report-export panel), and four quick-action cards.
- `ReportExportSection` (inside home.tsx) lets the student export the featured project as PDF (via `jspdf`) or CSV (Blob download). Three checkboxes — "Kèm danh sách công việc", "Kèm lịch sử thảo luận", "Kèm biểu đồ đóng góp" — add `tasks` (`useListTasks`), `recentActivity` (from `useGetProject`), and `contributions` (`useGetContributions`) sections to the export. CSV is UTF-8 BOM + comma-separated with quoted-field escaping; PDF uses helvetica with a manual line wrapper.
- The featured project picks the first project with progress > 0 and not completed, falling back to `projects[0]`.

### Push notifications
- Backend helper `pushNotification(...)` in `artifacts/api-server/src/routes/promatch.ts` prepends a new entry to the in-memory `notifications` array.
- Triggers exposed:
  - `POST /api/teams/invite` (`{ topicTitle, inviterName, message? }`) — emits a `team` notification linking to `/teams`.
  - `PUT /api/projects/:projectId/status` (`{ status, note? }`) — updates the project status, logs a recent-activity entry, and emits a `milestone` notification linking to `/projects/:projectId`.
  - `POST /api/notifications/read-all` — marks all notifications read.
- Frontend polling: `useListNotifications` is called with `refetchInterval: 5000` in both the topbar (`layout.tsx`) and the `NotificationWatcher` so the bell badge and toast stream stay current.
- `artifacts/promatch/src/components/notification-watcher.tsx` snapshots seen IDs on first load, then fires a shadcn toast (with optional "Xem" action navigating to `notification.link`) for every newly-arriving notification. Mounted once in `AppLayout`.
- Demo triggers wired to real backend mutations: "Mời vào nhóm" buttons on `/teams` call `useSendTeamInvitation`; the project header on `/projects/:projectId` includes a status `Select` that calls `useUpdateProjectStatus`.

### AI Chatbot (PROMATCH AI)
- Floating chat widget (`artifacts/promatch/src/components/chatbot-widget.tsx`) shown only for student role; bottom-right toggle button.
- Streaming SSE endpoint `POST /api/chatbot/message` in `artifacts/api-server/src/routes/chatbot.ts` powered by OpenAI (`gpt-5.4`) via Replit AI Integrations (`@workspace/integrations-openai-ai-server`). No API key required.
- System prompt is generated per request from the active user's portfolio (skills, interests, certifications, past projects) plus a featured slice of open topics, so advice is personalized.
- Chat history is client-side only (no DB persistence); reset button clears the conversation.
- Deep-link with `?chat=open` to auto-open the panel.

### User Profile Page
- Route `/profile` shows the current user's info: avatar, name, email, role, bio, and account metadata.
- Name and bio are inline-editable: click the pencil icon → input/textarea appears → edit → click "Lưu".
- Avatar URL is editable via "Đổi ảnh đại diện" button.
- Name and avatarUrl changes call `PATCH /api/session/me` (also syncs the portfolio record).
- Bio changes call `PUT /api/portfolios/:userId`.
- Email, role, and organization are shown read-only.
- A "Hồ sơ cá nhân" link in the top-right user dropdown navigates to `/profile`.

### Toast Notifications
- Both `sonner` (`toast`) and shadcn `useToast` are used across the app.
- `App.tsx` mounts both `<Toaster />` (shadcn, for push notification toasts) and `<SonnerToaster richColors position="top-right" />` (Sonner, for mutation feedback toasts).

## Pages (frontend routes)
- `/` Dashboard (role-aware)
- `/portfolio`, `/portfolio/public/:userId`
- `/profile` (editable user profile: name, bio, avatar)
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
