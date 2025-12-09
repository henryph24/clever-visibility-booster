import { ga4Service } from '@/lib/analytics/ga4';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // brandId
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/${state}?analytics_error=${encodeURIComponent(error)}`,
          process.env.NEXTAUTH_URL!
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/dashboard?analytics_error=missing_params`, process.env.NEXTAUTH_URL!)
      );
    }

    const brandId = state;

    // Exchange code for tokens
    const credentials = await ga4Service.exchangeCode(code);

    // Store temporary credentials in a secure cookie for property selection
    const cookieStore = await cookies();
    cookieStore.set(
      'ga4_temp_credentials',
      JSON.stringify({
        brandId,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt.toISOString(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 600, // 10 minutes
        path: '/',
      }
    );

    // Redirect to property selection page
    return NextResponse.redirect(
      new URL(`/dashboard/${brandId}/analytics/setup`, process.env.NEXTAUTH_URL!)
    );
  } catch (error) {
    console.error('OAuth callback failed:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?analytics_error=oauth_failed`, process.env.NEXTAUTH_URL!)
    );
  }
}
