import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Handle notification actions (accept/decline) from service worker.
 * POST /api/push-notifications/action
 * Body: { notifId, action: "accepted" | "declined" }
 */
export async function POST(request: NextRequest) {
  try {
    const { notifId, action } = await request.json();

    if (!notifId || !['accepted', 'declined'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notifId or action' },
        { status: 400 }
      );
    }

    // Update notification status
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ status: action })
      .eq('id', notifId);

    if (error) {
      console.error('Action update error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, action });
  } catch (error: any) {
    console.error('Notification action error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
