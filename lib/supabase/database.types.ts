/**
 * Database Types
 *
 * These types match your Supabase database schema.
 * Keep them in sync when you modify the database.
 *
 * Pro tip: You can auto-generate these with:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
 */

export type UserRole = 'owner' | 'admin' | 'user';

export type Profile = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  user_role: UserRole;
  points: number;
  created_at: string;
  updated_at: string;
};

/**
 * Helper type for inserting a new profile (most fields optional/auto-generated)
 */
export type ProfileInsert = {
  id: string;
  email: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  user_role?: UserRole;
  points?: number;
};

/**
 * Helper type for updating a profile (all fields optional)
 */
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;
