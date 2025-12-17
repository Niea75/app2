const root = document.getElementById('root');
const userChip = document.getElementById('userChip');

const ACTIVITIES = [
  {
    type: 'tumbler',
    name: '텀블러 사용',
    icon: '🥤',
    description: '사진 인증 필수, 승인 후 포인트 지급',
    points: 20,
    requiresPhoto: true,
  },
  {
    type: 'commute',
    name: '출퇴근 (자전거/걷기 포함)',
    icon: '🚴‍♀️',
    description: '출근/퇴근, 이동수단 기록',
    points: 15,
  },
  {
    type: 'video_meeting',
    name: '화상회의',
    icon: '💻',
    description: '대면 회의를 대체한 화상회의 세션',
    points: 10,
  },
  {
    type: 'business_trip',
    name: '출장',
    icon: '🛫',
    description: '교통수단과 구간을 기록',
    points: 80,
  },
];

const QUEST_POOL = [
  {
    id: 'team_any_activity',
    title: '전 팀원 활동기록 1회 남기기',
    check: ({ teamStats }) => teamStats.todayActivities >= 1,
  },
  {
    id: 'three_activities',
    title: '활동기록 3개 이상 하기',
    check: ({ userStats }) => userStats.todayActivities >= 3,
  },
  {
    id: 'hundred_points',
    title: '활동기록에서 100 Point 이상 얻기',
    check: ({ userStats }) => userStats.todayApprovedPoints >= 100,
  },
];

const TEAMS = [
  { id: 'bronze_a', name: '솔라 시드', league: 'bronze' },
  { id: 'bronze_b', name: '그린 스파크', league: 'bronze' },
  { id: 'bronze_c', name: '에코 플로우', league: 'bronze' },
  { id: 'silver_a', name: '쿨 어스', league: 'silver' },
  { id: 'silver_b', name: '블루 플래닛', league: 'silver' },
  { id: 'silver_c', name: '카본 커터즈', league: 'silver' },
  { id: 'gold_a', name: '제로 히어로즈', league: 'gold' },
  { id: 'gold_b', name: '바이탈 스카이', league: 'gold' },
  { id: 'gold_c', name: '클린 퓨처', league: 'gold' },
];

const emptyState = () => ({
  user: null,
  consent: null,
  activities: [],
  feed: [],
  quests: { date: null, items: [] },
  comments: {},
  league: 'bronze',
});

let state = loadState();

function loadState() {
  const data = localStorage.getItem('carbon-app-state');
  if (data) {
    try {
      return { ...emptyState(), ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to parse state', e);
    }
  }
  return emptyState();
}

function persist() {
  localStorage.setItem('carbon-app-state', JSON.stringify(state));
}

function formatDate(date) {
  return new Date(date).toLocaleString();
}

function updateStreak(startedAt) {
  if (!state.user) return;
  const activityDate = new Date(startedAt);
  const dayString = activityDate.toISOString().slice(0, 10);
  const lastDay = state.user.lastActivityDate;
  if (!lastDay) {
    state.user.streakDays = 1;
    state.user.lastActivityDate = dayString;
    return;
  }
  const lastDateObj = new Date(lastDay);
  if (activityDate < lastDateObj) return; // ignore backdated entries
  if (dayString === lastDay) return;
  const diffDays = Math.round((activityDate - lastDateObj) / (1000 * 60 * 60 * 24));
  state.user.streakDays = diffDays === 1 ? (state.user.streakDays || 0) + 1 : 1;
  state.user.lastActivityDate = dayString;
}

function hydrateStreakFromHistory() {
  if (!state.user || state.user.lastActivityDate) return;
  const userActivities = state.activities
    .filter((a) => a.userEmail === state.user.email)
    .filter((a) => a.startedAt)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  if (userActivities.length === 0) return;
  const uniqueDays = [...new Set(userActivities.map((a) => new Date(a.startedAt).toISOString().slice(0, 10)))];
  const lastDay = uniqueDays[uniqueDays.length - 1];
  let streak = 1;
  for (let i = uniqueDays.length - 2; i >= 0; i--) {
    const current = new Date(uniqueDays[i]);
    const next = new Date(uniqueDays[i + 1]);
    const diff = Math.round((next - current) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  state.user.streakDays = streak;
  state.user.lastActivityDate = lastDay;
  persist();
}

function isConsentValid() {
  if (!state.consent) return false;
  const expires = new Date(state.consent.expiresAt);
  return expires.getTime() > Date.now();
}

function ensureDailyQuests() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.quests.date === today && state.quests.items.length > 0) return;
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  state.quests = { date: today, items: shuffled.slice(0, 3).map((q) => ({ ...q, status: 'active' })) };
  persist();
}

function computeStats() {
  const today = new Date().toISOString().slice(0, 10);
  const userActivities = state.activities.filter((a) => a.userEmail === state.user?.email);
  const todayActivities = userActivities.filter((a) => a.startedAt?.slice(0, 10) === today);
  const todayApproved = todayActivities.filter((a) => a.status === 'approved');
  const todayApprovedPoints = todayApproved.reduce((sum, a) => sum + (a.points || 0), 0);
  const teamActivities = state.activities.filter((a) => a.teamId === state.user?.teamId);
  const teamToday = teamActivities.filter((a) => a.startedAt?.slice(0, 10) === today);
  const streakDays = state.user?.streakDays || 0;
  return {
    userStats: {
      totalPoints: userActivities.filter((a) => a.status === 'approved').reduce((s, a) => s + (a.points || 0), 0),
      todayActivities: todayActivities.length,
      todayApprovedPoints,
      streakDays,
    },
    teamStats: { todayActivities: teamToday.length },
  };
}

function addFeedItem(item) {
  state.feed.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...item });
  persist();
}

