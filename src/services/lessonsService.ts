import { supabase } from "@/integrations/supabase/client";

export interface Lesson {
    id: string;
    subject_id: string;
    teacher_name?: string;
    class_name?: string;
    date: string;
    time: string;
    location: string | null;
    mode: 'presencial' | 'online';
    status: 'agendada' | 'realizada' | 'cancelada';
    created_at?: string;
    updated_at?: string;
    // Join data
    subject?: {
        name: string;
    };
    recording_link?: string;
    release_for_presencial?: boolean;
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
