import { supabase } from "@/integrations/supabase/client";

export interface Subject {
    id: string;
    name: string;
    description: string | null;
    workload: number;
    teacher_name: string | null;
    status: 'ativa' | 'inativa';
    created_at?: string;
    updated_at?: string;
}

export const subjectsService = {
    async getSubjects(): Promise<Subject[]> {
        const { data, error } = await supabase
            .from("subjects")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            console.error("Erro ao buscar disciplinas:", error);
            throw error;
        }

        return data as Subject[];
    },

    async createSubject(subject: Omit<Subject, "id" | "created_at" | "updated_at">): Promise<Subject> {
        const { data, error } = await supabase
            .from("subjects")
            .insert(subject)
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar disciplina:", error);
            throw error;
        }

        return data as Subject;
    },

    async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
        const { data, error } = await supabase
            .from("subjects")
            .update({
                ...subject,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar disciplina:", error);
            throw error;
        }

        return data as Subject;
    },

    async deactivateSubject(id: string): Promise<void> {
        const { error } = await supabase
            .from("subjects")
            .update({ status: 'inativa' })
            .eq("id", id);

        if (error) {
            console.error("Erro ao desativar disciplina:", error);
            throw error;
        }
    },

    async deleteSubject(id: string): Promise<void> {
        const { error } = await supabase
            .from("subjects")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir disciplina:", error);
            throw error;
        }
    },
};
