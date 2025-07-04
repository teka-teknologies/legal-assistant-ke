
-- Update the documents table to include both original and converted URLs
ALTER TABLE public.documents 
ADD COLUMN original_url TEXT,
ADD COLUMN txt_url TEXT;

-- Update the name column to be more descriptive
ALTER TABLE public.documents 
ALTER COLUMN name SET DEFAULT '';

-- Since we're adding new columns, let's update existing records if any
UPDATE public.documents 
SET original_url = url, txt_url = url 
WHERE original_url IS NULL;

-- Make the new columns required after updating existing data
ALTER TABLE public.documents 
ALTER COLUMN original_url SET NOT NULL,
ALTER COLUMN txt_url SET NOT NULL;

-- Remove the old url column since we now have specific columns
ALTER TABLE public.documents 
DROP COLUMN url;
