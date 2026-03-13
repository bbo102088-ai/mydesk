import type { CommItem } from "@/types";

export const mockCommItems: CommItem[] = [
  {
    id: "1",
    source: "mail",
    sender: "CX팀 주간 리포트",
    title: "[Weekly] EMR 사용성 개선 안건 공유",
    timestamp: "09:10",
    isRead: false,
  },
  {
    id: "2",
    source: "teams",
    sender: "개발 Chapter",
    title: "[회의] 진료화면 리뉴얼 연동 점검",
    timestamp: "10:30",
    isRead: false,
  },
  {
    id: "3",
    source: "mail",
    sender: "보안팀",
    title: "[공지] 개인정보 처리지침 개정 안내",
    timestamp: "어제",
    isRead: true,
  },
  {
    id: "4",
    source: "teams",
    sender: "PM / 박부장님",
    title: "오늘 데모 때 강조할 포인트 정리",
    timestamp: "어제",
    isRead: true,
  },
];