function renderAuth() {
  userChip.innerHTML = '';
  root.innerHTML = `
    <div class="card">
      <h2 class="section-title">시작하기 · 인증 + 동의</h2>
      <p class="status-text">이메일 인증 후 연간 이용동의를 받습니다. 테스트용으로 OTP는 246810 입니다.</p>
      <div class="form-row">
        <label>이메일 <input id="emailInput" class="input" type="email" placeholder="you@example.com" /></label>
        <label>팀 선택
          <select id="teamSelect" class="input">
            ${TEAMS.filter((_, idx) => idx < 3).map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="form-row">
        <label>원타임 코드 (246810)<input id="otpInput" class="input" placeholder="246810" /></label>
      </div>
      <div class="stack">
        <button class="button" id="sendCode">코드 전송(모의)</button>
        <button class="button" id="verify">로그인</button>
      </div>
      <p id="authMessage" class="status-text"></p>
    </div>
  `;

  document.getElementById('sendCode').onclick = () => {
    document.getElementById('authMessage').textContent = '테스트 코드 246810 을 입력하세요.';
  };

  document.getElementById('verify').onclick = () => {
    const email = document.getElementById('emailInput').value.trim();
    const otp = document.getElementById('otpInput').value.trim();
    const teamId = document.getElementById('teamSelect').value;
    if (!email || otp !== '246810') {
      document.getElementById('authMessage').textContent = '이메일과 테스트 코드를 확인하세요.';
      return;
    }
    state.user = { email, name: email.split('@')[0], teamId, streakDays: 0, lastActivityDate: null };
    persist();
    render();
  };
}

function renderConsent() {
  userChip.textContent = state.user?.email || '';
  root.innerHTML = `
    <div class="card">
      <h2 class="section-title">이용 동의</h2>
      <div class="consent-box">
        <p>탄소저감 활동 기록과 포인트 적립을 위해 개인정보 처리 및 활동 데이터 저장에 동의합니다. 동의는 1년간 유효하며 언제든지 갱신할 수 있습니다.</p>
        <label class="stack"><input type="checkbox" id="consentCheck" /> 동의합니다</label>
        <div class="stack">
          <button class="button" id="acceptConsent">동의하고 시작하기</button>
          <button class="button secondary" id="logout">로그아웃</button>
        </div>
        <p class="status-text">다음 만료일은 동의일로부터 365일입니다.</p>
      </div>
    </div>
  `;

  document.getElementById('logout').onclick = () => {
    state = emptyState();
    persist();
    render();
  };

  document.getElementById('acceptConsent').onclick = () => {
    const checked = document.getElementById('consentCheck').checked;
    if (!checked) return alert('동의를 체크해주세요.');
    const acceptedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    state.consent = { acceptedAt, expiresAt, version: 'v1' };
    ensureDailyQuests();
    addFeedItem({ type: 'consent', title: `${state.user.name}님이 이용동의 완료`, description: '서비스 이용을 시작합니다.' });
    persist();
    render();
  };
}

