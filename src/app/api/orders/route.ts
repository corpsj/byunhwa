import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { notifyNewOrder } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const { name, phone, schedule, agreed, peopleCount, totalAmount } = await req.json();

  if (!name || !phone || !schedule || agreed !== true) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Check capacity
  // 1. Get current capacity for this schedule
  const { data: configData } = await supabase
    .from('form_config')
    .select('schedules')
    .limit(1)
    .single();

  let capacity = 100;
  if (configData?.schedules) {
    const schedules = Array.isArray(configData.schedules) ? configData.schedules : [];
    const scheduleConfig = schedules.find((s: any) =>
      (typeof s === 'string' && s === schedule) ||
      (typeof s === 'object' && s.time === schedule)
    );
    if (scheduleConfig && typeof scheduleConfig === 'object') {
      capacity = Number(scheduleConfig.capacity) || 100;
    }
  }

  // 2. Get current reserved count
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('schedule', schedule)
    .neq('status', 'cancelled');

  // Note: This is a simple check and might have race conditions under high load.
  // For a small scale, this is acceptable. For strict consistency, use database constraints or transactions.
  // We also need to sum people_count, not just count rows.
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('people_count')
    .eq('schedule', schedule)
    .neq('status', 'cancelled');

  const currentReserved = existingOrders?.reduce((sum, o) => sum + (o.people_count || 1), 0) || 0;
  const requested = Number(peopleCount) || 1;

  if (currentReserved + requested > capacity) {
    return NextResponse.json({ error: '선택하신 일정의 잔여석이 부족합니다.' }, { status: 400 });
  }

  const payload = {
    name: String(name).trim(),
    phone: String(phone).trim(),
    schedule: String(schedule).trim(),
    agreed: Boolean(agreed),
    people_count: requested,
    total_amount: Number(totalAmount) || 0,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Failed to save order', error);
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 });
  }

  // Fire notifications without blocking the response
  notifyNewOrder({
    id: data.id,
    name: data.name,
    phone: data.phone,
    schedule: data.schedule,
  }).catch((notifyError) => console.error('Notification failed', notifyError));

  return NextResponse.json({ order: data }, { status: 201 });
}
