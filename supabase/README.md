# Supabase Setup Instructions

## Quick Start

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Configure Environment**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run the SQL Migrations**
   - Go to your Supabase Dashboard → SQL Editor
   - Run the files in order:
     1. `001_create_tables.sql` - Creates all tables and triggers
     2. `002_create_rls_policies.sql` - Sets up Row Level Security
     3. `003_seed_data.sql` (optional) - Sample data for testing

## Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends auth.users) |
| `domains` | Domain lookup table (Wi-Fi, SD-WAN, etc.) |
| `oems` | OEM vendor lookup table |
| `engagements` | Client engagement tracking (Sensor Log) |
| `rocks` | Strategic goals |
| `swarms` | Beacon/focus day assignments |
| `commitments` | Board blocks (Rock, Pebble, Sand) |

### Key Features

- **Auto Profile Creation**: When a user signs up, a profile is automatically created
- **Updated Timestamps**: All tables with `updated_at` are auto-updated on changes
- **Row Level Security**: Users can only modify their own data
- **Realtime**: Commitments, engagements, rocks, and swarms are realtime-enabled

## Row Level Security

The RLS policies implement these rules:

| Table | Read | Create | Update | Delete |
|-------|------|--------|--------|--------|
| profiles | All users | Auto | Own only | - |
| domains | All users | Admin only | Admin only | Admin only |
| oems | All users | Admin only | Admin only | Admin only |
| engagements | All users | Own only | Own only | Own only |
| rocks | All users | Own only | Owner + Admin | Own only |
| swarms | All users | Admin + Rock owner | Admin | Admin |
| commitments | All users | Own only | Own only | Own only |

## Making a User an Admin

To grant admin privileges:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'user-uuid-here';
```

Or by email:
```sql
UPDATE profiles p
SET role = 'admin'
FROM auth.users u
WHERE p.id = u.id AND u.email = 'admin@company.com';
```

## Capacity Logic

The app uses these formulas:

- **Real Capacity** = `capacity_hours * 0.8` (20% lost to "Water"/admin)
- **Shield Active** = `weekly_load > real_capacity`
- **Day Overloaded** = `daily_hours > 8`

Block hour defaults:
- Rock: 4 hours
- Pebble: 2 hours
- Sand: 0.5 hours

## Troubleshooting

### "Permission denied" errors
- Check that RLS policies are enabled
- Verify the user is authenticated
- Check the user's role in profiles table

### Profile not created on signup
- Ensure the `handle_new_user` trigger exists
- Check the SQL Editor for errors

### Realtime not working
- Verify the table is added to `supabase_realtime` publication
- Check browser console for WebSocket errors
