import { createClient } from '@/lib/supabase/server';
import { ga4Service } from '@/lib/analytics/ga4';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: brandId } = await params;
    const { propertyId } = await req.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

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

    // Save the analytics connection
    const { error: insertError } = await supabase.from('analytics_connections').insert({
      brand_id: brandId,
      provider: 'GA4',
      property_id: propertyId,
      access_token: tempCreds.accessToken,
      refresh_token: tempCreds.refreshToken,
      expires_at: new Date(tempCreds.expiresAt).toISOString(),
    });

    if (insertError) {
      console.error('Failed to save analytics connection:', insertError);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    // Clear the temp credentials cookie
    cookieStore.delete('ga4_temp_credentials');

    // Trigger initial sync
    try {
      await ga4Service.syncTrafficData(brandId);
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
      // Don't fail the request, just log it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to finalize analytics connection:', error);
    return NextResponse.json({ error: 'Failed to finalize connection' }, { status: 500 });
  }
}
