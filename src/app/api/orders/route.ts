import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { notifyNewOrder } from '@/lib/notifications';

type ConfigSchedule = string | { time?: string; capacity?: number };

export async function POST(req: NextRequest) {
  const { name, phone, schedule, agreed, peopleCount, totalAmount, productType } = await req.json();

  if (!name || !phone || !schedule || agreed !== true) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate productType
  const validProductTypes = ['tree', 'wreath'];
  const normalizedProductType = productType && validProductTypes.includes(productType) ? productType : 'tree';

  const supabase = getSupabaseServer();

  // Check capacity
  // 1. Get current capacity for this schedule and email settings
  const { data: configData } = await supabase
    .from('form_config')
    .select('schedules, email_notification_enabled, admin_email')
    .limit(1)
    .single();

  let capacity = 100;
  if (configData?.schedules) {
    const schedules: ConfigSchedule[] = Array.isArray(configData.schedules) ? configData.schedules : [];
    const scheduleConfig = schedules.find((entry) => {
      if (typeof entry === 'string') return entry === schedule;
      return typeof entry === 'object' && entry !== null && entry.time === schedule;
    });
    if (scheduleConfig && typeof scheduleConfig === 'object' && scheduleConfig !== null) {
      const parsedCapacity = typeof scheduleConfig.capacity === 'number'
        ? scheduleConfig.capacity
        : Number(scheduleConfig.capacity);
      capacity = parsedCapacity || 100;
    }
  }

  // 2. Get current reserved count (only confirmed orders)
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('people_count')
    .eq('schedule', schedule)
    .eq('status', 'confirmed');

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
    product_type: normalizedProductType,
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

  // Prepare email config
  const emailConfig = {
    enabled: configData?.email_notification_enabled ?? false,
    adminEmail: configData?.admin_email || '',
  };

  // Fire notifications without blocking the response
  notifyNewOrder({
    id: data.id,
    name: data.name,
    phone: data.phone,
    schedule: data.schedule,
    people_count: data.people_count,
    total_amount: data.total_amount,
    product_type: data.product_type,
  }, emailConfig).catch((notifyError) => console.error('Notification failed', notifyError));

  return NextResponse.json({ order: data }, { status: 201 });
}
