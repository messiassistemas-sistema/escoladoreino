import { supabase } from "@/integrations/supabase/client";

export interface Student {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    registration_number: string | null;
    class_name: string | null;
    status: 'ativo' | 'pendente' | 'formado' | 'inativo';
    attendance_rate: number;
    average_grade: number;
    modality: 'presencial' | 'online';
    created_at?: string;
    updated_at?: string;
    credentials_sent_at?: string | null;
}

export const studentsService = {
    async getStudents(): Promise<Student[]> {
        const { data, error } = await supabase
            .from("students")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            console.error("Erro ao buscar alunos:", error);
            throw error;
        }

        return data as Student[];
    },



    async createStudent(student: Omit<Student, "id" | "created_at" | "updated_at">): Promise<Student> {
        let registrationNumber = student.registration_number;

        if (!registrationNumber) {
            registrationNumber = await studentsService.generateRegistrationNumber();
        }

        const { data: newStudent, error } = await supabase
            .from("students")
            .insert({ ...student, registration_number: registrationNumber })
            .select()
            .single();

        if (error) {
            console.error("Erro ao cadastrar aluno:", error);
            throw error;
        }

        // Create initial pending payment
        try {
            // Get default amount from settings or use placeholder
            const { data: settings } = await supabase
                .from("system_settings")
                .select("enrollment_value")
                .single();

            const amount = settings?.enrollment_value || 0;

            await supabase.from("payments").insert({
                student_name: newStudent.name,
                student_email: newStudent.email || "", // Email is key linking
                amount: amount,
                status: 'pending',
                installments: '1x',
                class_name: newStudent.class_name || 'Nova Matrícula',
                payment_method: 'manual',
                created_at: new Date().toISOString()
            });

        } catch (paymentError) {
            console.error("Warning: Failed to create initial payment record", paymentError);
            // Don't generate error for user, as student was created
        }

        return newStudent as Student;
    },

    async generateRegistrationNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const { data, error } = await supabase
            .from("students")
            .select("registration_number")
            .ilike("registration_number", `${year}%`)
            .order("registration_number", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') { // Ignore no rows found error if any, though maybeSingle handles it
            console.error("Erro ao gerar matrícula:", error);
        }

        const lastNumber = data?.registration_number;
        let sequence = 1;

        if (lastNumber && lastNumber.length >= 8) {
            const lastSequence = parseInt(lastNumber.slice(4));
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }

        return `${year}${sequence.toString().padStart(4, "0")}`;
    },

    async updateStudent(id: string, student: Partial<Student>): Promise<Student> {
        const { data, error } = await supabase
            .from("students")
            .update({
                ...student,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select();

        if (error) {
            console.error("Erro ao atualizar aluno:", error);
            throw error;
        }

        return (data && data.length > 0 ? data[0] : student) as Student;
    },

    async deleteStudent(id: string): Promise<void> {
        const { error } = await supabase
            .from("students")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir aluno:", error);
            throw error;
        }
    },

    async approveStudent(id: string, resend: boolean = false): Promise<void> {
        console.log("Approving/Resending student via Edge Function:", id, resend);
        const { data, error } = await supabase.functions.invoke("approve-student", {
            body: { student_id: id, resend }
        });

        if (error) {
            console.error("Erro na função approve-student:", error);
            throw error;
        }

        if (data && !data.success) {
            console.error("Erro retornado pela função:", data.error);
            throw new Error(data.error || "Erro ao aprovar aluno");
        }

        console.log("Student process result:", data);
    },
    async getStudentByEmail(email: string): Promise<Student | null> {
        const { data, error } = await supabase
            .from("students")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            console.error("Erro ao buscar aluno por email:", error);
            throw error;
        }

        return data as Student | null;
    },

    async getStudentGrades(studentId: string) {
        const { data, error } = await supabase
            .from("student_grades")
            .select(`
                *,
                assessment:assessments (
                    *,
                    subject:subjects (name, teacher_name)
                )
            `)
            .eq("student_id", studentId);

        if (error) {
            console.error("Erro ao buscar notas:", error);
            throw error;
        }

        return data;
    },

    async resetStudentPassword(email: string): Promise<string> {
        // Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase(); // e.g., "x2l3k4jA9"

        const { data, error } = await supabase.functions.invoke("admin-change-password", {
            body: { email, newPassword: tempPassword }
        });

        if (error) {
            console.error("Functions invoke error:", error);
            throw new Error(`Erro ao redefinir senha: ${error.message}`);
        }

        if (data && data.error) {
            throw new Error(data.error);
        }

        return tempPassword;
    }
};
