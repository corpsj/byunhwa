// YYYY-MM-DDTHH:mm 포맷의 로컬 날짜/시간 문자열
export const DEFAULT_SCHEDULES = [
  '2024-12-20T19:00',
  '2024-12-21T14:00',
  '2024-12-22T14:00',
];

export const DEFAULT_DETAILS = `[알러지 및 주의사항]
- 편백·침엽수 등 수목 소재 알러지가 있는 분은 수업 참여 전 주의가 필요합니다.
- 수업 시작 3일 전까지 100% 환불 가능하며, 이후에는 재료 준비로 인해 환불이 불가합니다.
- 수업 시작 10분 전까지 도착해주시기 바랍니다.`;

export const DEFAULT_ACCOUNT = {
  bankName: '국민은행',
  accountNumber: '1234-56-789012',
  depositor: '변화 x PIRI',
  price: '80000',
};

export const defaultFormConfig = {
  schedules: DEFAULT_SCHEDULES,
  details: DEFAULT_DETAILS,
  bankName: DEFAULT_ACCOUNT.bankName,
  accountNumber: DEFAULT_ACCOUNT.accountNumber,
  depositor: DEFAULT_ACCOUNT.depositor,
  price: DEFAULT_ACCOUNT.price,
};
