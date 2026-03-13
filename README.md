# 🏠 MyDesk — 기획자를 위한 올인원 업무 대시보드

> "창 전환 없이, 한 화면에서 모든 업무를 실행한다."

## 📌 프로젝트 소개

MyDesk는 EMR 업계 기획자의 **컨텍스트 스위칭 문제**를 해결하기 위한 위젯 기반 업무 대시보드입니다.

기획자는 하루에 피그마, AI 도구(ChatGPT, Claude, Gemini), Teams, Excel, 메일 등 5~6개 이상의 도구를 반복적으로 오갑니다. 이 과정에서 "지금 하던 일의 흐름"이 끊기고, 매번 도구를 찾아 다시 접속하는 데 불필요한 시간과 인지 비용이 소모됩니다.

MyDesk는 이 문제를 **한 화면에 위젯 형태로 자주 쓰는 도구를 모아** 해결합니다.

## 🎯 핵심 문제 정의

| 문제 | 설명 |
|------|------|
| 컨텍스트 스위칭 | 하루 30~50회 이상 도구 간 전환 발생 |
| 몰입 흐름 단절 | 도구 전환 시 "내가 뭐 하고 있었지?" 재탐색 비용 |
| 도구 접근 비용 | 실행까지 매번 3~4단계 탐색 필요 |

## 🧩 주요 기능 (위젯 6종)

| 위젯 | 기능 | AI 연동 |
|------|------|---------|
| **피그마 퀵런처** | 자주 쓰는 피그마 파일을 1클릭으로 오픈 | - |
| **AI 어시스턴트 허브** | Claude/ChatGPT/Gemini를 탭 전환으로 사용 | ✅ Anthropic API |
| **커뮤니케이션 피드** | 메일 + Teams를 하나의 타임라인으로 통합 | ✅ 긴급도 자동 분류 |
| **업무 시트 뷰어** | 태스크 목록 확인 + 상태 변경 | - |
| **뽀모도로 타이머** | 25/5 집중 사이클 + 집중 모드(알림 음소거) | ✅ 다음 할 일 추천 |
| **데일리 노트** | 오늘 할 일 메모 + 체크리스트 | ✅ To-Do 자동 제안 |

✨ **위젯 커스터마이징**: 위젯 추가/삭제, 드래그 앤 드롭 배치, 상황별 레이아웃 프리셋 저장

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 상태 관리 | Zustand |
| AI 연동 | Anthropic API (Claude) |
| 데이터 저장 | localStorage (MVP) |
| 배포 | Vercel |

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx            # 메인 대시보드
│   └── globals.css
├── components/
│   ├── layout/             # 헤더, 그리드, 위젯 래퍼
│   ├── widgets/            # 위젯 6종 컴포넌트
│   └── settings/           # 위젯 설정 모달
├── hooks/                  # 커스텀 훅 (usePomodoro 등)
├── lib/                    # API 호출, 목 데이터
├── types/                  # TypeScript 인터페이스
└── store/                  # Zustand 전역 상태
```

## 🚀 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/your-team/mydesk.git
cd mydesk

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local에 API 키 입력:
# ANTHROPIC_API_KEY=your_key_here

# 4. 개발 서버 실행
npm run dev

# 5. 브라우저에서 확인
# http://localhost:3000
```

## 🔑 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Claude API 키 | ✅ |
| `OPENAI_API_KEY` | ChatGPT API 키 | 선택 |
| `GOOGLE_AI_API_KEY` | Gemini API 키 | 선택 |

## 👥 팀 정보

| 역할 | 이름 | 담당 |
|------|------|------|
| 기획 | (이름) | PRD, 유저 시나리오, IA, 와이어프레임 |
| 개발 | (이름) | 프론트엔드 구현 |
| AI 협업 | Claude Code | 코드 생성, 리팩토링, 디버깅 |

## 📄 문서 목록

| 문서 | 설명 |
|------|------|
| [PRD (요구사항 정의서)](./docs/PRD.md) | 문제 정의, 기능 요구사항, 데이터 모델 |
| [CLAUDE.md](./CLAUDE.md) | AI 컨텍스트 파일 (클로드 코드 설정) |
| [DEVLOG.md](./docs/DEVLOG.md) | 개발 진행 기록 |
| [USER_SCENARIO.md](./docs/USER_SCENARIO.md) | 유저 시나리오 & 플로우 |

## 📜 라이선스

MIT License