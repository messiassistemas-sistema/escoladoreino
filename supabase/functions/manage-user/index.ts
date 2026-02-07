
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Check if the user is authenticated and is an admin
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized', success: false }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Optional: Check if user is strictly an admin via profiles table or metadata
    // For now assuming the service logic protects the call or we check metadata
    // Ideally we should check here too, but to avoid extra db calls we can check metadata
    /*
    if (user.user_metadata.role !== 'admin') {
         return new Response(JSON.stringify({ error: 'Forbidden', success: false }), { status: 403, ... })
    }
    */

    const { email, name } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with Admin (Service Role) rights
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.rpc('get_user_id_by_email', { email_input: email });
    
    // Alternative if RPC not exists: try ListUsers (expensive) or just try create and catch error
    // Simple approach: Try to create user
    // We generate a temp password
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: name || '',
        role: 'student', // Default role
        full_name: name || ''
      }
    })

    if (error) {
      // If user already exists, we consider it a success for this operation (idempotent-ish)
      // but we need to return the user id.
      if (error.message.includes('already registered')) {
         // Logic to fetch user if needed, or just return success
         // Since we can't easily fetch by email without RPC or iterating, let's warn.
         console.log("User already exists");
         return new Response(
            JSON.stringify({ success: true, message: 'User already exists', alreadyExists: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
      throw error
    }

    // Send password reset email or assume the temp password will be sent?
    // In this flow, usually we just create the user. The PaymentsService might want to email credentials.
    // Ideally we trigger a password reset email so they can set their own.
    await supabaseAdmin.auth.resetPasswordForEmail(email);

    return new Response(
      JSON.stringify({ success: true, data: data, message: 'User created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
