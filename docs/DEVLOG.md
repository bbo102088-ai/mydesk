# MyDesk 개발 로그 (DEVLOG)

**프로젝트**: MyDesk — EMR 기획자를 위한 AI-Native 올인원 업무 대시보드
**기간**: 2026-03-10 ~ 2026-03-13
**스택**: Next.js 14, TypeScript, Tailwind CSS v4, Zustand, Groq API

---

## Day 1 — 2026-03-10: 프로젝트 기초 설정

### 한 일
- Next.js 14 App Router 프로젝트 초기화
- TypeScript strict 모드 설정 (`tsconfig.json`)
- Tailwind CSS v4 + shadcn/ui 설치 및 설정
- 기본 폴더 구조 설계 (`components/`, `hooks/`, `store/`, `types/`, `lib/`)
- Zustand 스토어 기초 설계 (`dashboardStore.ts`)
- `useLocalStorage<T>` 커스텀 훅 작성
- 타입 정의 (`FigmaFile`, `TaskItem`, `CommItem`, `AiMessage` 등)

### 결정 사항
- **상태 관리**: Widget 상태는 Zustand + persist 미들웨어로 localStorage 영속화
- **레이아웃**: 2/3 + 1/3 그리드, 좌측 메인 작업 영역 / 우측 보조 도구
- **API 키 보안**: 모든 AI API 호출은 Next.js API Route를 통해 서버사이드에서만 처리

### 고민 & 해결
- shadcn/ui 컴포넌트를 그대로 쓰면 디자인이 너무 일반적
  → Card, Button 컴포넌트를 글래스모피즘 스타일로 커스터마이징

---

## Day 2 — 2026-03-11: 핵심 위젯 구현

### 한 일

#### 뽀모도로 타이머 (`PomodoroTimer.tsx`)
- 25분 집중 / 5분 휴식 사이클
- `useInterval` 훅으로 1초 카운트다운
- 오늘 완료 세션 도트 표시 (최대 4개 시각화)
- 자동 모드 전환 (집중 → 휴식 → 집중)

#### 데일리 노트 (`DailyNote.tsx`)
- 오늘 날짜 기반 localStorage 자동 키 생성 (`mydesk:daily-note:YYYY-MM-DD`)
- 체크리스트 항목 추가/완료/삭제
- 완료 항목 자동 하단 정렬
- 자유 메모 영역 (textarea)

#### 업무 시트 (`WorkSheet.tsx`)
- Task / Status / Due / Priority 컬럼 테이블
- 상태 클릭 사이클: `대기 → 진행중 → 완료 → 보류`
- 우선순위 색상 뱃지: 높음(빨강), 보통(노랑), 낮음(회색)
- 행 추가 / 삭제 (localStorage 영속)

### 트러블슈팅
- `[color-scheme:dark]` Tailwind 적용 없이는 날짜/select 입력 필드가 흰 배경으로 나타남
  → 각 input에 `[color-scheme:dark]` 클래스 추가로 해결

---

## Day 2 후반 — 피그마 퀵런처 & AI 어시스턴트

### 피그마 퀵런처 (`FigmaLauncher.tsx`)
- 파일 추가 모달: 파일명, Figma URL, 카드 색상(5가지 그라디언트) 선택
- URL 유효성 검사: `https://www.figma.com/` 패턴 검사
- 카드 hover 시 ExternalLink 아이콘 오버레이
- X 버튼(hover) + 우클릭 컨텍스트 메뉴로 삭제
- `timeAgo()` 함수로 "30분 전", "3시간 전" 표시
- 최대 8개 제한, localStorage 영속

### AI 어시스턴트 (`AiAssistant.tsx`)
- Groq / ChatGPT / Gemini 탭 구조
- Groq 탭: `/api/ai/chat` API Route 통해 실시간 대화
- ChatGPT / Gemini 탭: "준비 중" 표시 (향후 연동 예정)
- 대화 히스토리 자동 스크롤

### Groq API Route (`/api/ai/chat/route.ts`)
- `llama-3.3-70b-versatile` 모델 사용
- API 키 서버사이드 전용 (`process.env.GROQ_API_KEY`)
- 에러 타입별 분기 처리 (API 키 없음 / 네트워크 오류 / 파싱 오류)

---

## Day 3 — 2026-03-12: SSL 오류 디버깅 & 추가 기능 구현

### Groq API "fetch failed" 에러 해결

**증상**: `AiAssistant`에서 Groq API 호출 시 "Groq 서버 연결 실패: fetch failed" 반복

**원인 추적 과정**:
1. API 키 형식 오류 → 키 값 확인 (올바름)
2. 네트워크 요청 로그 확인 → `cause: Error: write EPROTO` 발견
3. `curl -v https://api.groq.com` 테스트 → Schannel CRL check 실패 로그 확인
4. 에러 코드: `CRYPT_E_NO_REVOCATION_CHECK 0x80092012`

**원인**: 회사 보안 네트워크에서 Windows Schannel이 Groq의 인증서 CRL(인증서 폐기 목록) 서버에 접근 불가

**해결책**: `.env.local`에 `NODE_TLS_REJECT_UNAUTHORIZED=0` 추가
```
NODE_TLS_REJECT_UNAUTHORIZED=0
```

