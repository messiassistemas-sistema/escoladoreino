
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApproveRequest {
    student_id: string;
    resend?: boolean; // Optional flag to force resending credentials
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Init Supabase Clients
        // Client for verifying the caller (Admin)
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        // check if user is admin
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            throw new Error("Unauthorized: Caller must be logged in.");
        }

        // You might want to check for specific 'admin' role metadata here if your app uses it
        // const isMember = user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'member'; 
        // if (!isMember) throw new Error("Unauthorized: Only admins can approve students.");

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
                student_id: student.id
            }
        });

        let isNewUser = true;
        let authUserId = newUser?.user?.id;

        if (createError) {
            // If user exists
            if (createError.message?.includes("already registered") || createError.status === 422) {
                isNewUser = false;
                console.log("User already exists.");

                if (resend) {
                    console.log("Resend requested. Finding user ID and resetting password...");
                    // Locate user ID via RPC
                    const { data: existingUserId, error: rpcError } = await supabaseAdmin.rpc('get_user_id_by_email', { email: student.email });

                    if (rpcError || !existingUserId) {
                        // Fallback: If RPC fails (e.g. not migrated), we can't reset safely without ID.
                        console.warn("Could not find user ID via RPC to reset password.", rpcError);
                        // We will proceed without resetting password, just resending email saying "Use existing creds" 
                        // UNLESS we want to throw error. But better to be graceful.
                    } else {
                        authUserId = existingUserId;
                        // Reset password
                        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                            authUserId,
                            { password: tempPassword }
                        );
                        if (updateError) {
                            console.error("Failed to reset password:", updateError);
                            throw updateError;
                        }
                        console.log("Password reset successfully.");
                        // Treat as if we generated a new password (because we did)
                        isNewUser = true; // Effectively new credentials for the user
                    }
                }
            } else {
                throw createError;
            }
        }

        // 6. Send Email (Resend)
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        let emailSent = false;

        if (resendApiKey) {
            const emailBody = isNewUser
                ? `
                    <h1>Credenciais de Acesso - Escola do Reino</h1>
                    <p>Olá <strong>${student.name}</strong>,</p>
                    <p>${resend ? "Conforme solicitado, aqui estão suas novas credenciais de acesso:" : "Sua matrícula foi aprovada com sucesso! Aqui estão seus dados de acesso:"}</p>
                    <ul>
                        <li><strong>Login:</strong> ${student.email}</li>
                        <li><strong>Senha:</strong> ${tempPassword}</li>
                    </ul>
                    <p>Recomendamos que altere sua senha após o primeiro acesso.</p>
                    <p>Acesse o portal aqui: <a href="https://escola-do-reino.vercel.app/login">Portal do Aluno</a></p>
                `
                : `
                    <h1>Acesso ao Portal do Aluno</h1>
                    <p>Olá <strong>${student.name}</strong>,</p>
                    <p>Sua matrícula está ativa.</p>
                    <p>Você já possui um cadastro. Acesse o portal com seu email e senha habituais.</p>
                    <p>Se esqueceu sua senha, utilize a opção "Esqueci minha senha" na tela de login.</p>
                    <p>Acesse aqui: <a href="https://escola-do-reino.vercel.app/login">Portal do Aluno</a></p>
                `;

            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                    from: "Escola do Reino <nao-responda@escoladoreino.com.br>",
                    to: [student.email],
                    subject: resend ? "Novas Credenciais de Acesso - Escola do Reino" : "Acesso ao Portal do Aluno - Escola do Reino",
                    html: emailBody,
                }),
            });
            const emailResult = await res.json();
            console.log("Email sent result:", emailResult);
            if (res.ok) emailSent = true;
        } else {
            console.log("RESEND_API_KEY not set, skipping email.");
        }

        // 7. Send WhatsApp (Z-API)
        const rawPhone = student.phone || "";
        let cleanPhone = rawPhone.replace(/\D/g, "");
        let whatsappSent = false;

        if (cleanPhone && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
            cleanPhone = "55" + cleanPhone;

            const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
            const instanceToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
            const securityToken = Deno.env.get("ZAPI_SECURITY_TOKEN");

            if (instanceId && instanceToken) {
                const whatsappMessage = isNewUser
                    ? `Olá *${student.name}*! 👋\n\n${resend ? "Aqui estão suas novas credenciais de acesso:" : "Sua matrícula na *Escola do Reino* foi aprovada! ✅\n\nAqui estão seus dados de acesso ao portal:"}\n\n📧 *Login:* ${student.email}\n🔑 *Senha:* ${tempPassword}\n\n🔗 Acesse em: https://escola-do-reino.vercel.app/login`
                    : `Olá *${student.name}*! 👋\n\nSua matrícula está ativa! ✅\n\nComo você já possui cadastro, pode acessar o portal com seu login e senha atuais.\n\n🔗 Acesse em: https://escola-do-reino.vercel.app/login`;

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

        // 8. Update Student Status & Credentials Timestamp
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
