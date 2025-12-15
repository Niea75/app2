# Carbon Reduction App Blueprint

This repository now includes a lightweight web prototype that demonstrates the requested cross-platform flows (consent, 활동, 퀘스트, 리더보드, 피드, 설정) so you can test interactions in a browser while you build the iOS/Android app.

## Documents
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md): User-facing features, flows, and requirements.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Client/server architecture, data model, and integration patterns.

## Web prototype
The `web/` folder contains a static, dependency-free demo that mirrors the product spec:
- **인증 + 동의**: Email + OTP(모의) 로그인 후 연간 동의 체크. 로컬 스토리지에 사용자/동의 상태 저장.
- **활동 선택**: 텀블러/출퇴근/화상회의/출장 아이콘 카드 → 기록 폼. 텀블러는 사진 첨부 필수, 승인 버튼(모의)으로 포인트 지급.
- **퀘스트**: 하루 3개 자동 활성화, 활동 데이터를 기반으로 상태 업데이트.
- **리더보드**: 리그(브론즈/실버/골드) 토글과 개인 순위, 팀 강조.
- **피드/댓글**: 활동·승인·동의·퀘스트 완료가 피드에 자동 게시, 댓글 입력 가능.
- **설정**: 연속 활동일/마지막 기록일 확인, 동의 갱신, 로컬 데이터 초기화.

### Run locally
```bash
cd web
python -m http.server 8000
```
Open `http://localhost:8000` in your browser. Use OTP `246810` for test login.
