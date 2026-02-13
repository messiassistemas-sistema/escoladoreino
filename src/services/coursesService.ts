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
    async getAvailableCourses(userId: string, currentCourseName?: string): Promise<CourseWithStatus[]> {
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
        const allCourses = (landingContent.courses_data || []).map((c, index) => {
            const normalizedId = c.title.toLowerCase().trim().replace(/\s+/g, '-');
            return {
                id: normalizedId,
                title: c.title.trim(),
                description: c.description,
                price: c.price || 35,
                thumbnail_url: null,
                active: c.available !== false,
                next_course_id: c.next_course_id,
                created_at: new Date().toISOString()
            };
        });

        // Helper para normalizar strings para comparação
        const normalize = (s: string) => s?.toLowerCase().trim().replace(/\s+/g, '-');

        console.log(`[DEBUG] Cursos (JSON): ${allCourses.length}. Matrículas: ${enrollments?.length || 0}. Atual: ${currentCourseName}`);

        // 4. Lógica de Sequência Especializada
        let nextCourse: any | undefined;
        const enrolledIds = enrollments.map(e => normalize(e.course_id));

        const enrolledIdsWithCurrent = [...enrolledIds];
        if (currentCourseName) {
            enrolledIdsWithCurrent.push(normalize(currentCourseName));
        }

        console.log(`[DEBUG] enrolledIds para filtro:`, enrolledIdsWithCurrent);

        // Tentar encontrar o próximo curso baseado na escolha manual do admin
        if (currentCourseName) {
            const currentCourseData = allCourses.find(c =>
                normalize(c.title) === normalize(currentCourseName)
            );

            console.log(`[DEBUG] Curso Atual encontrado no JSON:`, currentCourseData?.title, "Sugestão Manual ID:", currentCourseData?.next_course_id);

            if (currentCourseData?.next_course_id) {
                const targetId = normalize(currentCourseData.next_course_id);
                nextCourse = allCourses.find(c => normalize(c.id) === targetId);
                console.log(`[DEBUG] Candidato Manual encontrado:`, nextCourse?.title);

                // Se o aluno já estiver matriculado no curso sugerido, ignoramos a sugestão manual
                if (nextCourse && enrolledIdsWithCurrent.includes(normalize(nextCourse.id))) {
                    console.log(`[DEBUG] Candidato Manual ignorado porque já está na lista de inscritos/atual`);
                    nextCourse = undefined;
                }
            }
        }

        // 5. Fallback: Filtrar cursos que o aluno ainda não está matriculado e pegar o primeiro da lista
        if (!nextCourse) {
            console.log(`[DEBUG] Entrando em Fallback...`);
            const remainingCourses = allCourses.filter(c => {
                const normId = normalize(c.id);
                const isEnrolled = enrolledIdsWithCurrent.includes(normId);
                console.log(`[DEBUG] Verificando curso ${c.title} (ID: ${normId}): Já inscrito? ${isEnrolled}`);
                return !isEnrolled;
            });

            if (remainingCourses.length > 0) {
                nextCourse = remainingCourses[0];
                console.log(`[DEBUG] Fallback selecionou:`, nextCourse.title);
            }
        }

        // 6. Retornar apenas o PRÓXIMO curso na sequência
        if (nextCourse) {
            return [{
                ...nextCourse,
                isLocked: hasActiveCourse
            } as CourseWithStatus];
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
