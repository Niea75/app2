# Architecture & Data Model

## Client (React Native / Expo)
- **Navigation**: Stack (auth/consent) + bottom tabs (활동, 퀘스트, 리더보드 팀/개인, 피드, 설정).
- **State**: React Query or Redux Toolkit for server state; secure storage for auth/refresh tokens and consent status.
- **Media**: Expo ImagePicker/Camera for 텀블러 사진; background upload with retries.
- **Offline**: Queue activity submissions locally and sync when online.

## Authentication & Consent Flow
1. Launch → check secure storage for tokens and consent expiry.
2. If missing/expired → show consent screen; user signs in (email OTP/SSO) and accepts latest terms.
3. Store consent record (`accepted_at`, `expires_at = accepted_at + 365d`, `version`), then continue to tabs.
4. Refresh token silently on app start; re-prompt consent 30 days before expiry.

## Activity Logging
- **Activity Catalog** (static JSON/remote config) drives icon grid.
- **Submission payload**
  ```json
  {
    "activity_type": "tumbler|commute|video_meeting|business_trip",
    "metadata": {"mode": "bike|walk|public", "distance_km": 3.2, "notes": ""},
    "evidence": [{"type": "photo", "uri": "..."}],
    "started_at": "ISO8601",
    "ended_at": "ISO8601"
  }
  ```
- **Verification pipeline**
  - Client uploads evidence to object storage via signed URL.
  - Server stores submission with status `pending` → `approved`/`rejected` via admin action.
  - Points awarded only when status = `approved`.

## Quests Service
- Daily job selects up to 3 quests per user after consent validation.
- Uses latest activity rollups to auto-complete quests when thresholds met.
- Emits events (`quest_completed`) to the feed service and points ledger.

## Leaderboard Engine
- **Team leagues**: 3 leagues × 3 teams each. Weekly cron:
  - Reset team points (carry-over rank data for promotion/relegation).
  - Move top team up, bottom team down, middle stays; enforce bounds (Bronze floor, Gold ceiling).
- **Individual leaderboard**: Weekly windowed totals with streak computation.
- **Caching**: Redis/ElastiCache for fast leaderboard reads, invalidated on score changes.

## Feed
- Event-driven (e.g., via message queue). Sources:
  - `activity_logged`, `activity_approved`, `quest_completed`, `league_change`.
- Stores feed items with actor, team, timestamps, and optional media previews.
- Comment threads with soft-delete, abuse flagging, and rate limiting.

## Data Model (schema sketch)
- `users(id, email, team_id, display_name, streak_days, points_total, created_at)`
- `consent_records(id, user_id, version, accepted_at, expires_at, status)`
- `activities(id, user_id, type, status, points, metadata_json, started_at, ended_at, evidence_url, created_at, reviewed_by)`
- `quests(id, user_id, quest_type, status, points_reward, activated_for, completed_at)`
- `teams(id, name, league, weekly_points, last_week_league)`
- `feed_items(id, actor_user_id, team_id, type, payload_json, created_at)`
- `comments(id, feed_item_id, user_id, body, created_at, status)`
- `points_ledger(id, user_id, source_type, source_id, delta, created_at)`

## APIs (example endpoints)
- `POST /auth/otp` → send OTP; `POST /auth/verify` → exchange for token.
- `GET /consent` / `POST /consent` → fetch/record consent.
- `GET /activities` / `POST /activities` / `POST /activities/{id}/evidence` / `POST /activities/{id}/approve` (admin).
- `GET /quests` → active quests; `POST /quests/check` (server-driven completion evaluation).
- `GET /leaderboard/teams?league=bronze|silver|gold` and `GET /leaderboard/users`.
- `GET /feed` / `POST /feed/{id}/comments`.

## Background Jobs
- Daily: assign quests, nudge consent renewals, recompute streaks.
- Weekly: reset leagues, promote/relegate teams, push feed updates.
- Async workers: evidence virus scan, image resizing, activity approval notifications.

## Metrics & Alerts
- Consent drop-off, submission approval times, quest completion rates, and feed spam flags.
