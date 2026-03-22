UPDATE public.outreach_leads 
SET lead_status = 'disqualified',
    notes = COALESCE(notes, '') || ' [Auto-cleaned: AI-generated fake lead]'
WHERE source = 'ai_discovery' 
   OR (source = 'firecrawl_discovery' AND contact_email IS NULL);

UPDATE public.outreach_messages 
SET message_status = 'failed',
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{failure_reason}', '"fake_lead_cleanup"')
WHERE message_status = 'bounced';