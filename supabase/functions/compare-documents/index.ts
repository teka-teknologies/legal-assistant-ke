
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the request body
    const { user_prompt } = await req.json()

    if (!user_prompt) {
      return new Response(
        JSON.stringify({ error: 'user_prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Proxying request to n8n webhook with prompt:', user_prompt)

    // Make the request to your n8n webhook
    const n8nResponse = await fetch('https://lawassistant1.app.n8n.cloud/webhook/495857e9-b881-4d4d-8060-53cfa8c92822', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_prompt: user_prompt,
      }),
    })

    if (!n8nResponse.ok) {
      console.error('N8N webhook failed:', n8nResponse.status, n8nResponse.statusText)
      throw new Error(`N8N webhook failed: ${n8nResponse.status}`)
    }

    const result = await n8nResponse.json()
    console.log('N8N webhook response received successfully')

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in compare-documents function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
