# Carbon Reduction App - Product Specification

## Overview
A cross-platform (iOS and Android) mobile app that helps users reduce carbon emissions through trackable activities, quests, and social engagement. Users complete an annual consent flow, log verified activities, and compete on leaderboards while a feed highlights achievements.

## Key Screens and Flows
- **Consent (first launch, renewed annually)**
  - Requires user authentication (email + one-time code or SSO) to bind consent to identity.
  - Stores consent record per user with timestamp and expiry; app auto-skips if still valid.
  - Allows re-consent prompt when expired or revoked.

- **Tabs**
  1. **활동 (Activities)**: Grid of activity icons to start logging.
  2. **퀘스트 (Quests)**: Auto-populated from activity data; up to 3 active daily quests.
  3. **리더보드(팀)**: League-based team rankings (Bronze/Silver/Gold); weekly resets with promotion/relegation.
  4. **리더보드(개인)**: Individual ranking showing points and streaks.
  5. **피드 (Feed)**: Activity and quest completion posts with comments.
  6. **설정 (Settings)**: Profile, consent status, notifications, privacy.

## Authentication & Consent
- **Identity**: Email/OTP or SSO provider to uniquely identify users.
- **Consent storage**: `consent_records` table with `user_id`, `version`, `accepted_at`, `expires_at`, `status`.
- **Auto-login**: Secure token/session refresh pulls consent and profile to bypass repeated prompts.
- **Reminder**: Background check triggers renewal prompt 30 days before expiry.

## Activities (로그 방식)
- Activities shown as icon cards; selection opens detail form.
- **Activities & Evidence**
  1. **텀블러 사용**: Requires photo upload; pending admin review before points.
  2. **출퇴근(자전거/걷기 포함)**: Trip logging (start/end, mode); GPS or health data optional.
  3. **화상회의**: Counts replacing in-person meeting; simple session entry.
  4. **출장**: Trip info (from/to, mode) with receipts or itinerary (optional evidence tier).
- **Verification**
  - Evidence upload (photo, GPS trace, metadata) stored with status: `pending`, `approved`, `rejected`.
  - Admin dashboard approves/rejects; points awarded on approval.
- **Points (suggested defaults)**
  - 텀블러: 20 pts per approved photo.
  - 출퇴근: 15 pts per commute, bonus for active modes.
  - 화상회의: 10 pts per remote meeting replacing travel.
  - 출장: 50–150 pts depending on mode & distance.

## Quests
- Auto-selected daily based on activity data; no manual “도전하기” button.
- Up to 3 quests per day, random selection from pool respecting completion history.
- Initial quest set:
  1. **전 팀원 활동기록 1회 남기기** (team aggregate >=1 log today).
  2. **활동기록 3개 이상 하기** (user logs >=3 approved activities today).
  3. **활동기록에서 100 Point 이상 얻기** (user earns >=100 pts today).
- Quest activation logic runs after consent/auth; completion triggers feed post and rewards.

## Leaderboards
- **Team Leaderboard (리그 구조)**
  - Three leagues: Bronze, Silver, Gold; each holds 3 teams.
  - Weekly reset of points; promotion/relegation rules:
    - Top team in each league moves up (except Gold stays).
    - Bottom team moves down (except Bronze stays).
    - Middle team remains.
  - Tab header chips toggle league view; list shows team points and rank.
- **Individual Leaderboard**
  - Shows user points, weekly streak, and rank. Includes team affiliation badge.

## Feed
- Auto-posts when:
  - A user logs an activity (on submission) and when it’s approved.
  - A quest is completed.
  - Team promotions/demotions at weekly reset.
- Supports comments and reactions; moderation flags for inappropriate content.

## Settings
- Profile edit, notification preferences, consent status with renewal action.
- Data export/delete (privacy compliance) and language/theme toggles.

## Non-functional Requirements
- **Platforms**: React Native (Expo) baseline for shared code; native modules allowed for sensors/camera.
- **Backend**: REST/GraphQL with auth tokens; object storage for photos; scheduled jobs for quest assignment and league resets.
- **Security**: Encrypted at rest for PII, secure upload for evidence, audit log for admin approvals.
- **Analytics**: Event tracking for consent, activity submissions, quest completion, leaderboard views.

## Milestones
1. **MVP**: Consent + auth, activity logging with photo, quest auto-activation, team/individual leaderboards, feed posts, basic settings.
2. **Review Tools**: Admin approval UI, evidence moderation.
3. **Enhancements**: GPS-integrated commute validation, richer feed interactions, badges.
