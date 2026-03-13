# MyDesk 개발 로그 (DEVLOG)

**프로젝트**: MyDesk — EMR 기획자를 위한 AI-Native 올인원 업무 대시보드
**기간**: 2026-03-10 ~ 2026-03-13 (4일 스프린트)
**스택**: Next.js 14, TypeScript, Tailwind CSS v4, Zustand, Groq API
**작성자**: 기획자 본인 (개발 1인)

---

## Day 0 — 2026-03-09 (사전 기획)

### 왜 이걸 만들기로 했나

오늘 업무를 마치고 하루 동안 내가 몇 번이나 앱을 전환했는지 세어봤다.
피그마 → Teams → 메일 → Claude → 다시 피그마 → Notion → 다시 Teams...
시간을 재봤더니 오전 9시부터 오후 6시까지 탭/앱 전환이 **43회** 였다.

이게 그냥 내 습관 문제가 아니라 **구조적인 문제**라는 생각이 들었다.
도구들이 서로 연결이 안 돼 있으니까 매번 내가 컨텍스트를 머릿속에 들고 이동해야 한다.

MVP 아이디어: 자주 쓰는 도구들을 위젯으로 한 화면에 모아버리자.
거창하게 만들 필요 없다. 내가 매일 쓰는 것만. 일단 만들어보자.

### 기술 스택 선정 과정

처음엔 그냥 순수 HTML/CSS/JS로 만들까 했다. 가장 빠를 것 같아서.
근데 상태 관리가 복잡해질 게 뻔하고, 나중에 AI API 붙이려면 서버 사이드가 필요하다.

**검토한 옵션들:**
- Vite + React: 빠르지만 API Route 없어서 AI 키 노출 위험
- Next.js 14 App Router: API Route 내장, Vercel 배포 용이, TypeScript 지원 완벽
- Remix: 좋지만 학습 곡선이 있음

→ **Next.js 14 App Router로 결정.** AI 키를 서버에서만 다루고 싶었고, 향후 SSR/캐싱도 쓸 수 있어서.

**AI 모델 선정:**
- OpenAI GPT-4o: 비용 부담
- Anthropic Claude API: 품질 최고지만 월정액
- Groq (llama-3.3-70b): **무료 tier, 응답 속도가 압도적으로 빠름** → 채택

---

## Day 1 — 2026-03-10 (AM): 프로젝트 기초 설정

### 환경 세팅

```bash
npx create-next-app@latest mydesk --typescript --tailwind --app
cd mydesk
npx shadcn@latest init
npm install zustand lucide-react nanoid
```

TypeScript `strict` 모드는 처음엔 귀찮을 것 같아서 끄려다가 그냥 켰다.
`any` 쓰기 시작하면 나중에 걷잡을 수 없다는 걸 예전에 경험했기 때문.

### 폴더 구조 설계

처음 초안:
```
src/
├── app/
├── components/
└── utils/
```

너무 단순하다. 위젯이 6~8개 생기면 `components/`가 난장판이 된다.
PRD를 다시 보면서 위젯 단위로 분리하는 게 맞겠다고 판단.

최종 구조:
```
src/
├── app/            # Next.js 라우트
├── components/
│   ├── layout/     # 페이지 레이아웃 컴포넌트
│   ├── widgets/    # 각 위젯 (독립 단위)
│   ├── settings/   # 설정 모달
│   └── ui/         # shadcn/ui 기본 컴포넌트
├── hooks/          # 재사용 커스텀 훅
├── lib/            # API 클라이언트, 목 데이터
├── store/          # Zustand 전역 상태
└── types/          # TypeScript 인터페이스 모음
```

위젯을 독립 단위로 만들면 나중에 하나가 에러나도 다른 위젯에 영향 없다.
이게 중요한 이유는 실제 업무 중에 대시보드가 통째로 죽으면 안 되기 때문.

### 타입 시스템 설계 (`types/index.ts`)

처음엔 각 위젯 파일 안에 타입을 인라인으로 뒀다가,
금방 중복이 생겨서 `types/index.ts`로 전부 모았다.

주요 인터페이스:
```typescript
interface FigmaFile {
  id: string;
  name: string;
  url: string;
  color: string;
  lastModified: string; // ISO 8601
}

interface TaskItem {
  id: string;
  task: string;
  status: 'todo' | 'doing' | 'done' | 'hold';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface CommItem {
  id: string;
  source: 'mail' | 'teams';
  sender: string;
  title: string;
  preview: string;
  isRead: boolean;
  receivedAt: string;
}
```

