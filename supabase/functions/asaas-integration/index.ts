
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Production URL by default. 
// Sandbox: https://sandbox.asaas.com/api/v3
// Production: https://www.asaas.com/api/v3
const ASAAS_API_URL_PROD = 'https://www.asaas.com/api/v3';
const ASAAS_API_URL_SANDBOX = 'https://sandbox.asaas.com/api/v3';

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a service role client to fetch secure settings
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, ...payload } = await req.json()

        // Fetch API key from database settings first
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('system_settings')
            .select('payment_api_key')
            .single();

        const dbApiKey = settings?.payment_api_key;
        const envApiKey = Deno.env.get('ASAAS_API_KEY');
        const asaasApiKey = dbApiKey || envApiKey;

        if (!asaasApiKey) {
            throw new Error('ASAAS_API_KEY not configured in settings or server environment.')
        }

        // Determine environment based on API key format or explicit config
        // Sandbox keys usually start with '$' or are clearly distinct if standard Asaas convention holds. 
        // However, user stated they put a production key.
        // We will default to PROD, but check if the key looks like a sandbox key if known (often starts with '$aact_')

        const isSandbox = asaasApiKey.includes('$sandbox'); // Simple heuristic, better to default to Prod if user says so.
        const ASAAS_API_URL = isSandbox ? ASAAS_API_URL_SANDBOX : ASAAS_API_URL_PROD;

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
