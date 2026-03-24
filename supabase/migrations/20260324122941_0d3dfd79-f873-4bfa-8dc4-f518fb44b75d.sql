UPDATE outreach_leads 
SET lead_status = 'disqualified', 
    notes = COALESCE(notes, '') || ' [auto-disqualified: email bounced]'
WHERE id IN (
  SELECT DISTINCT lead_id FROM outreach_messages WHERE message_status = 'bounced'
);