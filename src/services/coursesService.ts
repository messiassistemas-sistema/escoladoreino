import { supabase } from "@/integrations/supabase/client";

export interface Course {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    thumbnail_url: string | null;
    active: boolean | null;
    created_at: string;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    enrolled_at: string;
    completed_at: string | null;
}

export interface CourseWithStatus extends Course {
    isLocked: boolean;
}

export const coursesService = {
    async getAvailableCourses(userId: string): Promise<CourseWithStatus[]> {
        // 1. Buscar todas as matrículas do aluno
        const { data: enrollments, error: enrollError } = await supabase
            .from("enrollments")
            .select("*")
            .eq("user_id", userId);

        if (enrollError) throw enrollError;

        // 2. Verificar se o aluno tem algum curso em andamento (não concluído e não pendente)
        const hasActiveCourse = enrollments.some(e => e.status === 'active' && !e.completed_at);

        // 3. Buscar todos os cursos ativos com matrículas abertas
        const { data: allCourses, error: coursesError } = await supabase
            .from("courses")
            .select("*")
            .eq("active", true)
            .order("created_at", { ascending: true });

        if (coursesError) throw coursesError;

        console.log(`[DEBUG] Cursos Ativos: ${allCourses?.length || 0}. Matrículas do Aluno: ${enrollments?.length || 0}`);

        // 4. Filtrar cursos que o aluno ainda não está matriculado (nem pendente, nem ativo)
        const enrolledCourseIds = enrollments.map(e => e.course_id);
        const nextCourses = (allCourses as Course[]).filter(c => !enrolledCourseIds.includes(c.id));

        // 5. Retornar apenas o PRÓXIMO curso na sequência
        if (nextCourses.length > 0) {
            return [{
                ...nextCourses[0],
                isLocked: hasActiveCourse // Bloqueado se houver curso ativo
            }];
        }

        return [];
    },

    async enrollInCourse(userId: string, courseId: string): Promise<Enrollment> {
        const { data, error } = await supabase
            .from("enrollments")
            .insert({
                user_id: userId,
                course_id: courseId,
                status: 'pending',
                enrolled_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as Enrollment;
    }
};
