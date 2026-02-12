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
        // 1. Find Student by Email
        // We need the student ID to call the correct Edge Function
        const student = await import("./studentsService").then(m => m.studentsService.getStudentByEmail(studentEmail));

        if (!student) {
            throw new Error(`Aluno não encontrado com o email: ${studentEmail}`);
        }

        // 2. Call Approve Student Function (Handles credentials & notifications)
        await import("./studentsService").then(m => m.studentsService.approveStudent(student.id));

        // 3. Update Payment Status locally
        const { error: paymentError } = await supabase
            .from("payments")
            .update({ status: 'approved', last_updated_at: new Date().toISOString() })
            .eq("id", id);

        if (paymentError) throw paymentError;

        // Note: The Edge Function 'approve-student' already updates the student status to 'ativo',
        // so we don't strictly need to do it here again, but we could for redundancy.
        // For now, trusting the Edge Function.
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
