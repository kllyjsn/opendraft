INSERT INTO outreach_campaigns (name, niche, industries, target_regions, status, goals, services)
VALUES (
  'Agency Outreach - Q2 2026',
  'Digital agencies managing 10+ client websites',
  ARRAY['Digital Marketing Agency', 'Web Design Agency', 'SEO Agency', 'Creative Agency', 'Branding Agency'],
  ARRAY['United States', 'United Kingdom', 'Canada', 'Australia'],
  'active',
  '{"target_accounts": 50, "target_demos": 10, "monthly_revenue_goal": 8000}'::jsonb,
  '[{"name": "Agency Plan", "description": "Unlimited white-label apps for $99/mo", "price_range": "$99/mo"}, {"name": "Enterprise Plan", "description": "API + SLA + dedicated account manager for $199/mo", "price_range": "$199/mo"}]'::jsonb
);