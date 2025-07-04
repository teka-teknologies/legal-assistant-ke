
import { supabase } from '@/integrations/supabase/client';

// Document type
export interface Document {
  id: string;
  name: string;
  original_url: string;
  txt_url: string;
  created_at: string;
  user_id: string;
}

export { supabase };
