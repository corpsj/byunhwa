import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { defaultFormConfig } from '@/lib/formDefaults';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to normalize schedules
// Can be string[] or object[]: { time: string, capacity?: number }
const normalizeSchedules = (value: unknown): { time: string; capacity: number }[] => {
  const normalizeTime = (val: string) => val.trim();
  const defaultCapacity = 100; // Default high capacity if not set

  let items: any[] = [];

  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) items = parsed;
      else items = value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    } catch {
      items = value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    }
  }

  return items.map((item) => {
    if (typeof item === 'string') {
      return { time: normalizeTime(item), capacity: defaultCapacity };
    }
    if (typeof item === 'object' && item !== null) {
      return {
        time: normalizeTime(String(item.time || '')),
        capacity: Number(item.capacity) || defaultCapacity,
      };
    }
    return null;
  }).filter((item): item is { time: string; capacity: number } => Boolean(item && item.time));
};

const normalizeStringField = (value: unknown, fallback: string) => {
  const normalized = value ? String(value).trim() : '';
  return normalized || fallback;
};

const normalizePrice = (value: unknown, fallback: string) => {
  const numeric = typeof value === 'number'
    ? value
    : Number(String(value || '').replace(/[^\d]/g, ''));
  return Number.isFinite(numeric) && numeric > 0
    ? numeric.toString()
    : fallback;
};

export async function GET() {
  const supabase = getSupabaseServer();

  // Fetch config
  const { data: configData, error: configError } = await supabase
    .from('form_config')
    .select('schedules, details, bank_name, account_number, depositor, price, price_2_people, background_image, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (configError) {
    console.error('Failed to fetch form config', configError);
  }

  const record = configData?.[0];
  const schedulesConfig = normalizeSchedules(record?.schedules);
  const schedules = schedulesConfig.length > 0 ? schedulesConfig : normalizeSchedules(defaultFormConfig.schedules);

  // Calculate remaining seats
  // 1. Get all confirmed/pending orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('schedule, people_count, status');

  if (ordersError) {
    console.error('Failed to fetch orders for capacity', ordersError);
  }

  const reservedCounts: Record<string, number> = {};
  (orders || []).forEach((order) => {
    if (order.status === 'cancelled') return;
    const count = order.people_count || 1;
    reservedCounts[order.schedule] = (reservedCounts[order.schedule] || 0) + count;
  });

  const schedulesWithCapacity = schedules.map((s) => ({
    ...s,
    reserved: reservedCounts[s.time] || 0,
    remaining: Math.max(0, s.capacity - (reservedCounts[s.time] || 0)),
  }));

  return NextResponse.json({
    schedules: schedulesWithCapacity,
    details: normalizeStringField(record?.details, defaultFormConfig.details),
    bankName: normalizeStringField(record?.bank_name, defaultFormConfig.bankName),
    accountNumber: normalizeStringField(record?.account_number, defaultFormConfig.accountNumber),
    depositor: normalizeStringField(record?.depositor, defaultFormConfig.depositor),
    price: normalizePrice(record?.price, defaultFormConfig.price),
    price2: normalizePrice(record?.price_2_people, defaultFormConfig.price2),
    backgroundImage: normalizeStringField(record?.background_image, defaultFormConfig.backgroundImage),
    updatedAt: record?.updated_at || null,
  });
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { schedules, details, bankName, accountNumber, depositor, price, price2, backgroundImage } = await req.json();

  // schedules comes in as array of { time, capacity } or strings
  const parsedSchedules = normalizeSchedules(schedules);

  const payload = {
    id: 1,
    schedules: parsedSchedules, // Supabase will store this as JSONB if column type allows, or we might need to stringify if it's text
    details: details ? String(details).trim() : defaultFormConfig.details,
    bank_name: bankName ? String(bankName).trim() : defaultFormConfig.bankName,
    account_number: accountNumber ? String(accountNumber).trim() : defaultFormConfig.accountNumber,
    depositor: depositor ? String(depositor).trim() : defaultFormConfig.depositor,
    price: normalizePrice(price, defaultFormConfig.price),
    price_2_people: normalizePrice(price2, defaultFormConfig.price2),
    background_image: backgroundImage ? String(backgroundImage).trim() : '',
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
