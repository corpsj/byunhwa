import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const COOKIE_NAME = 'admin_auth';

const getAdminPassword = () => process.env.ADMIN_PASSWORD || '';

export const getAdminToken = () => {
  const password = getAdminPassword();
  return password
    ? crypto.createHmac('sha256', password).update(password).digest('hex')
    : '';
};

export const isAdminAuthed = async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const token = getAdminToken();

  // Check if both exist and have the same length before using timingSafeEqual
  if (!token || !cookie || token.length !== cookie.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cookie));
};

export const requireAdmin = async () => {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
};

export const setAdminCookie = (response: NextResponse) => {
  const token = getAdminToken();
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
};

export const clearAdminCookie = (response: NextResponse) => {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 0,
  });
};
