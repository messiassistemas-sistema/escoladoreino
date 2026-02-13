
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        console.log("Request Body:", JSON.stringify(body))
        const { to, subject, html } = body

        if (!to || !subject || !html) {
            console.error("Missing parameters:", { to, subject, html: !!html })
            throw new Error("Parâmetros 'to', 'subject' e 'html' são obrigatórios.")
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        console.log("Env Check:", {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            urlPre: supabaseUrl.substring(0, 10)
        })

        // Fetch settings using raw REST API to avoid supabase-js dependency (Bundle Timeout Fix)
        const settingsRes = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=smtp_host,smtp_port,smtp_user,smtp_pass,sender_name,contact_email,resend_api_key,resend_from_email&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!settingsRes.ok) {
            const errorData = await settingsRes.json();
            throw new Error(`Failed to fetch settings from Supabase: ${errorData.message || JSON.stringify(errorData)}`);
        }

        const settingsData = await settingsRes.json();
        const settings = settingsData?.[0] || {};

        let sent = false
        let methodUsed = ""

        // SMTP Disabled in Zero-Dependency Mode (users must use Resend)
        /* 
         * SMTP library causes bundle timeout. 
         * To enable SMTP, we need a stable connection to download dependencies.
         */

        // 2. Try Resend
        const resendApiKey = settings.resend_api_key || Deno.env.get('RESEND_API_KEY');
        const resendFromEmail = settings.resend_from_email || Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

        if (!sent && resendApiKey) {
            console.log("Tentando enviar via Resend API...")
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                    from: `${settings.sender_name || "Escola do Reino"} <${resendFromEmail}>`,
                    to: [to],
                    subject: subject,
                    html: html,
                }),
            })

            const resData = await res.json()
            if (res.ok) {
                sent = true
                methodUsed = "Resend"
                console.log("E-mail enviado via Resend com sucesso.")
            } else {
                console.error("Erro no Resend:", resData)
                throw new Error(`Resend Error: ${resData.message || JSON.stringify(resData)}`)
            }
        }

        if (!sent) {
            throw new Error("SMTP indisponível no momento. Configure o Resend API Key para enviar e-mails.")
        }

        return new Response(
            JSON.stringify({ success: true, method: methodUsed }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error("Send Email Error Details:", error)

        // Return 200 even on error so client can parse the JSON body with the error message
        // instead of throwing a generic "non-2xx status code" exception.
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Erro desconhecido ao processar envio.",
                details: error.stack
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
