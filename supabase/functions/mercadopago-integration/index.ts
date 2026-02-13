
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
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, ...payload } = await req.json()

        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('system_settings')
            .select('payment_api_key')
            .single();

        if (settingsError) throw settingsError;

        const accessToken = settings?.payment_api_key;
        if (!accessToken) throw new Error('Mercado Pago Access Token not configured.');

        // Extrair origin de forma segura
        let rawOrigin = req.headers.get('origin') || req.headers.get('referer');
        if (!rawOrigin || rawOrigin === 'null') rawOrigin = 'https://escoladoreino.site';

        // Remover trailing slash se existir
        const baseUrl = rawOrigin.replace(/\/$/, "");

        if (action === 'create_preference') {
            const mpPayload = {
                items: payload.items.map((item: any) => ({
                    title: item.title,
                    unit_price: Number(item.unit_price),
                    quantity: Number(item.quantity) || 1,
                    currency_id: 'BRL'
                })),
                back_urls: {
                    success: `${baseUrl}/status-matricula`,
                    pending: `${baseUrl}/status-matricula`,
                    failure: `${baseUrl}/matricula`
                },
                auto_return: "approved",
                external_reference: payload.external_reference,
                payer: payload.payer,
                binary_mode: true
            };

            console.log("Chamando MP com payload:", JSON.stringify(mpPayload));

            const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mpPayload)
            });

            const result = await response.json();
            console.log("Resposta MP:", JSON.stringify(result));

            if (!response.ok) {
                const errorDetail = result.message || (result.cause?.[0]?.description) || "Erro desconhecido no Mercado Pago";
                throw new Error(errorDetail);
            }

            return new Response(
                JSON.stringify({ success: true, data: result }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error(`Ação '${action}' não encontrada.`);

    } catch (error) {
        console.error("Erro na Edge Function:", error.message);
        return new Response(
            JSON.stringify({ error: error.message, success: false }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
