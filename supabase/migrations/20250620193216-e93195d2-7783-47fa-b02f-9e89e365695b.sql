
-- Create a storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true);

-- Create the documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" 
  ON public.documents 
  FOR SELECT 
  USING (user_id = '12345678-1234-1234-1234-123456789012'::uuid);

CREATE POLICY "Users can insert their own documents" 
  ON public.documents 
  FOR INSERT 
  WITH CHECK (user_id = '12345678-1234-1234-1234-123456789012'::uuid);

CREATE POLICY "Users can update their own documents" 
  ON public.documents 
  FOR UPDATE 
  USING (user_id = '12345678-1234-1234-1234-123456789012'::uuid);

CREATE POLICY "Users can delete their own documents" 
  ON public.documents 
  FOR DELETE 
  USING (user_id = '12345678-1234-1234-1234-123456789012'::uuid);

-- Create storage policies for the documents bucket
CREATE POLICY "Allow public access to documents bucket" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'documents');

CREATE POLICY "Allow uploads to documents bucket" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow updates to documents bucket" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'documents');

CREATE POLICY "Allow deletes from documents bucket" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'documents');