`status`에 `'hold'` (보류)를 넣을지 고민했다.
실제 기획 업무에서 "보류" 상태가 생각보다 많다는 걸 알았기 때문에 추가하기로 결정.

---

## Day 1 — 2026-03-10 (PM): Zustand 스토어 & 커스텀 훅

### Zustand 스토어 설계 (`dashboardStore.ts`)

위젯 설정을 어떻게 관리할지가 핵심 고민이었다.

**Option A**: 각 위젯이 자기 isVisible 상태를 독립적으로 localStorage에 저장
**Option B**: 중앙 Zustand 스토어에서 전체 위젯 메타 관리

Option A가 더 단순하지만, 나중에 프리셋(레이아웃 저장) 기능을 만들려면
어차피 중앙 관리가 필요하다. PRD REQ-02에 프리셋 요구사항이 있었다.
→ **Option B 채택**

위젯 스키마:
```typescript
type WidgetConfig = {
  type: WidgetType;
  column: 'left' | 'right';
  order: number;
  isVisible: boolean;
};
```

`persist` 미들웨어 key를 `mydesk:dashboard-v4`로 설정.
개발 중에 스키마가 바뀔 때마다 버전을 올려서 stale 데이터 문제를 방지했다.
(v1 → v2 → v3 → v4 총 4번 바뀜. 이게 번거롭지만 안 하면 런타임 에러 폭탄)

### `useLocalStorage<T>` 훅

Zustand persist가 있는데 왜 또 localStorage 훅을 만들었냐면,
위젯 내부 데이터(피그마 파일 목록, 태스크 목록 등)는 위젯 자체가 관리하는 게 맞다고 생각해서다.
Zustand는 UI 상태(어떤 위젯이 보이는지, 순서)만 담당.

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });
  // ...
}
```

`try-catch`로 감싼 이유: 시크릿 모드나 스토리지 가득 찬 경우 예외가 발생할 수 있어서.

---

## Day 2 — 2026-03-11 (AM): 레이아웃 & 배경 작업

### 나이트스카이 배경 디자인

처음엔 그냥 `background: #0a0a1a` 단색이었다.
너무 심심해서 별을 추가해보기로 했다.

이미지 파일 없이 순수 CSS로 별을 만드는 방법을 찾다가
`box-shadow`를 여러 개 나열하는 패턴 발견.

```css
.night-sky__stars {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: 120px 45px 1px 0.5px rgba(255,255,255,0.8),
              280px 88px 0px 0.5px rgba(200,220,255,0.65),
              /* ... */;
}
```

1px × 1px 요소를 점으로 삼고 `box-shadow`로 그림자를 수십 개 뿌리는 방식.
별 밝기/크기를 랜덤하게 주기 위해 `rgba` opacity와 `blur/spread` 값을 다양하게 설정.

트윙클 애니메이션은 `opacity` 변화로 구현. 별 그룹별로 속도를 다르게 해서
실제 하늘처럼 각기 다른 리듬으로 깜빡이는 효과.

별을 slow / medium / fast / extra 4그룹으로 나눈 것도 이 때문.

### 달 구현

처음엔 단순한 노란 원이었다.
초승달을 표현하기 위해 `::before` 가상 요소로 배경색 원을 겹쳐서 크레센트 모양 구현.
나중에 Apple Weather 앱처럼 블러 처리된 부드러운 달로 개선 (Day 4에서 다시 작업).

### 2/3 + 1/3 그리드 레이아웃

```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="col-span-2">{/* 좌측 메인 */}</div>
  <div className="col-span-1">{/* 우측 보조 */}</div>
</div>
```

처음엔 `col-span-2 / col-span-1`로 단순하게 했다가
실제로 보니 좌측이 너무 넓고 우측이 너무 좁아서
`max-w-6xl`에 `px-4`로 전체 너비를 제한하는 방향으로 수정.

---

## Day 2 — 2026-03-11 (PM): 핵심 위젯 4종 구현

### 뽀모도로 타이머

`usePomodoro` 커스텀 훅 분리. 컴포넌트는 UI만 담당.

타이머 로직에서 가장 고민한 부분:
`setInterval`을 쓰면 탭이 백그라운드로 가면 throttle 되어서 정확도가 떨어진다.

