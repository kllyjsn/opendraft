UPDATE listings SET screenshots = ARRAY[
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/saas-1.png',
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/saas-2.png'
] WHERE category = 'saas_tool' AND (screenshots IS NULL OR screenshots = '{}' OR screenshots = ARRAY['']::text[]);

UPDATE listings SET screenshots = ARRAY[
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/ai-1.png',
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/ai-2.png'
] WHERE category = 'ai_app' AND (screenshots IS NULL OR screenshots = '{}' OR screenshots = ARRAY['']::text[]);

UPDATE listings SET screenshots = ARRAY[
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/utility-1.png',
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/saas-3.png'
] WHERE category = 'utility' AND (screenshots IS NULL OR screenshots = '{}' OR screenshots = ARRAY['']::text[]);

UPDATE listings SET screenshots = ARRAY[
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/landing-1.png',
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/ai-3.png'
] WHERE category = 'landing_page' AND (screenshots IS NULL OR screenshots = '{}' OR screenshots = ARRAY['']::text[]);

UPDATE listings SET screenshots = ARRAY[
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/game-1.png',
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/saas-1.png'
] WHERE category = 'game' AND (screenshots IS NULL OR screenshots = '{}' OR screenshots = ARRAY['']::text[]);

UPDATE listings SET screenshots = ARRAY[
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/ai-3.png',
  'https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/pool/saas-3.png'
] WHERE category = 'other' AND (screenshots IS NULL OR screenshots = '{}' OR screenshots = ARRAY['']::text[]);