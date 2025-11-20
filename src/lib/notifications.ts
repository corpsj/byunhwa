type OrderForNotify = {
  id: string;
  name: string;
  phone: string;
  schedule: string;
};

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER;
const adminPhone = process.env.ADMIN_PHONE_NUMBER;

const hasTwilioCreds = Boolean(twilioSid && twilioAuth && twilioFrom);

const sendSms = async (to: string, body: string) => {
  if (!hasTwilioCreds) return;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const payload = new URLSearchParams({
    To: to,
    From: twilioFrom || '',
    Body: body,
  }).toString();

  const authHeader = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('SMS send failed', res.status, text);
  }
};

// Placeholder for KakaoTalk/알림톡 webhook (expects external bridge)
const sendKakaoWebhook = async (payload: Record<string, unknown>) => {
  const url = process.env.KAKAO_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Kakao webhook failed', res.status, await res.text());
    }
  } catch (error) {
    console.error('Kakao webhook error', error);
  }
};

export const notifyNewOrder = async (order: OrderForNotify) => {
  const contactNumber = adminPhone || fallbackContact;
  const userMessage = `[변화 x Piri Fleur] 신청이 접수되었습니다.
이름: ${order.name}
일정: ${order.schedule}
입금 확인 후 확정 문자/카톡을 드립니다. 문의: ${contactNumber}`;

  const adminMessage = `[변화 x Piri Fleur 신청 알림]
이름: ${order.name}
연락처: ${order.phone}
일정: ${order.schedule}
스테이터스: 신규 대기`;

  const tasks = [];

  if (hasTwilioCreds) {
    tasks.push(sendSms(order.phone, userMessage));
    if (adminPhone) {
      tasks.push(sendSms(adminPhone, adminMessage));
    }
  }

  tasks.push(
    sendKakaoWebhook({
      type: 'order_created',
      order,
      userMessage,
      adminMessage,
    })
  );

  await Promise.allSettled(tasks);
};
const fallbackContact = '010-4086-6231';