→ `Date.now()`를 기준으로 남은 시간을 계산하는 방식으로 변경:
```typescript
const tick = () => {
  const elapsed = Date.now() - startTimeRef.current;
  const remaining = totalSeconds * 1000 - elapsed;
  setRemainingMs(Math.max(0, remaining));
};
```

세션 완료 도트를 최대 4개로 제한한 건 PRD 스펙 그대로인데,
실제로 4개(=2시간) 이상 연속 뽀모도로를 하는 날이 없어서 적절하다고 판단.

### 데일리 노트

날짜 키 생성:
```typescript
const todayKey = `mydesk:daily-note:${new Date().toISOString().slice(0, 10)}`;
```

완료된 체크리스트 항목을 자동으로 하단 정렬하는 기능을 넣을지 고민했다.
실제로 써보니 완료된 게 위에 있으면 시선이 분산되어서 하단 정렬 결정.

```typescript
const sorted = [
  ...items.filter(i => !i.done),
  ...items.filter(i => i.done),
];
```

단순하지만 효과적.

### 업무 시트

상태 사이클을 클릭으로 순환하는 UX는 GitHub Issues에서 영감을 받았다.
`대기 → 진행중 → 완료 → 보류 → 대기` 순환.

날짜 input의 `[color-scheme:dark]` 이슈가 꽤 시간을 잡아먹었다.
다크 배경에서 날짜 picker가 흰 배경으로 나타나서 전혀 어울리지 않았음.
Tailwind에서 arbitrary property로 `[color-scheme:dark]`를 추가하니 해결.

### 커뮤니케이션 피드

실제 Teams/Outlook API 연동은 OAuth 설정이 필요해서 MVP에서는 제외.
목업 데이터를 실제처럼 느껴지게 만드는 게 관건이었다.

```typescript
// lib/mock/commData.ts
export const COMM_ITEMS: CommItem[] = [
  {
    source: 'teams',
    sender: '김지훈 (QA팀)',
    title: '진료화면 리뉴얼 v3 — 테스트 케이스 공유',
    preview: '안녕하세요, 첨부된 시나리오 검토 부탁드립니다...',
    isRead: false,
    receivedAt: '2026-03-13T09:12:00',
  },
  // ...
];
```

발신자 이름을 팀명까지 포함하니 실제 업무 메시지처럼 보였다.

---

## Day 2 — 2026-03-11 (야간): 피그마 퀵런처 & AI 어시스턴트

### 피그마 퀵런처 디자인 결정

처음엔 리스트 형태로 만들었다.
파일명 + URL이 나란히 줄로 늘어서는 구조.

근데 Figma 자체가 시각적인 도구인데 리스트는 너무 밋밋하다는 생각이 들었다.
→ **컬러 카드 그리드**로 변경. 색상으로 파일을 직관적으로 구분.

카드 색상 5가지를 제공하는 이유: 프로젝트마다 색상을 지정하면
파일명을 읽지 않아도 색으로 어떤 파일인지 바로 식별 가능.

URL 유효성 검사를 추가한 이유:
실수로 잘못된 URL을 등록하면 클릭해도 빈 페이지가 뜨는 것보다
등록 시점에 차단하는 게 낫다.

```typescript
function isFigmaUrl(url: string): boolean {
  return /^https:\/\/(www\.)?figma\.com\/.+/.test(url.trim());
}
```

### AI 어시스턴트 탭 구조

처음엔 Groq 하나만 연동하고 ChatGPT/Gemini는 아예 안 보여주려 했다.
근데 기획자 입장에서는 "어떤 AI가 더 나은지 비교"하는 것 자체가 업무 패턴 중 하나.
→ ChatGPT/Gemini 탭은 남겨두되 "준비 중" 안내로 향후 확장 여지 열어둠.

대화 히스토리 자동 스크롤:
```typescript
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

메시지가 추가될 때마다 `scrollIntoView`로 최신 메시지로 이동.

---

## Day 3 — 2026-03-12 (AM): Groq API 연동 & 디버깅 지옥

### API Route 설계

클라이언트에서 직접 Groq API를 호출하면 API 키가 번들에 포함된다.
→ Next.js API Route를 프록시로 사용.

```typescript
// app/api/ai/chat/route.ts
export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }
  // Groq API 호출...
}
```

### "fetch failed" 에러와의 3시간 싸움

오전 내내 API가 안 됐다. 정확한 증상과 해결 과정을 기록해둔다.

**증상:**
```
Groq 서버 연결 실패: fetch failed
```

**Step 1: API 키 확인**
키 값이 올바른지 확인 → 정상. 그루크 대시보드에서도 키가 활성 상태.

**Step 2: 에러 로그 상세화**
`console.error`로 에러 객체 전체 출력:
```
cause: Error: write EPROTO B8150000:error:0A000438:SSL...
  schannel: SEC_E_UNTRUSTED_ROOT
