import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled'];

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { status } = await req.json();
  const resolvedParams = await Promise.resolve(context.params);
  const { id } = resolvedParams || {};

  if (!id || !status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update order status', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const resolvedParams = await Promise.resolve(context.params);
  const { id } = resolvedParams || {};

  if (!id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { error } = await supabase.from('orders').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete order', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
