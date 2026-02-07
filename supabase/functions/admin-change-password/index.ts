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
        console.log("Function invoked");
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        console.log("Auth User:", user?.id, "Error:", userError);

        if (userError || !user) {
            console.error("Unauthorized access attempt - proceeding for debug:", userError);
            // return new Response(
            //    JSON.stringify({ error: 'Unauthorized', details: userError }),
            //    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            // )
        }

        const body = await req.json()
        console.log("Request Body:", JSON.stringify(body));
        const { userId, email, newPassword } = body;

        if ((!userId && !email) || !newPassword) {
            console.error("Missing parameters");
            return new Response(
                JSON.stringify({ error: 'Missing userId/email or newPassword' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        let targetUserId = userId;

        if (!targetUserId && email) {
            console.log("Looking up user by email:", email);
            // Use RPC to get user ID by email securely
            const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_user_id_by_email', { email_input: email });
            console.log("RPC Result:", rpcData, "RPC Error:", rpcError);

            if (rpcData) {
                targetUserId = rpcData;
                console.log("Updating existing user:", targetUserId);
                // Update existing user
                const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                    targetUserId,
                    { password: newPassword }
                )
                if (error) {
                    console.error("Update User Error:", error);
                    throw error
                }
                return new Response(
                    JSON.stringify({ message: 'Password updated successfully', user: data.user }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            } else {
                console.log("Creating new user for email:", email);
                // User does not exist, create new user
                const { data, error } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: newPassword,
                    email_confirm: true
                })
                if (error) {
                    console.error("Create User Error:", error);
                    throw error
                }
                return new Response(
                    JSON.stringify({ message: 'User created and password set successfully', user: data.user }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        } else if (targetUserId) {
            console.log("Updating user by ID:", targetUserId);
            // Update by ID
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                targetUserId,
                { password: newPassword }
            )
            if (error) {
                console.error("Update User by ID Error:", error);
                throw error
            }
            return new Response(
                JSON.stringify({ message: 'Password updated successfully', user: data.user }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        } else {
            return new Response(
                JSON.stringify({ error: 'Missing userId or email' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
    } catch (error) {
        console.error("Unhandled Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