> 주의: 프로덕션 환경에서는 이 설정을 제거해야 함. MVP 개발 환경 전용.

---

### 추가 기능 구현

#### AI 조언 배너 (`AiBanner.tsx`)
- 글래스모피즘 스타일 가로 배너
- AI 조언 탭: 업무 컨텍스트 기반 팁 7가지 중 랜덤 로테이션 + 새로고침
- 오늘의 운세 탭:
  - Groq API로 EMR 기획자 맞춤 운세 생성 (2~3줄)
  - `mydesk:fortune:YYYY-MM-DD` 키로 하루 1회 localStorage 캐싱
  - API 실패 시 fallback 운세 5가지 중 랜덤 표시
- 탭별 Ambient glow 색상 전환 (인디고 ↔ 퍼플)

#### 퀵 앱 바 개선 (`QuickAppsBar.tsx`)
- 데스크탑 앱 프로토콜 우선 실행 (`msteams://`, `figma://`, `ms-excel://`, `ms-outlook://`)
- `visibilitychange` 이벤트로 앱 실행 감지
- 1.5초 타임아웃 후 앱 미실행 시 웹 URL로 자동 fallback
- Teams 미읽음 뱃지 2개, Mail 뱃지 5개 (목업 데이터)

---

## Day 4 — 2026-03-13: 마무리 기능 & 디자인 폴리싱

### 추가 위젯

#### 뉴스 피드 (`NewsFeed.tsx` + `/api/news/route.ts`)
- Google News RSS 서버사이드 파싱 (외부 의존성 없음)
- 키워드 기반 카테고리 자동 분류: AI기술 / UX기획 / 디자인툴 / 헬스IT
- 30분 서버 캐시 (`next: { revalidate: 1800 }`)
- 클라이언트 측 30분 localStorage 캐시
- 스켈레톤 로딩 애니메이션

#### Google 캘린더 뷰 (`CalendarView.tsx`)
- 구글 캘린더 공식 iframe 임베드
- 이메일 입력 → 캘린더 URL 자동 구성
- 주간 / 월간 / 일정 뷰 전환
- localStorage에 계정 및 뷰 설정 저장

#### 위젯 설정 모달 (`SettingsModal.tsx`)
- 헤더 "설정" 버튼으로 열기
- 좌/우측 컬럼별 위젯 표시/숨기기 토글
- 위젯 순서 위아래 이동
- 프리셋: "기획 집중 모드" / "회의 많은 날" / "커스텀" (최대 3개 저장)

### 디자인 폴리싱
- **Pretendard Variable 폰트** 적용 (jsDelivr CDN)
- 위젯 카드: 글래스모피즘 강화 (`backdrop-blur-2xl`, 반투명 테두리, inset glow)
- 배경: 나이트스카이 + 별 트윙클 애니메이션 강화 (25개 추가)
- AI 조언 배너: Ambient radial gradient + 아이콘 glow 효과

---

## 아키텍처 메모

### Zustand 스토어 버전 관리
- `mydesk:dashboard-v2` → `v3` → `v4`: 위젯 스키마 변경 시 key를 bump해서 stale localStorage 방지
- `column: "left" | "right"` + `order: number` 필드로 레이아웃 제어

### 컴포넌트 분리 원칙
```
DashboardLayout (서버)
  └─ DashboardWidgets (클라이언트) ← Zustand store 읽기
       └─ WIDGET_MAP[type] → 각 위젯 컴포넌트
```

### API Route 설계
```
/api/ai/chat   ← Groq API 프록시 (POST, 서버사이드)
/api/news      ← Google News RSS 파싱 (GET, 30분 캐시)
```

---

## 향후 개선 과제

| 우선순위 | 항목 | 이유 |
|---------|------|------|
| 높음 | `NODE_TLS_REJECT_UNAUTHORIZED=0` 제거 | 프로덕션 보안 위험 |
| 높음 | Microsoft Graph API 연동 | Teams 실시간 알림 |
| 중간 | Google Calendar API (OAuth) | iframe 대비 더 많은 기능 |
| 중간 | 드래그 앤 드롭 위젯 재정렬 | 현재는 상/하 버튼으로만 이동 |
| 낮음 | 다중 사용자 + 클라우드 동기화 | v1.3 로드맵 |

---

## 반성 & 배운 점

1. **Windows 개발 환경의 SSL 이슈**: Schannel CRL 체크는 회사 네트워크에서 자주 발생. Node.js 프로젝트 시작 시 `NODE_TLS_REJECT_UNAUTHORIZED` 설정을 미리 알아두면 좋음.

2. **Zustand persist key 관리**: 스키마 변경 시 key를 반드시 bump. 그렇지 않으면 이전 형식의 데이터가 그대로 사용되어 런타임 에러 발생.

3. **MVP는 동작이 먼저**: 완벽한 구조보다 동작하는 완성도가 우선. RSS 뉴스 파싱도 외부 라이브러리 없이 regex로 충분했음.

4. **API 키 보안**: 클라이언트에서 API 키를 절대 노출하지 말 것. Next.js API Route를 프록시로 쓰는 패턴이 MVP에는 충분.