function renderTabs() {
  ensureDailyQuests();
  const tabs = ['활동', '퀘스트', '리더보드(팀)', '리더보드(개인)', '피드', '설정'];
  const activeTab = state.activeTab || tabs[0];
  state.activeTab = activeTab;
  userChip.textContent = `${state.user?.name || ''} · ${state.user?.email || ''}`;
  const tabButtons = tabs.map((tab) => `<button class="tab-button ${tab === activeTab ? 'active' : ''}" data-tab="${tab}">${tab}</button>`).join('');
  root.innerHTML = `<div class="tabs">${tabButtons}</div><div id="tabContent"></div>`;
  document.querySelectorAll('.tab-button').forEach((btn) => {
    btn.onclick = () => {
      state.activeTab = btn.dataset.tab;
      persist();
      render();
    };
  });
  renderActiveTab(activeTab);
}

function renderActiveTab(tab) {
  const container = document.getElementById('tabContent');
  if (tab === '활동') return renderActivities(container);
  if (tab === '퀘스트') return renderQuests(container);
  if (tab === '리더보드(팀)') return renderTeamLeaderboard(container);
  if (tab === '리더보드(개인)') return renderUserLeaderboard(container);
  if (tab === '피드') return renderFeed(container);
  if (tab === '설정') return renderSettings(container);
}

