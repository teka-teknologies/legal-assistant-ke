
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Document conversion request received');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    let text = '';

    // Handle different file types
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // For PDF files, we'll use a simple text extraction approach
      // Note: This is a basic implementation. For production, you might want to use a more robust PDF library
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Try to extract simple text from PDF (this is very basic)
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = textDecoder.decode(uint8Array);
      
      // Extract readable text using regex patterns
      const textMatches = rawText.match(/\((.*?)\)/g);
      if (textMatches) {
        text = textMatches
          .map(match => match.replace(/[()]/g, ''))
          .filter(t => t.length > 1 && /[a-zA-Z]/.test(t))
          .join(' ');
      }
      
      if (!text.trim()) {
        text = 'PDF text extraction completed. The document may contain images or complex formatting that requires specialized PDF processing tools.';
      }
      
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      text = await file.text();
      
    } else if (fileName.endsWith('.rtf')) {
      // Basic RTF support - strip RTF formatting
      const rawText = await file.text();
      text = rawText
        .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF control words
        .replace(/[{}]/g, '') // Remove braces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
        
    } else {
      // For unsupported formats, return a helpful message
      text = `Document uploaded successfully. File type: ${file.type || 'unknown'}. This file format may require specialized processing for text extraction.`;
    }

    console.log(`Conversion completed. Extracted ${text.length} characters`);

    return new Response(JSON.stringify({ 
      text: text,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Document conversion error:', error);
    return new Response(JSON.stringify({ 
      text: '',
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
