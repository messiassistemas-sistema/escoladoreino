import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            console.error("Auth error:", userError);
            return new Response(
                JSON.stringify({ success: false, error: `Unauthorized: ${userError?.message || 'User not found'}` }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { email, password, fullName, role, phone } = await req.json()

        if (!email || !password || !fullName || !role) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Create Auth User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                name: fullName,
                role: role,
                phone: phone
            }
        })

        if (createError) throw createError

        // 2. Create Profile (or update if trigger created it)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                email: email,
                full_name: fullName,
                role: role,
                phone: phone,
                updated_at: new Date().toISOString()
            })

        if (profileError) {
            console.error("Profile creation error:", profileError);
            throw profileError;
        }

        return new Response(
            JSON.stringify({ success: true, message: 'User created successfully', user: newUser.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'An error occurred' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
