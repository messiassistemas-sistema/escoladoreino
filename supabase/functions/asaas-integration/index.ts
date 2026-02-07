
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3'; // SANDBOX

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

        // Check if the user is authenticated
        // Auth check removed to allow public Registration/Payment
        // const { data: { user } } = await supabaseClient.auth.getUser()
        // if (!user) return new Response(...)

        const { action, ...payload } = await req.json()
        const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

        if (!asaasApiKey) {
            throw new Error('ASAAS_API_KEY not configured on server.')
        }

        const asaasHeaders = {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey
        }

        let result;

        if (action === 'create_customer') {
            // payload: name, email, cpfCnpj, mobilePhone, externalReference
            const response = await fetch(`${ASAAS_API_URL}/customers`, {
                method: 'POST',
                headers: asaasHeaders,
                body: JSON.stringify(payload)
            });
            result = await response.json();

            if (!response.ok) throw new Error(result.errors?.[0]?.description || 'Error creating customer');

        }
        else if (action === 'create_payment') {
            // payload: customer (id), billingType (PIX, BOLETO, CREDIT_CARD), value, dueDate
            const response = await fetch(`${ASAAS_API_URL}/payments`, {
                method: 'POST',
                headers: asaasHeaders,
                body: JSON.stringify(payload)
            });
            result = await response.json();

            if (!response.ok) throw new Error(result.errors?.[0]?.description || 'Error creating payment');
        }
        else if (action === 'get_payment_status') {
            // payload: id
            const response = await fetch(`${ASAAS_API_URL}/payments/${payload.id}`, {
                method: 'GET',
                headers: asaasHeaders
            });
            result = await response.json();
        }
        else {
            throw new Error(`Unknown action: ${action}`);
        }

        return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error("Asaas Integration Error:", error);
        return new Response(
            JSON.stringify({ error: error.message, success: false }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
