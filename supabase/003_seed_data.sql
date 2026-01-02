-- =============================================
-- THE JAR - Seed Data for Testing
-- Version: 1.0
-- =============================================
-- NOTE: This file creates sample data for testing.
-- Only run this in development environments!

-- You'll need to replace these UUIDs with actual user IDs
-- after users sign up, or create test users first.

-- For testing, you can:
-- 1. Sign up some users through the app
-- 2. Get their IDs from the profiles table
-- 3. Update the UUIDs below
-- 4. Run this script

-- Example: After signing up, run this query to get user IDs:
-- SELECT id, full_name FROM profiles;

-- =============================================
-- SAMPLE ROCKS
-- =============================================
-- Uncomment and update user IDs to seed sample data:

/*
-- Replace 'YOUR_USER_ID' with actual UUIDs from your profiles table

INSERT INTO rocks (title, owner_id, perfect_outcome, worst_outcome, status, progress, swarm_day) VALUES
(
  'Build Wi-Fi 7 Lab',
  'YOUR_USER_ID',
  'Lab operational by Q4. 100% equipment sourced. 5 engineers trained on new protocols.',
  'Delays in chip sourcing push launch to Q1. Budget overrun >10%. Team confused on standards.',
  'Active',
  45,
  'tuesday'
),
(
  'Refine Core API v2',
  'YOUR_USER_ID',
  'Response times reduced by 40%. Documentation coverage hits 95%. Key client integration succeeds.',
  'Breaking changes force version rollback. Key client integration fails. Coverage below 80%.',
  'Active',
  78,
  'friday'
),
(
  'Mobile Sync Engine',
  'YOUR_USER_ID',
  'Offline-first architecture implemented. Conflict resolution handles 99% cases auto. Battery impact <5%/hr.',
  'Data corruption on edge cases. Sync loop drains battery >15%/hr. User complaints spike.',
  'Active',
  12,
  'monday'
),
(
  'Server Fleet Upgrade',
  'YOUR_USER_ID',
  '30 new rack units installed. Cooling efficiency up by 15%. Zero service disruption.',
  'Supply chain holds 50% of inventory. Installation disrupts live services. Cooling fails.',
  'Active',
  92,
  'wednesday'
);

-- =============================================
-- SAMPLE ENGAGEMENTS
-- =============================================

INSERT INTO engagements (user_id, customer_name, internal_req_id, domains, oems, themes, is_strategic_signal, signal_context, estimated_effort, priority, status, revenue_amt, next_steps) VALUES
(
  'YOUR_USER_ID',
  'Acme Corp',
  '4092',
  ARRAY['Wi-Fi', 'Security'],
  ARRAY['Cisco'],
  ARRAY['efficiency', 'automation'],
  true,
  'Customer highlighting critical gap in Wi-Fi 7 support. Multiple competitors already offering.',
  8,
  'High',
  'Active',
  150000,
  'Schedule technical deep-dive with their IT team'
),
(
  'YOUR_USER_ID',
  'StartUp Inc',
  '4093',
  ARRAY['Cloud', 'SD-WAN'],
  ARRAY['Aruba'],
  ARRAY['scalability'],
  false,
  NULL,
  4,
  'Medium',
  'Lead',
  75000,
  'Send pricing proposal by Friday'
),
(
  'YOUR_USER_ID',
  'Global Dynamics',
  '4094',
  ARRAY['Data Center', 'Security'],
  ARRAY['Palo Alto'],
  ARRAY['compliance', 'modernization'],
  true,
  'Contract renewal discussion - they are considering competitive bids.',
  12,
  'High',
  'Active',
  500000,
  'Executive meeting scheduled for next week'
),
(
  'YOUR_USER_ID',
  'Internet Eye',
  '4095',
  ARRAY['IoT', 'Cloud'],
  ARRAY['Meraki'],
  ARRAY['automation'],
  false,
  NULL,
  2,
  'Low',
  'Lead',
  25000,
  'Follow up on demo request'
),
(
  'YOUR_USER_ID',
  'Ventures LLC',
  '4096',
  ARRAY['Collaboration', 'Cloud'],
  ARRAY['Cisco'],
  ARRAY['remote-work'],
  false,
  NULL,
  6,
  'Medium',
  'Active',
  100000,
  'Inbound query regarding API access integration'
);

-- =============================================
-- SAMPLE COMMITMENTS
-- =============================================
-- These will be for the current week
-- Update dates as needed

INSERT INTO commitments (user_id, date, type, description, hours_value, completed) VALUES
(
  'YOUR_USER_ID',
  CURRENT_DATE,
  'Rock',
  'Q4 Strategy Deck',
  4,
  false
),
(
  'YOUR_USER_ID',
  CURRENT_DATE,
  'Pebble',
  'UI Design System',
  2,
  false
),
(
  'YOUR_USER_ID',
  CURRENT_DATE + INTERVAL '1 day',
  'Pebble',
  'Eng Sync',
  2,
  false
),
(
  'YOUR_USER_ID',
  CURRENT_DATE + INTERVAL '2 days',
  'Sand',
  '5 Demo calls',
  2.5,
  false
),
(
  'YOUR_USER_ID',
  CURRENT_DATE + INTERVAL '2 days',
  'Pebble',
  'Hotfix Deploy',
  2,
  false
),
(
  'YOUR_USER_ID',
  CURRENT_DATE + INTERVAL '3 days',
  'Rock',
  'User Testing',
  4,
  false
),
(
  'YOUR_USER_ID',
  CURRENT_DATE + INTERVAL '4 days',
  'Sand',
  'Wrap up (3)',
  1.5,
  false
);

-- =============================================
-- SAMPLE SWARM (BEACON)
-- =============================================
-- Light a beacon for today

INSERT INTO swarms (rock_id, swarm_date, active, description)
SELECT
  id,
  CURRENT_DATE,
  true,
  'Focus time for Wi-Fi 7 Lab setup'
FROM rocks
WHERE title = 'Build Wi-Fi 7 Lab'
LIMIT 1;

*/

-- =============================================
-- HELPFUL QUERIES FOR TESTING
-- =============================================

-- View all users:
-- SELECT id, full_name, role, capacity_hours FROM profiles;

-- View all rocks with owners:
-- SELECT r.*, p.full_name as owner_name
-- FROM rocks r
-- JOIN profiles p ON r.owner_id = p.id;

-- View strategic signals:
-- SELECT customer_name, domains, signal_context
-- FROM engagements
-- WHERE is_strategic_signal = true;

-- View this week's commitments:
-- SELECT c.*, p.full_name
-- FROM commitments c
-- JOIN profiles p ON c.user_id = p.id
-- WHERE c.date >= date_trunc('week', CURRENT_DATE)
-- AND c.date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days';

-- Check capacity utilization:
-- SELECT
--   p.full_name,
--   p.capacity_hours,
--   p.capacity_hours * 0.8 as real_capacity,
--   SUM(c.hours_value) as weekly_load,
--   ROUND((SUM(c.hours_value) / (p.capacity_hours * 0.8)) * 100) as utilization_pct
-- FROM profiles p
-- LEFT JOIN commitments c ON c.user_id = p.id
--   AND c.date >= date_trunc('week', CURRENT_DATE)
--   AND c.date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
-- GROUP BY p.id, p.full_name, p.capacity_hours;
