
import { supabase } from "@/integrations/supabase/client";

export interface Assessment {
    id: string;
    subject_id: string;
    title: string;
    weight: number;
    date: string;
    created_at?: string;
}

export const assessmentsService = {
    async getAssessmentsBySubject(subjectId: string): Promise<Assessment[]> {
        const { data, error } = await supabase
            .from("assessments")
            .select("*")
            .eq("subject_id", subjectId)
            .order("date", { ascending: true });

        if (error) {
            console.error("Erro ao buscar avaliações:", error);
            throw error;
        }

        return data as Assessment[];
    },

    async createAssessment(assessment: Omit<Assessment, "id" | "created_at">): Promise<Assessment> {
        const { data, error } = await supabase
            .from("assessments")
            .insert(assessment)
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar avaliação:", error);
            throw error;
        }

        return data as Assessment;
    },

    async deleteAssessment(id: string): Promise<void> {
        const { error } = await supabase
            .from("assessments")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir avaliação:", error);
            throw error;
        }
    }
};
