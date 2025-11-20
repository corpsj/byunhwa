import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { defaultFormConfig } from '@/lib/formDefaults';
import { requireAdmin } from '@/lib/adminAuth';

const normalizeSchedules = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // not JSON, fall through
    }
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
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
    details: record?.details || defaultFormConfig.details,
    bankName: record?.bank_name || defaultFormConfig.bankName,
    accountNumber: record?.account_number || defaultFormConfig.accountNumber,
    depositor: record?.depositor || defaultFormConfig.depositor,
    price: record?.price || defaultFormConfig.price,
    updatedAt: record?.updated_at || null,
  });
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { schedules, details, bankName, accountNumber, depositor, price } = await req.json();

  const parsedSchedules = Array.isArray(schedules)
    ? schedules.map((item: string) => String(item).trim()).filter(Boolean)
    : [];

  const payload = {
    id: 1,
    schedules: parsedSchedules.length > 0 ? parsedSchedules : defaultFormConfig.schedules,
    details: details ? String(details).trim() : defaultFormConfig.details,
    bank_name: bankName ? String(bankName).trim() : defaultFormConfig.bankName,
    account_number: accountNumber ? String(accountNumber).trim() : defaultFormConfig.accountNumber,
    depositor: depositor ? String(depositor).trim() : defaultFormConfig.depositor,
    price: Number.isFinite(Number(price)) ? Number(price).toString() : defaultFormConfig.price,
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
