-- Seed "built-for-agents" lifestyle category with top 10 agent-ready listings
-- Prioritize: has screenshot > sales > views
UPDATE public.listings
SET staff_pick = true, staff_pick_category = 'built-for-agents'
WHERE id IN (
  'c75f2954-8299-4711-948b-75073253fb5f',  -- LinkIO (screenshot, 6 sales)
  'bb1252b4-ec99-46d2-b03e-8803c9375219',  -- DriftUp (screenshot, 6 sales)
  '643e0f60-d545-48d9-82aa-4da9ed4bcb5a',  -- NovaPixel (screenshot, 4 sales)
  '7aeabcce-acb2-43af-b24c-43f26bc2d6a1',  -- EdgeSpace (7 sales, top performer)
  'dcc6cf71-9f5c-41bd-9f2d-db53bee5f485',  -- SparkBox (7 sales)
  '72dd5be2-c16a-476d-97ea-bd650b191f4a',  -- SyncSync (7 sales)
  '25a0b77e-5a7e-4d18-8261-617296e5a9de',  -- Novaify (6 sales, AI app)
  '90e3340a-d82b-47a8-95be-d48fb85f0a87',  -- HobbyHop: Agentic Micro-Community
  '78ea3875-acc4-43ad-b4fc-e2d62abf867a',  -- BioContext: Personal Health MCP Server
  '76655af0-b770-4c62-b212-712ba1e90621'   -- BridgeKey: Professional Agent MCP Toolbelt
);