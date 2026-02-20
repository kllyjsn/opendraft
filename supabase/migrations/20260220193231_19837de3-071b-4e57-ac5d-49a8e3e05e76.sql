
-- Make listing_id nullable so conversations can exist without a listing (direct messages)
ALTER TABLE public.conversations ALTER COLUMN listing_id DROP NOT NULL;

-- Drop the old unique constraint that requires listing_id
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_listing_id_buyer_id_key;

-- Create a unique index for listing-based conversations (when listing_id is not null)
CREATE UNIQUE INDEX conversations_listing_buyer_unique 
  ON public.conversations (listing_id, buyer_id) 
  WHERE listing_id IS NOT NULL;

-- Create a unique index for direct messages (when listing_id is null)
-- Ensures only one DM thread between two users (using least/greatest to normalize direction)
CREATE UNIQUE INDEX conversations_dm_unique 
  ON public.conversations (LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id)) 
  WHERE listing_id IS NULL;
