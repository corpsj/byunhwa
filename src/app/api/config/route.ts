import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { defaultFormConfig } from '@/lib/formDefaults';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const normalizeSchedules = (value: unknown): string[] => {
  const normalizeDateTime = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return '';

    // Accept yyyy-mm-dd or yyyy-mm-ddThh:mm (plus optional seconds/timezone)
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
    if (!match) return '';

    const datePart = match[1];
    const hour = match[2] ?? '00';
    const minute = match[3] ?? '00';

    const hourNum = Number(hour);
    const minuteNum = Number(minute);

    if (
      !Number.isFinite(hourNum) ||
      !Number.isFinite(minuteNum) ||
      hourNum < 0 ||
      hourNum > 23 ||
      minuteNum < 0 ||
      minuteNum > 59
    ) {
      return '';
    }

    const isoLocal = `${datePart}T${hourNum.toString().padStart(2, '0')}:${minuteNum
      .toString()
      .padStart(2, '0')}`;
    const d = new Date(isoLocal);
    return Number.isNaN(d.getTime()) ? '' : isoLocal;
  };

  const handleArray = (arr: unknown[]) =>
    arr.map((item) => normalizeDateTime(String(item))).filter(Boolean);

  if (Array.isArray(value)) {
    return handleArray(value);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return handleArray(parsed);
      }
    } catch {
      // not JSON, fall through
    }

    return handleArray(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  return [];
};

const normalizeStringField = (value: unknown, fallback: string) => {
  const normalized = value ? String(value).trim() : '';
  return normalized || fallback;
};

const normalizePrice = (value: unknown) => {
  const numeric = typeof value === 'number'
    ? value
    : Number(String(value || '').replace(/[^\d]/g, ''));
  return Number.isFinite(numeric) && numeric > 0
    ? numeric.toString()
    : defaultFormConfig.price;
};

export async function GET() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('form_config')
    .select('schedules, details, bank_name, account_number, depositor, price, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Failed to fetch form config', error);
  }

  const record = data?.[0];
  const schedulesFromDb = normalizeSchedules(record?.schedules);
  const schedules =
    schedulesFromDb.length > 0 ? schedulesFromDb : defaultFormConfig.schedules;

  return NextResponse.json({
    schedules,
    details: normalizeStringField(record?.details, defaultFormConfig.details),
    bankName: normalizeStringField(record?.bank_name, defaultFormConfig.bankName),
    accountNumber: normalizeStringField(record?.account_number, defaultFormConfig.accountNumber),
    depositor: normalizeStringField(record?.depositor, defaultFormConfig.depositor),
    price: normalizePrice(record?.price),
    updatedAt: record?.updated_at || null,
  });
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { schedules, details, bankName, accountNumber, depositor, price } = await req.json();

  const parsedSchedules = normalizeSchedules(schedules);

  const payload = {
    id: 1,
    schedules: parsedSchedules.length > 0 ? parsedSchedules : defaultFormConfig.schedules,
    details: details ? String(details).trim() : defaultFormConfig.details,
    bank_name: bankName ? String(bankName).trim() : defaultFormConfig.bankName,
    account_number: accountNumber ? String(accountNumber).trim() : defaultFormConfig.accountNumber,
    depositor: depositor ? String(depositor).trim() : defaultFormConfig.depositor,
    price: normalizePrice(price),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('form_config')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('Failed to save form config', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}
