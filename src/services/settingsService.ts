import { supabase } from "@/integrations/supabase/client";

export interface SystemSettings {
    id: string;
    school_name: string;
    cnpj: string | null;
    school_description: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    min_grade: number;
    min_attendance: number;
    payment_provider: string;
    payment_api_key: string | null;
    enrollment_value: number;
    max_installments: number;
    cash_discount: boolean;
    email_notif: boolean;
    portal_notif: boolean;
    lesson_reminder: boolean;
    grade_notif: boolean;
    admin_2fa: boolean;
    qr_validity: number;
    audit_logs: boolean;
    smtp_host: string | null;
    smtp_port: number;
    smtp_user: string | null;
    smtp_pass: string | null;
    sender_name: string | null;
    logo_url: string | null;
    whatsapp_welcome_message: string | null;
    absences_alert_threshold: number;
    absences_fail_threshold: number;
    class_start_time: string;
    check_in_deadline_time: string;
    secretary_phone: string | null;
    attendance_msg_daily_late: string;
    attendance_msg_alert: string;
    attendance_msg_fail: string;
    updated_at: string;
}

// User Management Interface
export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'secretary' | 'teacher' | 'treasurer' | 'student';
    created_at: string;
}


export const settingsService = {
    // ... existing methods ...
    async getSettings(): Promise<SystemSettings> {
        const { data, error } = await supabase
            .from("system_settings")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Erro ao buscar configurações:", error);
            throw error;
        }

        // Return defaults if no data found
        if (!data) {
            return {
                id: "",
                school_name: "Escola do Reino",
                cnpj: null,
                school_description: null,
                contact_email: "contato@escoladoreino.site",
                contact_phone: "(11) 99999-9999",
                address: "Rua da Esperança, 123, Centro, Cidade - UF",
                min_grade: 7,
                min_attendance: 75,
                payment_provider: "mercadopago",
                payment_api_key: null,
                enrollment_value: 100,
                max_installments: 12,
                cash_discount: false,
                email_notif: true,
                portal_notif: true,
                lesson_reminder: true,
                grade_notif: true,
                admin_2fa: false,
                qr_validity: 15,
                audit_logs: true,
                smtp_host: null,
                smtp_port: 587,
                smtp_user: null,
                smtp_pass: null,
                sender_name: null,
                logo_url: null,
                whatsapp_welcome_message: "Olá {nome}, que bom que sua matrícula foi feita na Escola do Reino! Em breve entraremos em contato.",
                absences_alert_threshold: 2,
                absences_fail_threshold: 3,
                class_start_time: "19:30",
                check_in_deadline_time: "20:15",
                secretary_phone: null,
                attendance_msg_daily_late: "Oi {nome}! 📚 Sentimos sua falta hoje. A aula começou às {horario}. Está tudo bem?",
                attendance_msg_alert: "Oi {nome}! Você tem {faltas} faltas em {disciplina}. Precisa de assiduidade para ser aprovado!",
                attendance_msg_fail: "⚠️ ALERTA CRÍTICO: {nome} atingiu {faltas} faltas na disciplina {disciplina} e está REPROVADO.",
                updated_at: new Date().toISOString()
            } as SystemSettings;
        }

        return data as SystemSettings;
    },

    async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
        // Remove ID from payload to avoid PK conflict
        const { id, ...updateData } = settings;

        // Ensure we really have only one settings record
        const { data: current } = await supabase
            .from("system_settings")
            .select("id")
            .limit(1)
            .maybeSingle();

        if (!current) {
            // Se não existir, criamos o primeiro registro
            const { data, error } = await supabase
                .from("system_settings")
                .insert({
                    ...updateData,
                    school_name: updateData.school_name || "Escola do Reino", // Default values
                    min_grade: updateData.min_grade || 7,
                    min_attendance: updateData.min_attendance || 75,
                    enrollment_value: updateData.enrollment_value || 100,
                    max_installments: updateData.max_installments || 12,
                    absences_alert_threshold: updateData.absences_alert_threshold || 2,
                    absences_fail_threshold: updateData.absences_fail_threshold || 3,
                    class_start_time: updateData.class_start_time || "19:30",
                    check_in_deadline_time: updateData.check_in_deadline_time || "20:15",
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error("Erro ao criar configurações:", error);
                throw error;
            }

            return data as SystemSettings;
        }

        const { data, error } = await supabase
            .from("system_settings")
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq("id", current.id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar configurações:", error);
            console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
            throw error;
        }

        return data as SystemSettings;
    },



    // User Management Methods
    async getUsers(): Promise<UserProfile[]> {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .neq('role', 'student') // Exclude students from admin management list if desired
            .order("full_name");

        if (error) {
            console.error("Erro ao buscar usuários:", error);
            throw error;
        }
        return data as UserProfile[];
    },

    async createUser(user: { email: string; fullName: string; role: string }): Promise<{ password: string }> {
        // Generate a random temp password
        const tempPassword = Math.random().toString(36).slice(-8) + "A1!";

        const { data, error } = await supabase.functions.invoke("create-admin-user", {
            body: { ...user, password: tempPassword }
        });

        if (error) throw new Error(`Erro na função: ${error.message}`);
        if (data?.error) throw new Error(data.error);

        // Optionally send email with credentials (try-catch to avoid blocking if SMTP is not configured)
        try {
            await this.sendEmail(
                user.email,
                "Acesso ao Sistema - Escola do Reino",
                `
                    <h1>Bem-vindo(a) à Equipe!</h1>
                    <p>Olá ${user.fullName},</p>
                    <p>Sua conta de acesso foi criada com sucesso.</p>
                    <p><strong>Cargo:</strong> ${user.role.toUpperCase()}</p>
                    <p><strong>E-mail:</strong> ${user.email}</p>
                    <p><strong>Senha Temporária:</strong> ${tempPassword}</p>
                    <br/>
                    <p>Acesse o sistema e troque sua senha assim que possível.</p>
                `
            );
        } catch (emailError) {
            console.warn("Erro ao enviar e-mail de boas-vindas (SMTP pode não estar configurado):", emailError);
            // Non-blocking error
        }

        return { password: tempPassword };
    },

    async resetUserPassword(userId: string, email: string, customPassword?: string): Promise<{ password: string }> {
        const newPassword = customPassword || Math.random().toString(36).slice(-8) + "A1!";

        const { data, error } = await supabase.functions.invoke("admin-change-password", {
            body: { userId, email, newPassword }
        });

        if (error) throw new Error(`Erro na função: ${error.message}`);
        if (data?.error) throw new Error(data.error);

        // Send email with new credentials (try-catch)
        try {
            await this.sendEmail(
                email,
                "Redefinição de Senha - Escola do Reino",
                `
                    <h1>Nova Senha Gerada</h1>
                    <p>Sua senha foi redefinida pelo administrador.</p>
                    <p><strong>Nova Senha:</strong> ${newPassword}</p>
                    <br/>
                    <p>Acesse o sistema e troque sua senha assim que possível.</p>
                `
            );
        } catch (emailError) {
            console.warn("Erro ao enviar e-mail de redefinição (SMTP pode não estar configurado):", emailError);
            // Non-blocking error
        }

        return { password: newPassword };
    },

    // ... existing email methods ...
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        const { data, error } = await supabase.functions.invoke("send-email", {
            body: { to, subject, html }
        });

        if (error) {
            console.error("Functions invoke error:", error);
            throw new Error(`Erro de conexão: ${error.message}`);
        }

        if (data && data.error) {
            throw new Error(data.error);
        }
    },

    async sendTestEmail(to: string): Promise<void> {
        return this.sendEmail(
            to,
            "Teste de Configuração de E-mail - Escola do Reino",
            `
                <h1>Teste de E-mail</h1>
                <p>Olá,</p>
                <p>Este é um e-mail de teste para validar as configurações SMTP do sistema <strong>Escola do Reino</strong>.</p>
                <p>Se você recebeu esta mensagem, significa que o envio está funcionando corretamente! ✅</p>
                <br/>
                <p>Atenciosamente,</p>
                <p>Equipe de TI</p>
            `
        );
    },
    async updateUser(userId: string, data: { fullName: string; role: string }): Promise<void> {
        // Atualiza metadados do Auth via Edge Function
        const { error: fnError } = await supabase.functions.invoke("admin-update-user", {
            body: { userId, ...data }
        });

        if (fnError) throw new Error(`Erro na função: ${fnError.message}`);

        // Também atualiza a tabela pública profiles, se necessário (depende da arquitetura de sincronização)
        // Por via das dúvidas, atualizamos a tabela perfil que é o que a lista exibe
        const { error: dbError } = await supabase
            .from("profiles")
            .update({ full_name: data.fullName, role: data.role })
            .eq("id", userId);

        if (dbError) throw dbError;
    },

    async deleteUser(userId: string): Promise<void> {
        // Deleta do Auth via Edge Function
        const { error: fnError } = await supabase.functions.invoke("admin-delete-user", {
            body: { userId }
        });

        if (fnError) throw new Error(`Erro na função: ${fnError.message}`);

        // A tabela profiles deve ser limpa via CASCADE no banco ou trigger, mas se não tiver,
        // o Auth delete geralmente remove do auth.users. 
        // Se `profiles` tem FK com `auth.users` e `ON DELETE CASCADE`, ele some sozinho.
    }
};
