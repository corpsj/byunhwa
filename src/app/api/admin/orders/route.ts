import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const schedule = searchParams.get('schedule');

  let query = supabaseServer.from('orders').select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (schedule) {
    query = query.eq('schedule', schedule);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch orders', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  const orders = data || [];

  const statusCounts = orders.reduce(
    (acc, order) => {
      const key = order.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const scheduleCounts = orders.reduce(
    (acc, order) => {
      const key = order.schedule || 'unspecified';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    orders,
    summary: {
      total: orders.length,
      statusCounts,
      scheduleCounts,
    },
  });
}
