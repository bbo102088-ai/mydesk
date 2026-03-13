# MyDesk — EMR 기획자를 위한 AI-Native 올인원 업무 대시보드

> "창 전환 없이, 한 화면에서 모든 업무를 실행한다."

## 프로젝트 소개

MyDesk는 EMR 업계 기획자의 **컨텍스트 스위칭 문제**를 해결하기 위한 위젯 기반 업무 대시보드입니다.

기획자는 하루에 Figma, AI 도구, Teams, Excel, 메일 등 7~10개 이상의 도구를 반복적으로 오갑니다. 이 과정에서 집중 흐름(flow)이 끊기고, 매번 도구를 찾아 다시 접속하는 데 불필요한 시간과 인지 비용이 소모됩니다.

MyDesk는 이 문제를 **한 화면에 위젯 형태로 모든 도구를 통합**하여 해결합니다.

---

## 핵심 문제

| 문제 | 설명 |
|------|------|
| 컨텍스트 스위칭 | 하루 40~60분이 툴 전환 및 컨텍스트 파악에 낭비 |
| 몰입 흐름 단절 | 도구 전환 시 "지금 하던 일"의 맥락 재탐색 비용 |
| AI 활용 마찰 | AI 도구를 쓰려면 새 탭·로그인이 필요한 진입 장벽 |

---

## 주요 기능 (위젯 8종)

| 위젯 | 기능 |
|------|------|
| **피그마 퀵런처** | Figma 파일 URL 등록, 컬러 카드 1클릭 오픈, 우클릭 삭제 |
| **AI 어시스턴트 허브** | Groq(Llama 3.3) 탭으로 실시간 AI 대화, ChatGPT/Gemini 탭 전환 |
| **업무 시트** | Task/Status/Due/Priority 테이블, 상태 클릭 사이클, localStorage 저장 |
| **뽀모도로 타이머** | 25/5분 사이클, 오늘 완료 세션 도트 시각화 |
| **데일리 노트** | 날짜별 체크리스트 + 자유 메모, 완료 항목 하단 정렬 |
| **커뮤니케이션 피드** | 메일 + Teams 통합 피드, 소스별 색상 구분, 미읽음 뱃지 |
| **AI·기획 뉴스** | Google News RSS 실시간 파싱, AI기술/UX/헬스IT 카테고리 분류 |
| **Google 캘린더 뷰** | 이메일 입력으로 iframe 임베드, 주간/월간/일정 전환 |

**추가 기능**
- **AI 조언 배너**: 업무 컨텍스트 기반 팁 + Groq API 기반 오늘의 운세 (하루 1회 캐시)
- **퀵 앱 바**: Figma, Claude, ChatGPT, Gemini, Teams, Excel, Mail 1클릭 실행 (데스크탑 앱 프로토콜 우선)
- **위젯 설정 모달**: 위젯 표시/숨기기, 순서 조정, 레이아웃 프리셋 저장 (최대 3개)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript (strict) |
| 스타일링 | Tailwind CSS v4 + shadcn/ui |
| 상태 관리 | Zustand + persist |
| AI API | Groq API (llama-3.3-70b-versatile) |
| 데이터 저장 | localStorage (MVP) |
| 뉴스 | Google News RSS (서버사이드 파싱) |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── ai/chat/route.ts    # Groq API 프록시
│   │   └── news/route.ts       # Google News RSS 파싱
│   ├── layout.tsx
│   ├── page.tsx                # 메인 대시보드
│   └── globals.css             # 나이트스카이 배경, Pretendard 폰트
├── components/
│   ├── layout/                 # Header, DashboardLayout, AiBanner, QuickAppsBar
│   ├── widgets/                # 위젯 8종
│   ├── settings/               # WidgetSettingsModal
│   └── ui/                     # shadcn/ui 커스텀 Card, Button
├── hooks/
│   └── useLocalStorage.ts
├── lib/
│   └── mock/                   # 커뮤니케이션 목 데이터
├── types/
│   └── index.ts                # 전체 TypeScript 인터페이스
└── store/
    └── dashboardStore.ts       # Zustand 위젯 상태 관리
```

---

## 실행 방법

```bash
# 1. 저장소 클론
git clone <repository-url>
cd mydesk

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env.local 파일 생성 후 아래 내용 입력:
# GROQ_API_KEY=gsk_your_key_here
# (Windows 회사 네트워크 환경에서 SSL CRL 오류 발생 시:)
# NODE_TLS_REJECT_UNAUTHORIZED=0

# 4. 개발 서버 실행
npm run dev

# 5. 브라우저에서 확인
# http://localhost:3000
```

---

## 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `GROQ_API_KEY` | Groq API 키 (groq.com에서 발급) | 필수 |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Windows SSL CRL 오류 우회 (`0`으로 설정) | 개발 환경 한정 |

> Groq API 키 발급: https://console.groq.com

---

## 문서

| 문서 | 설명 |
|------|------|
| [PRD](./docs/PRD.md) | 문제 정의, 기능 요구사항 명세, 검증 계획 |
| [DEVLOG](./docs/DEVLOG.md) | 일별 개발 진행 기록, 트러블슈팅 |
| [USER_SCENARIO](./docs/USER_SCENARIO.md) | 페르소나, 유저 시나리오, 태스크 플로우 |
| [CLAUDE.md](./CLAUDE.md) | AI 코드 생성 컨텍스트 파일 |

---

## 라이선스

MIT License
