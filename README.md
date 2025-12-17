# Carbon Reduction App Blueprint

This repository now includes a lightweight web prototype that demonstrates the requested cross-platform flows (consent, 활동, 퀘스트, 리더보드, 피드, 설정) so you can test interactions in a browser while you build the iOS/Android app.

## Documents
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md): User-facing features, flows, and requirements.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Client/server architecture, data model, and integration patterns.

## Web prototype
The `web/` folder contains a static, dependency-free demo that mirrors the product spec:
- **인증 + 동의**: Email + OTP(모의) 로그인 후 연간 동의 체크. 로컬 스토리지에 사용자/동의 상태 저장.
- **활동 선택**: 텀블러/출퇴근/화상회의/출장 아이콘 카드 → 기록 폼. 텀블러/화상회의는 사진 + 기록 시각 자동 저장(승인 후 포인트). 출퇴근은 08~10시 헬스 데이터 우선, 수동 입력 시 포인트 50%.
- **퀘스트**: 하루 3개 자동 활성화, 활동 데이터를 기반으로 상태 업데이트.
- **리더보드**: 리그(브론즈/실버/골드) 토글과 개인 순위, 팀 강조.
- **피드/댓글**: 활동·승인·동의·퀘스트 완료가 피드에 자동 게시, 댓글 입력 가능.
- **설정**: 연속 활동일/마지막 기록일 확인, 동의 갱신, 로컬 데이터 초기화.

### Run locally
```bash
./serve.sh
```
Open `http://localhost:8000` in your browser (OTP `246810`).

### Quick test flow
1) **로그인/동의**: 이메일 + OTP 입력 → 연간 동의 체크. 새 브라우저에서 테스트하면 로컬 스토리지 초기 상태로 시작됩니다.
2) **활동 기록**: 활동 아이콘 클릭 → 텀블러/화상회의는 사진 필수 + 자동 시각, "승인" 버튼으로 포인트 적립. 출퇴근은 기본 헬스 데이터(09:00~09:30)로 기록되며 수동 입력 시 절반 포인트입니다.
3) **퀘스트 확인**: 설정된 3개의 일일 퀘스트가 자동 활성화됩니다. 활동 기록/포인트가 조건을 충족하면 완료 표시가 업데이트됩니다.
4) **리그/리더보드**: 팀 리그(브론즈/실버/골드) 탭을 전환해 점수 분포를 확인합니다. 개인 탭에서 포인트/연속 활동일을 확인합니다.
5) **피드/댓글**: 활동, 승인, 퀘스트 완료가 피드에 자동 게시됩니다. 카드의 댓글 입력란에서 즉시 피드백을 남길 수 있습니다.
