import { supabase } from "@/integrations/supabase/client";

export interface Teacher {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    bio: string | null;
    status: 'ativo' | 'inativo';
    created_at?: string;
    updated_at?: string;
}

export const teachersService = {
    async getTeachers(): Promise<Teacher[]> {
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            console.error("Erro ao buscar professores:", error);
            throw error;
        }

        return data as Teacher[];
    },

    async createTeacher(teacher: Omit<Teacher, "id" | "created_at" | "updated_at">): Promise<Teacher> {
        const { data, error } = await supabase
            .from("teachers")
            .insert(teacher)
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar professor:", error);
            throw error;
        }

        return data as Teacher;
    },

    async updateTeacher(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
        const { data, error } = await supabase
            .from("teachers")
            .update({
                ...teacher,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar professor:", error);
            throw error;
        }

        return data as Teacher;
    },

    async deleteTeacher(id: string): Promise<void> {
        const { error } = await supabase
            .from("teachers")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir professor:", error);
            throw error;
        }
    },

    async deactivateTeacher(id: string): Promise<void> {
        const { error } = await supabase
            .from("teachers")
            .update({ status: 'inativo' })
            .eq("id", id);

        if (error) {
            console.error("Erro ao desativar professor:", error);
            throw error;
        }
    },
};
