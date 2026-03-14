-- Reset all staff picks
UPDATE public.listings
SET staff_pick = false, staff_pick_category = NULL
WHERE staff_pick = true;

-- Re-curate staff picks with diversity: mix sellers, require file + screenshot
-- Jason Kelley picks (6): best across categories
UPDATE public.listings SET staff_pick = true WHERE id IN (
  'd99010f8-6f6d-4796-9eb6-e78d8fed4162', -- MesaBase (game, prod_ready, 7 sales)
  '4006c20d-db35-4aee-97bc-80327929ec07', -- Cook Better (saas, prod_ready, 46 views)
  '76e09538-2529-48b7-8478-739bb6169e8f', -- LinguaGPT (ai_app, prod_ready)
  'bb8b064b-a1f7-42b8-aad2-58387ca7885e', -- Distill Press (saas, prod_ready)
  '0bfd2581-5576-432c-bb3d-461e55af2a97', -- Book Portfolio (utility, prod_ready)
  'cb923ff6-2d1a-444c-a48c-a86402cb20a6'  -- WealthFlow (saas, prod_ready)
);

-- Jack Reis picks (6): top performers
UPDATE public.listings SET staff_pick = true WHERE id IN (
  '6b8b44dd-92a8-4101-a091-c85718e3a5de', -- UmberTrack (game, prod_ready, 7 sales)
  '4ce971ec-7f7f-4a77-adf0-a46060f68673', -- Quillize (other, prod_ready, 6 sales)
  'c75f2954-8299-4711-948b-75073253fb5f', -- LinkIO (other, prod_ready, 6 sales)
  'bb1252b4-ec99-46d2-b03e-8803c9375219', -- DriftUp (other, prod_ready, 6 sales)
  '0c113337-aa55-4733-814c-ba1b43ab755f', -- LinkForge (other, mvp, 7 sales)
  'a53ec14a-775d-4c4f-8d59-142e1a5ce734'  -- CastSpace (game, mvp, 6 sales)
);