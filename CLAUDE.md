# CLAUDE.md — MyDesk AI 컨텍스트 파일

> 이 파일은 Claude Code가 프로젝트를 이해하고 일관성 있게 코드를 생성하기 위한 컨텍스트 파일입니다.

## 프로젝트 개요

MyDesk는 EMR 업계 기획자를 위한 **위젯 기반 올인원 업무 대시보드**입니다.
핵심 목표는 **컨텍스트 스위칭 제로** — 한 화면에서 모든 업무 도구를 실행하는 것입니다.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript (strict 모드)
- **스타일링**: Tailwind CSS + shadcn/ui
- **상태 관리**: Zustand
- **AI API**: Anthropic Claude API (우선), OpenAI, Google AI (선택)
- **데이터 저장**: localStorage (MVP 단계)
- **패키지 매니저**: npm

## 코딩 컨벤션

### 파일/폴더 규칙
- 컴포넌트: PascalCase (`PomodoroTimer.tsx`)
- 훅: camelCase, use 접두사 (`usePomodoro.ts`)
- 유틸/라이브러리: camelCase (`claude.ts`)
- 타입 정의: `types/index.ts`에 집중, 필요 시 분리

### TypeScript 규칙
- `any` 사용 금지. 반드시 타입을 명시한다
- 인터페이스는 `I` 접두사 없이 사용 (`TaskItem`, not `ITaskItem`)
- props는 컴포넌트명 + Props (`PomodoroTimerProps`)

### 컴포넌트 규칙
- 함수형 컴포넌트 + React Hooks만 사용
- 컴포넌트당 하나의 파일
- 비즈니스 로직은 커스텀 훅으로 분리 (`hooks/` 폴더)
- UI 로직과 데이터 로직을 분리한다

### 스타일링 규칙
- Tailwind CSS 유틸리티 클래스 사용
- 인라인 스타일 사용 금지
- 다크모드는 `dark:` 접두사로 대응
- shadcn/ui 컴포넌트를 최대한 활용

### 상태 관리 규칙
- 위젯 내부 상태: useState / useReducer
- 위젯 간 공유 상태: Zustand store
- 영속 데이터: localStorage (useLocalStorage 훅 경유)

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router (page, layout)
├── components/
│   ├── layout/             # Header, DashboardGrid, WidgetWrapper
│   ├── widgets/            # 위젯 6종 (FigmaLauncher, AiAssistant 등)
│   └── settings/           # WidgetSettingsModal, PresetSelector
├── hooks/                  # usePomodoro, useLocalStorage, useWidgetConfig
├── lib/
│   ├── ai/                 # claude.ts, openai.ts, gemini.ts
│   └── mock/               # 목 데이터 (commData.ts, taskData.ts)
├── types/                  # TypeScript 인터페이스 정의
└── store/                  # Zustand store (dashboardStore.ts)
```

## 주요 데이터 모델

```typescript
// 모든 인터페이스는 types/index.ts에 정의

FigmaFile      // 피그마 파일 (id, name, url, color, lastModified)
AiMessage      // AI 대화 메시지 (role, content, model, timestamp)
CommItem       // 메일/팀즈 항목 (source, sender, title, isRead)
TaskItem       // 업무 태스크 (task, status, dueDate, priority)
PomodoroState  // 타이머 상태 (isRunning, mode, remainingSeconds)
DailyNote      // 데일리 노트 (date, memo, checklist)
WidgetConfig   // 위젯 설정 (type, position, size, isVisible)
LayoutPreset   // 레이아웃 프리셋 (name, widgets[])
```

## 위젯 목록 및 우선순위

| 순서 | 위젯 | 파일 | 핵심 기능 |
|------|------|------|----------|
| 1 | 뽀모도로 타이머 | PomodoroTimer.tsx | 25/5 사이클, 세션 추적 |
| 2 | 데일리 노트 | DailyNote.tsx | 체크리스트, 메모, 이월 |
| 3 | 피그마 퀵런처 | FigmaLauncher.tsx | URL 등록, 1클릭 오픈 |
| 4 | 업무 시트 뷰어 | WorkSheet.tsx | CRUD, 상태 변경 |
| 5 | AI 어시스턴트 | AiAssistant.tsx | Claude API, 탭 전환 |
| 6 | 커뮤니케이션 피드 | CommFeed.tsx | 메일+팀즈 통합 피드 |

## API 연동 규칙

### Claude API
- 엔드포인트: `/api/ai/claude` (Next.js API Route로 프록시)
- 모델: `claude-sonnet-4-20250514`
- API 키는 절대 클라이언트에 노출하지 않는다 (서버 사이드에서만 사용)
- 에러 처리: try-catch로 감싸고, 사용자에게 친절한 에러 메시지 표시

### localStorage
- 키 네이밍: `mydesk:` 접두사 사용 (예: `mydesk:figma-files`, `mydesk:daily-note:2026-03-13`)
- JSON.stringify/parse로 직렬화
- useLocalStorage 훅을 통해서만 접근

## 디자인 원칙

- **플랫 & 클린**: 그라디언트, 그림자 최소화. 깔끔한 표면
- **위젯 카드 스타일**: 흰색 배경, 0.5px 보더, border-radius-lg, padding 1rem 1.25rem
- **상태 색상 체계**:
  - 높음/긴급: 빨강 계열 (#FCEBEB 배경, #A32D2D 텍스트)
  - 보통/진행중: 노랑 계열 (#FAEEDA 배경, #854F0B 텍스트)
  - 완료/성공: 초록 계열 (#E1F5EE 배경, #0F6E56 텍스트)
  - 낮음/대기: 회색 계열
- **폰트**: 시스템 폰트 (Tailwind 기본)
- **간격**: 위젯 간 16px gap

## 주의사항

- MVP 단계이므로 과도한 최적화보다 **동작하는 완성도**를 우선한다
- 커뮤니케이션 피드는 목 데이터로 구현하되, 실제 API 연동 가능한 인터페이스를 유지한다
- 모든 위젯은 독립적으로 동작해야 한다 (하나가 에러나도 다른 위젯에 영향 없음)
- 접근성: 키보드 네비게이션, 적절한 aria 라벨 포함

## 커밋 메시지 규칙

```
feat: 새 기능 추가
fix: 버그 수정
style: 스타일 변경 (코드 동작 변경 없음)
refactor: 리팩토링
docs: 문서 수정
chore: 설정, 빌드 관련
```

예시: `feat: 뽀모도로 타이머 위젯 구현`, `fix: 데일리 노트 체크리스트 저장 오류 수정`