```

`EPROTO` + `schannel` → SSL 문제임을 확인.

**Step 3: curl로 직접 테스트**
```bash
curl -v https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```
```
schannel: CertGetCertificateChain trust error CERT_TRUST_REVOCATION_STATUS_UNKNOWN
CRYPT_E_NO_REVOCATION_CHECK (0x80092012)
```

**원인 파악**: 회사 보안 네트워크에서 Windows Schannel이
Groq 인증서의 CRL(Certificate Revocation List) 서버에 접근하지 못함.
인증서 자체가 문제가 아니라 인증서 폐기 여부를 확인하는 서버가 막힌 것.

**Step 4: curl로 우회 확인**
```bash
curl --ssl-no-revoke -v https://api.groq.com/openai/v1/models
# → HTTP 200 OK 확인
```

**해결:**
```
# .env.local
NODE_TLS_REJECT_UNAUTHORIZED=0
```

개발 환경 한정. 프로덕션에서는 절대 쓰면 안 됨. (Vercel 배포 시 제거 예정)

---

### AI 조언 배너 기획 배경

Groq API가 연동됐으니 단순 챗봇 말고 더 유용하게 쓸 방법을 고민했다.

아이디어: 대시보드를 열 때마다 짧은 업무 팁이나 동기부여 메시지가 뜨면 어떨까?
→ **AI 조언 배너** 기획.

그냥 static 텍스트보다 Groq API로 실시간 생성하면 더 가치 있다고 생각했는데,
AI 조언은 매번 생성하기엔 API 비용이 아깝고 컨텍스트도 없어서 퀄리티도 낮을 것 같았다.
→ **AI 조언 탭**: 미리 작성된 7가지 팁 랜덤 로테이션
→ **오늘의 운세 탭**: Groq API로 하루 1회 생성 후 localStorage 캐싱

운세를 하루 1회 캐싱하는 로직:
```typescript
function todayKey() {
  return `mydesk:fortune:${new Date().toISOString().slice(0, 10)}`;
}
// 페이지 로드 시 캐시 확인 → 없으면 API 호출 → 결과 저장
```

---

## Day 3 — 2026-03-12 (PM): 퀵 앱 바 데스크탑 프로토콜

### 단순 링크 → 데스크탑 앱 실행

처음엔 버튼을 `<a href="https://teams.microsoft.com" target="_blank">`로 만들었다.
근데 Teams, Figma 같은 앱은 웹보다 **데스크탑 앱**이 훨씬 빠르고 쾌적하다.

OS가 지원하는 커스텀 프로토콜로 앱을 직접 실행할 수 있다:
- `msteams://` → Teams 앱
- `figma://` → Figma 앱
- `ms-excel://` → Excel 앱
- `ms-outlook://` → Outlook 앱

앱 미설치 시 처리가 문제였다.
`window.location.href = 'msteams://'`를 호출했는데 앱이 없으면 아무 일도 안 일어난다.

→ `visibilitychange` 이벤트 활용:
앱이 실행되면 OS가 포커스를 가져가면서 브라우저 탭이 숨겨짐.
1.5초 안에 `visibilitychange`가 발생하지 않으면 → 앱 미설치로 판단 → 웹 URL 열기.

```typescript
window.location.href = app.protocol;
let launched = false;
document.addEventListener('visibilitychange', () => { launched = true; });
setTimeout(() => {
  if (!launched) window.open(app.webUrl, '_blank');
}, 1500);
```

Teams/Mail 미읽음 뱃지는 실제 API 연동 대신 목업 데이터로.
Microsoft Graph API 연동은 OAuth 설정이 필요해 MVP 범위 초과 → v1.1 로드맵으로 이동.

---

## Day 4 — 2026-03-13 (AM): 뉴스 피드 & 캘린더 위젯

### 뉴스 피드 — 외부 의존성 없이 구현

처음엔 NewsAPI.org 같은 유료 서비스를 쓰려 했다.
무료 플랜은 하루 100건 제한이고, CORS 때문에 서버에서 호출해야 한다.

