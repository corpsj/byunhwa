import { Resend } from 'resend';

type OrderForNotify = {
  id: string;
  name: string;
  phone: string;
  schedule: string;
  people_count?: number;
  total_amount?: number;
  product_type?: string;
};

type EmailConfig = {
  enabled: boolean;
  adminEmail: string;
};

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER;
const adminPhone = process.env.ADMIN_PHONE_NUMBER;
const resendApiKey = process.env.RESEND_API_KEY;

const hasTwilioCreds = Boolean(twilioSid && twilioAuth && twilioFrom);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

// Email notification
const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  if (!resend) {
    console.log('Resend API key not configured, skipping email');
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: 'Class Notification <onboarding@resend.dev>',
      to: [to],
      subject,
      html: htmlContent,
    });
    if (error) {
      console.error('Email send failed', error);
    }
  } catch (error) {
    console.error('Email send error', error);
  }
};

export const notifyNewOrder = async (order: OrderForNotify, emailConfig?: EmailConfig) => {
  const contactNumber = adminPhone || fallbackContact;
  const userMessage = `[변화 x Piri Flore] 신청이 접수되었습니다.
이름: ${order.name}
일정: ${order.schedule}
입금 확인 후 확정 문자/카톡을 드립니다. 문의: ${contactNumber}`;

  const adminMessage = `[변화 x Piri Flore 신청 알림]
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

  // Email notification
  if (emailConfig?.enabled && emailConfig.adminEmail) {
    const productName = order.product_type === 'wreath' ? '리스' : '트리';
    const peopleCount = order.people_count || 1;
    const totalAmount = order.total_amount ? order.total_amount.toLocaleString() : '-';

    const emailHtml = `
      <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2d5a3d; border-bottom: 2px solid #2d5a3d; padding-bottom: 10px;">
          🎄 새로운 클래스 신청이 접수되었습니다
        </h2>

        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555; width: 100px;">이름</td>
              <td style="padding: 8px 0;">${order.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">연락처</td>
              <td style="padding: 8px 0;">${order.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">일정</td>
              <td style="padding: 8px 0;">${order.schedule}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">인원</td>
              <td style="padding: 8px 0;">${peopleCount}인</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">제품</td>
              <td style="padding: 8px 0;">${productName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">결제금액</td>
              <td style="padding: 8px 0;">${totalAmount}원</td>
            </tr>
          </table>
        </div>

        <p style="color: #666; font-size: 14px;">
          📌 신청 상태: <strong style="color: #f5a623;">대기</strong><br>
          입금 확인 후 관리자 페이지에서 확정으로 변경해주세요.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          이 메일은 변화 x Piri Flore 클래스 신청 시스템에서 자동으로 발송되었습니다.
        </div>
      </div>
    `;

    tasks.push(
      sendEmail(
        emailConfig.adminEmail,
        `[클래스 신청] ${order.name}님이 ${order.schedule} 클래스를 신청했습니다`,
        emailHtml
      )
    );
  }

  await Promise.allSettled(tasks);
};
const fallbackContact = '010-4086-6231';
