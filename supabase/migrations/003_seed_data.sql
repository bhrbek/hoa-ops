-- ============================================
-- THE JAR - Seed Data
-- Reference data for domains and OEMs
-- ============================================

-- ============================================
-- DOMAINS
-- ============================================
insert into public.domains (name, color) values
  ('Cloud', 'cloud'),
  ('Security', 'security'),
  ('Network', 'network'),
  ('Infrastructure', 'infra'),
  ('Data Center', 'default'),
  ('Collaboration', 'primary'),
  ('Wi-Fi', 'cloud'),
  ('SD-WAN', 'network'),
  ('SASE', 'security'),
  ('Observability', 'warning')
on conflict (name) do nothing;

-- ============================================
-- OEMs / VENDORS
-- ============================================
insert into public.oems (name) values
  ('Cisco'),
  ('Arista'),
  ('Palo Alto Networks'),
  ('Fortinet'),
  ('CrowdStrike'),
  ('AWS'),
  ('Microsoft Azure'),
  ('Google Cloud'),
  ('Dell'),
  ('HPE'),
  ('Juniper'),
  ('VMware'),
  ('Nutanix'),
  ('Zscaler'),
  ('Okta'),
  ('Splunk'),
  ('Datadog'),
  ('HashiCorp'),
  ('Snowflake'),
  ('Databricks')
on conflict (name) do nothing;