**대안 탐색:**
- Google News RSS: 무료, 공개, 한국어 지원
- 별도 파서 라이브러리 없이 regex로 XML 파싱 가능

```typescript
function extractText(tag: string, xml: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i'));
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return plainMatch ? plainMatch[1].replace(/<[^>]+>/g, '').trim() : '';
}
```

CDATA 섹션과 일반 텍스트 두 경우를 모두 처리.

캐싱 전략:
- **서버 캐시**: `next: { revalidate: 1800 }` → 30분마다 새 데이터
- **클라이언트 캐시**: localStorage에 저장 + timestamp 비교 → API 재호출 최소화

카테고리 분류는 제목 키워드 기반:
```typescript
function detectCategory(title: string): Category {
  if (/AI|GPT|LLM|머신러닝|딥러닝/.test(title)) return 'AI기술';
  if (/UX|UI|사용자경험|인터페이스/.test(title)) return 'UX기획';
  if (/Figma|피그마|디자인툴|Framer/.test(title)) return '디자인툴';
  if (/EMR|의료|헬스케어|병원/.test(title)) return '헬스IT';
  return 'AI기술'; // 기본값
}
```

### Google 캘린더 위젯

Google Calendar API(OAuth)는 구현 비용이 너무 크다. (클라이언트 ID, 리다이렉트 URI, 토큰 관리...)
→ **공식 iframe embed** 방식으로 결정.

Google Calendar는 공개 임베드 URL을 지원한다:
```
https://calendar.google.com/calendar/embed?src={email}&ctz=Asia/Seoul&mode=WEEK
```

이 URL을 `<iframe>`으로 임베드하면 인증 없이 캘린더를 표시할 수 있다.
계정 이메일만 입력받아서 URL을 동적으로 구성.

주간/월간/일정 뷰 전환은 `mode` 파라미터 변경:
```typescript
const MODE_MAP = { week: 'WEEK', month: 'MONTH', agenda: 'AGENDA' };
const url = `https://calendar.google.com/calendar/embed?src=${email}&mode=${MODE_MAP[mode]}`;
```

---

## Day 4 — 2026-03-13 (PM): 위젯 설정 & 디자인 폴리싱

### 위젯 설정 모달 (REQ-02)

Zustand 스토어에 이미 `isVisible`, `order` 필드가 있어서
모달은 그 값을 읽고 쓰는 UI만 만들면 됐다.

프리셋 개념:
- **기획 집중 모드**: 피그마 퀵런처, AI 어시스턴트, 뽀모도로, 데일리 노트
- **회의 많은 날**: 커뮤니케이션 피드, 캘린더, 데일리 노트
- **커스텀**: 사용자가 직접 저장 (최대 3개)

빌트인 프리셋은 코드에 hardcoded, 커스텀 프리셋은 localStorage에 저장.

### Pretendard 폰트 적용

기본 시스템 폰트가 너무 평범해서 한국어 전용 폰트로 교체.
Pretendard는 Apple SF Pro와 유사한 느낌으로 다크 배경에 잘 어울린다.

```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
```

`dynamic-subset` 버전을 선택한 이유: 전체 폰트 파일 대신 사용 중인 글자만 로드해서 성능 최적화.

### 글래스모피즘 카드 스타일

shadcn/ui 기본 Card는 흰 배경이다.
`[data-slot="card"]` 셀렉터로 전역 오버라이드:

```css
[data-slot="card"] {
  background-color: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(40px) !important;
  box-shadow:
    0 30px 120px rgba(0, 0, 0, 0.65),
    inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
}
```

`inset 0 1px 0` 이 1px짜리 상단 하이라이트가 유리 질감의 핵심.

### 달 디자인 개선 (Apple Weather 스타일)

초기 구현은 단순 노란 원 + `::before`로 크레센트 마스킹이었다.
경계선이 너무 선명해서 디지털스러운 느낌.

3단계 블러 구조로 개선:
1. `.moon-halo`: `filter: blur(36px)` → 200px+ 대기권 빛 번짐
2. `.moon` 본체: `filter: blur(2.5px)` → 원 외곽선 자체가 뭉개짐
3. `::before` 컷아웃: `filter: blur(9px)` → 명암 경계선(terminator) 소프트

결과적으로 iOS 날씨앱처럼 뿌옇고 따뜻한 달 느낌.

---

## Day 4 — 2026-03-13 (야간): 문서화 & 마무리

### 제출 전 점검 리스트

- [x] 모든 위젯 독립 동작 확인
- [x] localhost:3000 초기 로딩 3초 이내 확인
- [x] AI 어시스턴트 Groq API 실제 응답 확인
- [x] 오늘의 운세 생성 + localStorage 캐싱 확인
- [x] 피그마 퀵런처 추가/삭제 localStorage 영속 확인
- [x] 업무 시트 태스크 CRUD + 상태 변경 확인
- [x] 뽀모도로 타이머 25/5 자동 전환 확인
- [x] 퀵 앱 바 데스크탑 앱 프로토콜 동작 확인
- [x] 위젯 설정 모달 토글/순서 변경/프리셋 저장 확인
- [x] 뉴스 피드 RSS 파싱 실제 데이터 표시 확인
- [x] Google 캘린더 iframe 임베드 확인
- [x] PRD.md 작성 완료
- [x] README.md 업데이트 완료
- [x] USER_SCENARIO.md 작성 완료
- [x] Git 커밋 히스토리 정리 완료

### 미완성 & 알려진 이슈

| 항목 | 현황 | 이유 |
|------|------|------|
| ChatGPT/Gemini 탭 연동 | "준비 중" 표시 | API 비용 및 시간 부족 |
| Teams 실시간 알림 | 목업 데이터 | Microsoft Graph API OAuth 필요 |
| 드래그 앤 드롭 위젯 재정렬 | 버튼 방식 | `dnd-kit` 통합 시간 부족 |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` | 개발 환경만 적용 | 프로덕션 배포 전 반드시 제거 |