function renderActivities(container) {
  const cards = ACTIVITIES.map((a) => `
    <div class="activity-card" data-type="${a.type}">
      <div class="stack"><span style="font-size:22px">${a.icon}</span><strong>${a.name}</strong></div>
      <p class="small-text">${a.description}</p>
      <span class="badge approved">+${a.points} pts</span>
    </div>
  `).join('');

  const activityLogs = state.activities.filter((a) => a.userEmail === state.user.email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = `
    <div class="card">
      <h3 class="section-title">활동 선택</h3>
      <div class="activity-grid" id="activityGrid">${cards}</div>
    </div>
    <div class="card">
      <h3 class="section-title">내 활동 기록</h3>
      ${activityLogs.length === 0 ? '<p class="status-text">등록된 활동이 없습니다.</p>' : ''}
      <div class="list">
        ${activityLogs.map((log) => renderActivityLog(log)).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.activity-card').forEach((card) => {
    card.onclick = () => openActivityForm(card.dataset.type);
  });
}

function renderActivityLog(log) {
  return `
    <div class="card">
      <div class="stack">
        <span style="font-size:22px">${ACTIVITIES.find((a) => a.type === log.type)?.icon}</span>
        <strong>${ACTIVITIES.find((a) => a.type === log.type)?.name}</strong>
        <span class="badge ${log.status}">${log.status}</span>
        <span class="badge approved">${log.points || 0} pts</span>
      </div>
      <p class="status-text">${log.note || ''}</p>
      <p class="small-text">시작: ${formatDate(log.startedAt)} ${log.endedAt ? `· 종료: ${formatDate(log.endedAt)}` : ''}</p>
      ${log.photoName ? `<p class="small-text">첨부: ${log.photoName}</p>` : ''}
      ${log.status === 'pending' ? `<button class="button success small" data-approve="${log.id}">관리자 승인(모의)</button>` : ''}
    </div>
  `;
}

function openActivityForm(type) {
  const activity = ACTIVITIES.find((a) => a.type === type);
  const modal = document.createElement('div');
  modal.className = 'card';
  modal.style.position = 'fixed';
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.maxWidth = '480px';
  modal.style.width = '90%';
  modal.style.zIndex = '10';
  modal.innerHTML = `
    <h3 class="section-title">${activity.icon} ${activity.name}</h3>
    <div class="form-row">
      <label>메모 <input id="noteInput" class="input" placeholder="간단한 설명" /></label>
      <label>시작 시각 <input id="startInput" class="input" type="datetime-local" /></label>
      <label>종료 시각 <input id="endInput" class="input" type="datetime-local" /></label>
    </div>
    ${activity.requiresPhoto ? '<label>사진 인증 <input id="photoInput" class="input" type="file" accept="image/*" /></label>' : ''}
    ${activity.type === 'commute' ? '<label>이동수단<select id="modeInput" class="input"><option value="bike">자전거</option><option value="walk">걷기</option><option value="public">대중교통</option></select></label>' : ''}
    <div class="stack">
      <button class="button" id="submitActivity">기록하기</button>
      <button class="button secondary" id="closeModal">닫기</button>
    </div>
    <p class="status-text">${activity.description}</p>
  `;
  document.body.appendChild(modal);

  document.getElementById('closeModal').onclick = () => modal.remove();

  document.getElementById('submitActivity').onclick = async () => {
    const note = document.getElementById('noteInput').value;
    const startedAt = document.getElementById('startInput').value || new Date().toISOString();
    const endedAt = document.getElementById('endInput').value;
    const mode = document.getElementById('modeInput')?.value;
    const photoInput = document.getElementById('photoInput');
    if (activity.requiresPhoto && !photoInput?.files?.length) {
      alert('사진 첨부가 필요합니다.');
      return;
    }
    let photoName = '';
    if (photoInput?.files?.[0]) {
      photoName = photoInput.files[0].name;
    }
    const status = activity.requiresPhoto ? 'pending' : 'approved';
    const points = status === 'approved' ? activity.points : 0;
    const entry = {
      id: crypto.randomUUID(),
      userEmail: state.user.email,
      teamId: state.user.teamId,
      type: activity.type,
      note,
      startedAt,
      endedAt,
      mode,
      photoName,
      status,
      points,
      createdAt: new Date().toISOString(),
    };
    state.activities.push(entry);
    updateStreak(startedAt);
    addFeedItem({ type: 'activity_logged', title: `${state.user.name} · ${activity.name}`, description: status === 'pending' ? '승인 대기 중' : `+${points} pts 승인 완료` });
    persist();
    modal.remove();
    evaluateQuests();
    render();
  };
}

function evaluateQuests() {
  const stats = computeStats();
  state.quests.items = state.quests.items.map((q) => {
    if (q.status === 'completed') return q;
    const completed = q.check(stats);
    if (completed) {
      addFeedItem({ type: 'quest_completed', title: `퀘스트 완료: ${q.title}`, description: `${state.user.name}님이 달성했습니다.` });
    }
    return { ...q, status: completed ? 'completed' : 'active' };
  });
  persist();
}

function renderQuests(container) {
  evaluateQuests();
  container.innerHTML = `
    <div class="card">
      <h3 class="section-title">오늘의 퀘스트</h3>
      <p class="status-text">하루 최대 3개, 활동기록을 바탕으로 자동 활성화됩니다.</p>
      <div class="list">
        ${state.quests.items.map((q) => `
          <div class="hero">
            <div class="stack">
              <strong>${q.title}</strong>
              <span class="badge ${q.status === 'completed' ? 'approved' : 'pending'}">${q.status}</span>
            </div>
            <p class="small-text">${q.id === 'team_any_activity' ? '팀원 누구나 1개 기록' : q.id === 'three_activities' ? '개인 3개 기록' : '개인 100점 달성'}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTeamLeaderboard(container) {
  const league = state.league || 'bronze';
  const leagueTeams = TEAMS.filter((t) => t.league === league);
  const basePoints = { bronze: 120, silver: 240, gold: 360 };
  const leaderboard = leagueTeams.map((t, idx) => ({
    ...t,
    weeklyPoints: basePoints[league] - idx * 35 + Math.floor(Math.random() * 25),
  }));
  const userTeamId = state.user.teamId;
  const notice = `리그: ${league.toUpperCase()} · 상위 1팀 승급 / 하위 1팀 강등 / 중간 유지 (주간 리셋 모의)`;
  container.innerHTML = `
    <div class="card">
      <div class="league-switcher">
        ${['bronze', 'silver', 'gold'].map((lg) => `<button class="button secondary ${lg === league ? 'active' : ''}" data-league="${lg}">${lg.toUpperCase()} 리그</button>`).join('')}
      </div>
      <p class="status-text">${notice}</p>
      <table class="table">
        <thead><tr><th>순위</th><th>팀</th><th>포인트</th></tr></thead>
        <tbody>
          ${leaderboard.sort((a, b) => b.weeklyPoints - a.weeklyPoints).map((team, idx) => `
            <tr ${team.id === userTeamId ? 'style="color: var(--accent)"' : ''}>
              <td>${idx + 1}</td>
              <td>${team.name} ${team.id === userTeamId ? '(내 팀)' : ''}</td>
              <td>${team.weeklyPoints}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.querySelectorAll('[data-league]').forEach((btn) => {
    btn.onclick = () => {
      state.league = btn.dataset.league;
      persist();
      render();
    };
  });
}

function renderUserLeaderboard(container) {
  const stats = computeStats();
  const peers = [
    { name: '민지', points: 320 },
    { name: '태훈', points: 280 },
    { name: state.user.name, points: stats.userStats.totalPoints },
    { name: '소연', points: 210 },
    { name: '지훈', points: 160 },
  ].sort((a, b) => b.points - a.points);
  container.innerHTML = `
    <div class="card">
      <h3 class="section-title">개인 리더보드</h3>
      <table class="table">
        <thead><tr><th>순위</th><th>이름</th><th>포인트</th></tr></thead>
        <tbody>
          ${peers.map((p, idx) => `<tr ${p.name === state.user.name ? 'style="color: var(--accent)"' : ''}><td>${idx + 1}</td><td>${p.name}</td><td>${p.points}</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="status-text">연속 활동 ${stats.userStats.streakDays}일 · 금일 승인 포인트 ${stats.userStats.todayApprovedPoints}점</p>
    </div>
  `;
}

function renderFeed(container) {
  container.innerHTML = `
    <div class="card">
      <h3 class="section-title">실시간 피드</h3>
      <div class="list">
        ${state.feed.length === 0 ? '<p class="status-text">아직 올라온 항목이 없습니다.</p>' : ''}
        ${state.feed.map((item) => `
          <div class="feed-item">
            <div class="stack">
              <strong>${item.title}</strong>
              <span class="small-text">${formatDate(item.createdAt)}</span>
            </div>
            <p class="status-text">${item.description || ''}</p>
            ${renderComments(item.id)}
            <div class="comment-box">
              <input class="input" placeholder="댓글 달기" data-comment="${item.id}" />
              <button class="button small" data-send="${item.id}">등록</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.querySelectorAll('[data-send]').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.send;
      const input = document.querySelector(`[data-comment="${id}"]`);
      const body = input.value.trim();
      if (!body) return;
      const comments = state.comments[id] || [];
      comments.push({ user: state.user.name, body, createdAt: new Date().toISOString() });
      state.comments[id] = comments;
      input.value = '';
      persist();
      render();
    };
  });
}

function renderComments(id) {
  const comments = state.comments[id] || [];
  if (comments.length === 0) return '';
  return `
    <div class="small-text">
      ${comments.map((c) => `<div>💬 <strong>${c.user}</strong>: ${c.body} (${formatDate(c.createdAt)})</div>`).join('')}
    </div>
  `;
}

function renderSettings(container) {
  const consentText = state.consent ? `동의일: ${formatDate(state.consent.acceptedAt)} · 만료일: ${formatDate(state.consent.expiresAt)}` : '미동의';
  container.innerHTML = `
    <div class="card">
      <h3 class="section-title">프로필 & 설정</h3>
      <p class="status-text">${state.user.email} · 팀: ${TEAMS.find((t) => t.id === state.user.teamId)?.name || '미정'}</p>
      <p class="status-text">연속 활동 ${state.user.streakDays || 0}일 · 마지막 기록일: ${state.user.lastActivityDate || '없음'}</p>
      <p class="status-text">동의 상태: ${consentText}</p>
      <div class="stack">
        <button class="button" id="renewConsent">동의 갱신</button>
        <button class="button secondary" id="wipeData">로컬 데이터 초기화</button>
      </div>
    </div>
  `;
  document.getElementById('renewConsent').onclick = () => {
    const acceptedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    state.consent = { acceptedAt, expiresAt, version: 'v1' };
    addFeedItem({ type: 'consent', title: `${state.user.name}님이 동의를 갱신`, description: '1년 연장되었습니다.' });
    persist();
    render();
  };
  document.getElementById('wipeData').onclick = () => {
    if (!confirm('로컬에 저장된 테스트 데이터를 모두 삭제할까요?')) return;
    state = emptyState();
    persist();
    render();
  };
}

function handleApprovals() {
  document.querySelectorAll('[data-approve]').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.approve;
      const target = state.activities.find((a) => a.id === id);
      if (!target) return;
      target.status = 'approved';
      target.points = ACTIVITIES.find((a) => a.type === target.type)?.points || 0;
      addFeedItem({ type: 'activity_approved', title: `${state.user.name} · ${ACTIVITIES.find((a) => a.type === target.type)?.name}`, description: `승인 완료 +${target.points} pts` });
      persist();
      evaluateQuests();
      render();
    };
  });
}

function render() {
  if (!state.user) return renderAuth();
  hydrateStreakFromHistory();
  if (!isConsentValid()) return renderConsent();
  renderTabs();
  handleApprovals();
}

render();
