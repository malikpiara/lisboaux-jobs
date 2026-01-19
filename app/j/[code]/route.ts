import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const supabase = createServerSupabaseClient();

  const { data: job, error } = await supabase
    .from('jobs')
    .select('url')
    .eq('short_code', code)
    .single();

  if (error || !job) {
    redirect('/');
  }

  // Append UTM parameter to the destination URL
  const destinationUrl = new URL(job.url);
  destinationUrl.searchParams.set('utm_source', 'LisboaUX');

  redirect(destinationUrl.toString());
}