---

## 아키텍처 최종 정리

### 컴포넌트 트리

```
page.tsx (Server Component)
  └─ DashboardLayout
       ├─ AppHeader
       │    └─ HeaderActions (Client) → SettingsModal
       ├─ QuickAppsBar (Client)
       ├─ AiBanner (Client)
       └─ Grid
            ├─ DashboardWidgets column="left" (Client)
            │    ├─ FigmaLauncher
            │    ├─ AiAssistant
            │    ├─ WorkSheet
            │    └─ CalendarView
            └─ DashboardWidgets column="right" (Client)
                 ├─ PomodoroTimer
                 ├─ DailyNote
                 ├─ CommFeed
                 └─ NewsFeed
```

### 데이터 흐름

```
[사용자 액션]
     │
     ├─ 위젯 내부 상태 → useState (일회성)
     ├─ 위젯 데이터 영속 → useLocalStorage (피그마 파일, 태스크 등)
     ├─ 위젯 메타 (보임/순서) → Zustand + persist (대시보드 설정)
     └─ AI 응답 → /api/ai/chat → Groq API (서버사이드)
```

### API 구조

```
/api/ai/chat  (POST)
  ← AiAssistant 위젯, AiBanner 운세 탭
  → Groq llama-3.3-70b-versatile
  → 서버사이드 전용, API 키 클라이언트 미노출

/api/news  (GET)
  ← NewsFeed 위젯
  → Google News RSS 파싱
  → revalidate: 1800 (30분 서버 캐시)
```

---

## 회고 (KPT)

### Keep — 잘한 것

- **위젯 독립 구조**: 각 위젯이 완전히 독립적으로 동작. 하나가 에러나도 나머지 정상.
- **서버사이드 API 프록시**: 클라이언트에 API 키 0 노출. 보안 기본기 지킴.
- **로컬스토리지 영속화**: 새로고침해도 데이터 유지. UX 기본기.
- **목업 → 실제 데이터 인터페이스 유지**: CommFeed는 목업이지만 타입 구조는 실제 API 대응 가능하게.

### Problem — 아쉬운 것

- **SSL 이슈로 Day 3 오전 전부 낭비**: 사전에 개발 환경 네트워크 테스트를 했어야 했다.
- **Zustand persist key 버전 관리**: 4번이나 올린 건 초기 설계가 불안정했다는 증거.
- **드래그 앤 드롭 미구현**: 버튼으로 순서 바꾸는 게 UX상 아쉽다.

### Try — 다음엔 이렇게

- 개발 시작 전 네트워크 환경 테스트 (특히 사내망)
- 타입 스키마 초안을 코드 전에 문서로 먼저 고정
- `dnd-kit` 라이브러리로 드래그 앤 드롭 위젯 재정렬 구현
- Microsoft Graph API로 Teams 실시간 연동 (v1.1)
