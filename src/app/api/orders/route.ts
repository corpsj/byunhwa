import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { notifyNewOrder } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const { name, phone, schedule, agreed } = await req.json();

  if (!name || !phone || !schedule || agreed !== true) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const payload = {
    name: String(name).trim(),
    phone: String(phone).trim(),
    schedule: String(schedule).trim(),
    agreed: Boolean(agreed),
    status: 'pending',
  };

  const supabase = getSupabaseServer();

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
