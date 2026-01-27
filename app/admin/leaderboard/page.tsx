import { createClient } from '@/lib/supabase/server';
import { LeaderboardChart } from '@/components/LeaderboardChart';

/**
 * Extracts the first name from a full name string.
 * "João Silva" → "João"
 * "Maria" → "Maria"
 * null → null
 */
function getFirstName(fullName: string | null): string | null {
  if (!fullName) return null;
  return fullName.split(' ')[0];
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Fetch only admins and owners with points > 0
  // These are the people who can contribute jobs
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, points')
    .in('user_role', ['admin', 'owner'])
    .gt('points', 0)
    .order('points', { ascending: false });

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return (
      <div className='container mx-auto py-8'>
        <p className='text-red-500'>Failed to load leaderboard</p>
      </div>
    );
  }

  // Transform to chart-friendly format with first names only
  const leaderboardData = (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: getFirstName(profile.full_name) || profile.username || 'Anonymous',
    points: profile.points,
  }));

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='max-w-2xl mx-auto'>
        <LeaderboardChart data={leaderboardData} />
      </div>
    </div>
  );
}
