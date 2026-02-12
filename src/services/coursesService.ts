import { supabase } from "@/integrations/supabase/client";
import { landingService } from "./landingService";

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

        // 3. Buscar os cursos do landing_page_content (JSON)
        const landingContent = await landingService.getContent();
        const allCourses = (landingContent.courses_data || []).map((c, index) => ({
            id: c.title.toLowerCase().replace(/\s+/g, '-'), // ID gerado a partir do título para o JSON
            title: c.title,
            description: c.description,
            price: c.price || 35,
            thumbnail_url: null,
            active: c.available !== false,
            created_at: new Date().toISOString()
        }));

        const activeCourses = allCourses.filter(c => c.active);

        console.log(`[DEBUG] Cursos Ativos (JSON): ${activeCourses.length}. Matrículas: ${enrollments?.length || 0}`);

        // 4. Filtrar cursos que o aluno ainda não está matriculado
        const enrolledCourseTitles = enrollments.map(e => e.course_id.toLowerCase()); // Usando ID gerado
        const nextCourses = activeCourses.filter(c => !enrolledCourseTitles.includes(c.id));

        // 5. Retornar apenas o PRÓXIMO curso na sequência
        if (nextCourses.length > 0) {
            return [{
                ...nextCourses[0],
                isLocked: hasActiveCourse
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
