import { supabase } from "@/integrations/supabase/client";

export interface Class {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    status: 'ativa' | 'concluida' | 'cancelada';
    student_count: number;
    created_at?: string;
    updated_at?: string;
}

export const classesService = {
    async getClasses(): Promise<Class[]> {
        const { data, error } = await supabase
            .from("classes")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar turmas:", error);
            throw error;
        }

        return data as Class[];
    },

    async createClass(classData: Omit<Class, "id" | "created_at" | "updated_at">): Promise<Class> {
        const { data, error } = await supabase
            .from("classes")
            .insert(classData)
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar turma:", error);
            throw error;
        }

        return data as Class;
    },

    async updateClass(id: string, classData: Partial<Class>): Promise<Class> {
        const { data, error } = await supabase
            .from("classes")
            .update({
                ...classData,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar turma:", error);
            throw error;
        }

        return data as Class;
    },

    async deleteClass(id: string): Promise<void> {
        const { error } = await supabase
            .from("classes")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir turma:", error);
            throw error;
        }
    },
};
