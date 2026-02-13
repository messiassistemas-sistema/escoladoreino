
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
    type: 'INSERT';
    table: string;
    record: {
        id: string;
        name: string;
        phone: string | null;
        class_name: string | null;
        status: string;
    };
    schema: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: WebhookPayload = await req.json();
        const { record } = payload;

        if (!record || record.status !== 'pendente') {
            return new Response(JSON.stringify({ success: true, message: "Non-pending or empty record ignored." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const rawPhone = record.phone || "";
        let cleanPhone = rawPhone.replace(/\D/g, "");

        if (!cleanPhone || (cleanPhone.length !== 10 && cleanPhone.length !== 11)) {
            console.log(`Skipping WhatsApp: Invalid phone number format (${rawPhone})`);
            return new Response(JSON.stringify({ success: false, error: "Invalid phone number" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        cleanPhone = "55" + cleanPhone;

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
        const instanceToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
        const securityToken = Deno.env.get("ZAPI_SECURITY_TOKEN");

        if (!instanceId || !instanceToken) {
            throw new Error("Z-API credentials missing in environment variables.");
        }

        // Fetch custom message from settings
        const { data: settings } = await supabaseAdmin
            .from('system_settings')
            .select('msg_enrollment_whatsapp')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const courseName = record.class_name || "Formação Teológica";
        const firstName = record.name ? record.name.split(' ')[0] : "Aluno";
        let welcomeMessage = settings?.msg_enrollment_whatsapp || `Olá *{nome}*! 👋 Que alegria receber sua inscrição na **Escola do Reino**! 📖\n\nSua pré-matrícula para o curso *{curso}* foi realizada com sucesso. Percebemos que você está na fase de pagamento. ✅\n\n*O que acontece agora?*\nAssim que o pagamento for confirmado pelo sistema, eu enviarei por aqui mesmo (e por e-mail) seus dados de acesso exclusivos ao nosso Portal do Aluno.\n\nSeja muito bem-vindo(a) à nossa jornada de formação teológica! Deus abençoe seu chamado. 🙏`;

        // Replace variables
        welcomeMessage = welcomeMessage
            .replace(/{nome}/g, firstName)
            .replace(/{curso}/g, courseName);

        const zaUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;
        const zaHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (securityToken) zaHeaders["Client-Token"] = securityToken;

        const response = await fetch(zaUrl, {
            method: "POST",
            headers: zaHeaders,
            body: JSON.stringify({ phone: cleanPhone, message: welcomeMessage })
        });

        const result = await response.json();
        console.log(`WhatsApp sent for ${record.name}:`, result);

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error in whatsapp-welcome-enrollment:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
