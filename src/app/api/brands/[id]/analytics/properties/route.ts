import { createClient } from '@/lib/supabase/server';
import { ga4Service } from '@/lib/analytics/ga4';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: brandId } = await params;

    // Check brand ownership
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get temp credentials from cookie
    const cookieStore = await cookies();
    const tempCredsCookie = cookieStore.get('ga4_temp_credentials');

    if (!tempCredsCookie) {
      return NextResponse.json(
        { error: 'No pending OAuth flow. Please initiate connection first.' },
        { status: 400 }
      );
    }

    const tempCreds = JSON.parse(tempCredsCookie.value);

    if (tempCreds.brandId !== brandId) {
      return NextResponse.json({ error: 'Brand ID mismatch' }, { status: 400 });
    }

    // List available GA4 properties
    const properties = await ga4Service.listProperties(tempCreds.accessToken);

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Failed to list properties:', error);
    return NextResponse.json({ error: 'Failed to list properties' }, { status: 500 });
  }
}
