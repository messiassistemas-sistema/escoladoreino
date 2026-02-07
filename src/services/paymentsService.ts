import { supabase } from "@/integrations/supabase/client";

export interface Payment {
    id: string;
    student_name: string;
    student_email: string;
    amount: number;
    installments: string;
    class_name: string;
    status: 'approved' | 'pending' | 'rejected' | 'cancelled';
    created_at: string;
    payment_provider: string;
    external_reference?: string;
    payment_method?: string;
    last_updated_at?: string;
}

export const paymentsService = {
    async getPayments(): Promise<Payment[]> {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar pagamentos:", error);
            // Return empty array if table doesn't exist yet to avoid crash
            if (error.code === 'PGRST116' || error.message.includes('relation "payments" does not exist')) {
                return [];
            }
            throw error;
        }

        return data as Payment[];
    },

    async getStats() {
        const { data: payments = [] } = await supabase
            .from("payments")
            .select("amount, status");

        const approved = payments.filter(p => p.status === 'approved');
        const pending = payments.filter(p => p.status === 'pending');
        const rejected = payments.filter(p => p.status === 'rejected');

        return {
            totalApproved: approved.reduce((acc, p) => acc + (p.amount || 0), 0),
            totalPending: pending.reduce((acc, p) => acc + (p.amount || 0), 0),
            countApproved: approved.length,
            countRejected: rejected.length
        };
    },

    async approvePayment(id: string, studentEmail: string, studentName: string): Promise<void> {
        // 1. Create Auth User & Send Email (Edge Function)
        const { data: fnData, error: fnError } = await supabase.functions.invoke("manage-user", {
            body: { email: studentEmail, name: studentName }
        });

        if (fnError) {
            console.error("Functions invoke error:", fnError);
            throw new Error(`Erro ao gerar credenciais: ${fnError.message}`);
        }

        if (fnData && !fnData.success) {
            throw new Error(fnData.error || "Falha ao criar usuário de acesso.");
        }

        // 2. Update Payment Status
        const { error: paymentError } = await supabase
            .from("payments")
            .update({ status: 'approved', last_updated_at: new Date().toISOString() })
            .eq("id", id);

        if (paymentError) throw paymentError;

        // 3. Activate Student
        const { error: studentError } = await supabase
            .from("students")
            .update({ status: 'ativo' })
            .eq("email", studentEmail);

        if (studentError) {
            console.error("Error activating student:", studentError);
            throw studentError;
        }
    },

    async deletePayment(id: string): Promise<void> {
        const { error } = await supabase
            .from("payments")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    async deletePayments(ids: string[]): Promise<void> {
        const { error } = await supabase
            .from("payments")
            .delete()
            .in("id", ids);

        if (error) throw error;
    }
};
