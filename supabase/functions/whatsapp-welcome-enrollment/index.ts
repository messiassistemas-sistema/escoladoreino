
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

        const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
        const instanceToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
        const securityToken = Deno.env.get("ZAPI_SECURITY_TOKEN");

        if (!instanceId || !instanceToken) {
            throw new Error("Z-API credentials missing in environment variables.");
        }

        const courseName = record.class_name || "Formação Teológica";
        const welcomeMessage = `Olá *${record.name}*! 👋 Que alegria receber sua inscrição na **Escola do Reino**! 📖\n\nSua pré-matrícula para o curso *${courseName}* foi realizada com sucesso. Percebemos que você está na fase de pagamento. ✅\n\n*O que acontece agora?*\nAssim que o pagamento for confirmado pelo sistema, eu enviarei por aqui mesmo (e por e-mail) seus dados de acesso exclusivos ao nosso Portal do Aluno.\n\nSeja muito bem-vindo(a) à nossa jornada de formação teológica! Deus abençoe seu chamado. 🙏`;

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
