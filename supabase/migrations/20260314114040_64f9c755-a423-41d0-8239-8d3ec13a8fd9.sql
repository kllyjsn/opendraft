
-- HOME & KITCHEN: Currently 5, need 5 more (FlavorVerse, PalatePlay, QuickBite, BrewOrder, TableReady, BoltSpace, TasteTrove)
UPDATE public.listings SET staff_pick = true, staff_pick_category = 'home-kitchen'
WHERE id IN (
  'caab468c-75df-4c3f-a64e-ea1346506379',
  '096b0f19-1815-4cce-93a0-48b84e5ebb23',
  '9d79ef8f-1a8d-48a7-8b95-dc84b83141de',
  '83361835-8afc-480b-b92f-38739c1e4747',
  '91298475-c846-44be-9cdf-e71ad6bd091a'
);

-- HEALTH & FITNESS: Currently 3, need 7 more (CardioSense, ZenMind duplicate, Pulseer, FluxZen-yoga, VibeApp meditation, PulseUp)
UPDATE public.listings SET staff_pick = true, staff_pick_category = 'health-fitness'
WHERE id IN (
  'c46ffa0a-1592-48e0-ab83-6697404d9670',
  '9db20167-ef52-456f-8cb9-eab54f68a0c8',
  '9d35536d-e890-4cb6-a946-2d277eb6578c',
  'e7f198d2-b3d4-4c36-b02a-642c93d2bb87',
  '7bbac1a8-0c30-4415-8e05-306398e9c3ab',
  'ea7051c5-d291-449a-bf8d-782a889c5611',
  '58e899c1-67aa-4bb1-a6e6-3f65d4096004'
);

-- PERSONAL FINANCE: Currently 3, need 7 more (BoltMind, Cryptly x2, VaultBank, PulseLy tax)
UPDATE public.listings SET staff_pick = true, staff_pick_category = 'personal-finance'
WHERE id IN (
  '7e0ec0aa-58cf-4b82-8eee-0c21b2459002',
  'fe90e9ff-c78f-419a-8b55-cb843949d9da',
  '256eaf05-70b6-490d-baf9-bb46412cf878',
  '5eb58705-4fe2-4fce-bb20-d37325e75b88',
  'cc8c5eb3-bfec-4db1-a8f8-c411bc94fb3b',
  '7d862eeb-d2a5-4e1d-9df6-267d0816a95f',
  '0bfd2581-5576-432c-bb3d-461e55af2a97'
);

-- PRODUCTIVITY: Currently 4, need 6 more (HazeSpace, DashDesk, CoreBoard, BloomBoard, SyncSync, DashWire)
UPDATE public.listings SET staff_pick = true, staff_pick_category = 'productivity'
WHERE id IN (
  'fb061185-7917-428b-8508-1a493a000eea',
  'c40dd3bb-2cdd-41df-a2f6-7664b3f429b7',
  '14c42454-6a8d-4247-b321-43ec9cb29975',
  'd958a53b-a66f-4896-8cd6-4c9df84f8472',
  '72dd5be2-c16a-476d-97ea-bd650b191f4a',
  'fdf18352-bebd-4ce1-ae17-d51fcaa8630f'
);
