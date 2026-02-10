import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type LessonRow = Database['public']['Tables']['lessons']['Row'];

export interface Lesson extends Omit<LessonRow, 'mode' | 'status'> {
    mode: 'presencial' | 'online'; // Enforcing strict types for app logic
    status: 'agendada' | 'realizada' | 'cancelada';

    // Join data
    subject?: {
        name: string;
    };
}

export const lessonsService = {
    async getLessons(): Promise<Lesson[]> {
        const { data, error } = await supabase
            .from("lessons")
            .select(`
                *,
                subject:subjects (name)
            `)
            .order("date", { ascending: true });

        if (error) {
            console.error("Erro ao buscar aulas:", error);
            throw error;
        }

        return data as any as Lesson[];
    },

    async createLesson(lesson: Omit<Lesson, "id" | "created_at" | "updated_at" | "subject">): Promise<Lesson> {
        const { data, error } = await supabase
            .from("lessons")
            .insert(lesson)
            .select("*")
            .single();

        if (error) {
            console.error("Erro ao agendar aula:", error);
            throw error;
        }

        return data as any as Lesson;
    },

    async updateLesson(id: string, lesson: Partial<Lesson>): Promise<Lesson> {
        const { data, error } = await supabase
            .from("lessons")
            .update({
                ...lesson,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            console.error("Erro ao atualizar aula:", error);
            throw error;
        }

        return data as any as Lesson;
    },

    async deleteLesson(id: string): Promise<void> {
        const { error } = await supabase
            .from("lessons")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir aula:", error);
            throw error;
        }
    },

    async getStudentAttendance(studentId: string) {
        const { data, error } = await supabase
            .from("attendance_records")
            .select(`
                *,
                lesson:lessons (
                    *,
                    subject:subjects (name)
                )
            `)
            .eq("student_id", studentId);

        if (error) {
            console.error("Erro ao buscar presença:", error);
            throw error;
        }

        return data;
    },

    async markAttendance(records: { student_id: string; lesson_id: string; status: 'present' | 'absent'; date: string }[]) {
        const { data, error } = await supabase
            .from("attendance_records")
            .upsert(records, { onConflict: 'student_id, lesson_id' })
            .select();

        if (error) {
            console.error("Erro ao realizar chamada:", error);
            throw error;
        }

        return data;
    },
};
