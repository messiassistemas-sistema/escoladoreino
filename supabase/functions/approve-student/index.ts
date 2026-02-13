
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApproveRequest {
    student_id: string;
    resend?: boolean; // Optional flag to force resending credentials
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Init Supabase Clients
        const authHeader = req.headers.get("Authorization");
        console.log("Auth header present:", !!authHeader ? "Yes (masked: " + authHeader.substring(0, 15) + "...)" : "No");

        // Client for verifying the caller (Admin)
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        // check if user is admin OR if it is a S2S call (Server to Server)
        const s2sKey = req.headers.get("X-S2S-Api-Key");
        const internalKey = Deno.env.get("INTERNAL_WEBHOOK_TOKEN");
        const isS2S = internalKey && s2sKey === internalKey;

        if (!isS2S) {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                console.error("Authentication failed:", authError?.message || "User not found");
                return new Response(
                    JSON.stringify({ success: false, error: "Unauthorized: Caller must be logged in.", details: authError }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            console.log("Authenticated user:", user.email);
        } else {
            console.log("Authenticated via S2S Token (Webhook/Internal)");
        }

        // Admin Client for performing privileged actions (creating users, updating db)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 2. Parse Request
        const { student_id, resend } = await req.json() as ApproveRequest;
        if (!student_id) throw new Error("Missing student_id");

        // 3. Fetch Student Data
        const { data: student, error: fetchError } = await supabaseAdmin
            .from("students")
            .select("*")
            .eq("id", student_id)
            .single();

        if (fetchError || !student) {
            throw new Error(`Student not found: ${fetchError?.message}`);
        }

        if (!student.email) {
            throw new Error("Student has no email address.");
        }

        console.log(`Processing student: ${student.name} (${student.email}) - Resend: ${resend}`);

        // 4. Generate Temporary Password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + "!";

        // 5. Create or Update Auth User
        // Try to create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: student.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: student.name,
                role: 'student',
                student_id: student.id,
                must_change_password: true
            }
        });

        let isNewUser = true;
        let authUserId = newUser?.user?.id;

        if (createError) {
            // If user exists
            if (createError.message?.includes("already registered") || createError.status === 422) {
                isNewUser = false;
                console.log("User already exists. Finding user ID to force password reset...");

                // Locate user ID via RPC
                const { data: existingUserId, error: rpcError } = await supabaseAdmin.rpc('get_user_id_by_email', { email: student.email });

                if (rpcError || !existingUserId) {
                    console.warn("Could not find user ID via RPC. User might not get new credentials.", rpcError);
                    // If we can't find the ID, we can't reset. We keep isNewUser = false
                    // and the message will say "use habitual credentials".
                } else {
                    authUserId = existingUserId;
                    // Force Reset password and ensure metadata is correct
                    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                        authUserId,
                        {
                            password: tempPassword,
                            user_metadata: {
                                full_name: student.name,
                                role: 'student',
                                student_id: student.id
                            }
                        }
                    );

                    if (updateError) {
                        console.error("Failed to reset password:", updateError);
                        throw updateError;
                    }

                    console.log("Password force-reset successfully.");
                    // Treat as new user for messaging purposes
                    isNewUser = true;
                }
            } else {
                throw createError;
            }
        }

        const firstName = student.name ? student.name.split(' ')[0] : "Aluno";

        // 6. Fetch custom templates from settings
        const { data: settings } = await supabaseAdmin
            .from('system_settings')
            .select('msg_payment_confirmed_email_new, msg_payment_confirmed_email_returning, msg_payment_confirmed_whatsapp_new, msg_payment_confirmed_whatsapp_returning')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 7. Send Email (via centralized send-email function)
        let emailSent = false;
        try {
            let emailBody = "";
            let emailSubject = resend ? "Novas Credenciais de Acesso - Escola do Reino" : "Acesso ao Portal do Aluno - Escola do Reino";

            if (isNewUser) {
                const template = settings?.msg_payment_confirmed_email_new || `
                    <h1>Credenciais de Acesso - Escola do Reino</h1>
                    <p>Olá <strong>{nome}</strong>,</p>
                    <p>Sua matrícula foi aprovada com sucesso! Aqui estão seus dados de acesso:</p>
                    <ul>
                        <li><strong>Login:</strong> {email}</li>
                        <li><strong>Senha:</strong> {senha}</li>
                    </ul>
                    <p>Recomendamos que altere sua senha após o primeiro acesso.</p>
                    <p>Acesse o portal aqui: <a href="https://escoladoreino.site/login">Portal do Aluno</a></p>
                `;
                emailBody = template
                    .replace(/{nome}/g, firstName)
                    .replace(/{email}/g, student.email)
                    .replace(/{senha}/g, tempPassword);
            } else {
                const template = settings?.msg_payment_confirmed_email_returning || `
                    <h1>Acesso ao Portal do Aluno</h1>
                    <p>Olá <strong>{nome}</strong>,</p>
                    <p>Sua matrícula está ativa.</p>
                    <p>Você já possui um cadastro. Acesse o portal com seu email e senha habituais.</p>
                    <p>Acesse aqui: <a href="https://escoladoreino.site/login">Portal do Aluno</a></p>
                `;
                emailBody = template
                    .replace(/{nome}/g, firstName);
            }

            console.log(`Invoking send-email function for ${student.email}...`);
            const { data: sendEmailResult, error: sendEmailError } = await supabaseAdmin.functions.invoke("send-email", {
                body: { to: student.email, subject: emailSubject, html: emailBody }
            });

            if (sendEmailError || (sendEmailResult && sendEmailResult.success === false)) {
                console.error("Failed to send email via send-email function:", sendEmailError || sendEmailResult?.error);
            } else {
                console.log("Email sent successfully via send-email function.");
                emailSent = true;
            }
        } catch (err) {
            console.error("Critical error in email flow:", err);
        }

        // 8. Send WhatsApp (Z-API)
        const rawPhone = student.phone || "";
        let cleanPhone = rawPhone.replace(/\D/g, "");
        let whatsappSent = false;

        if (cleanPhone && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
            cleanPhone = "55" + cleanPhone;

            const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
            const instanceToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
            const securityToken = Deno.env.get("ZAPI_SECURITY_TOKEN");

            if (instanceId && instanceToken) {
                let whatsappMessage = "";
                if (isNewUser) {
                    whatsappMessage = settings?.msg_payment_confirmed_whatsapp_new || `Olá *{nome}*! 👋\n\nSua matrícula na *Escola do Reino* foi aprovada! ✅\n\nAqui estão seus dados de acesso ao portal:\n\n📧 *Login:* {email}\n🔑 *Senha:* {senha}\n\n🔗 Acesse em: https://escoladoreino.site/login`;
                } else {
                    whatsappMessage = settings?.msg_payment_confirmed_whatsapp_returning || `Olá *{nome}*! 👋\n\nSua matrícula está ativa! ✅\n\nComo você já possui cadastro, pode acessar o portal com seu login e senha atuais.\n\n🔗 Acesse em: https://escoladoreino.site/login`;
                }

                // Replace variables in WhatsApp
                whatsappMessage = whatsappMessage
                    .replace(/{nome}/g, firstName)
                    .replace(/{email}/g, student.email)
                    .replace(/{senha}/g, tempPassword);

                try {
                    const zaUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;
                    const zaHeaders: Record<string, string> = { "Content-Type": "application/json" };
                    if (securityToken) zaHeaders["Client-Token"] = securityToken;

                    await fetch(zaUrl, {
                        method: "POST",
                        headers: zaHeaders,
                        body: JSON.stringify({ phone: cleanPhone, message: whatsappMessage })
                    });
                    console.log("WhatsApp message sent.");
                    whatsappSent = true;
                } catch (err) {
                    console.error("Failed to send WhatsApp:", err);
                }
            }
        }

        // 9. Update Student Status & Credentials Timestamp
        const updates: any = { status: 'ativo' };
        if (emailSent || whatsappSent) {
            updates.credentials_sent_at = new Date().toISOString();
        }

        const { error: updateError } = await supabaseAdmin
            .from("students")
            .update(updates)
            .eq("id", student_id);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({ success: true, message: "Student processed.", emailSent, whatsappSent, isNewUser }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error approving/resending credentials:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
