import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { studentsService } from "@/services/studentsService";

export function useStudentData() {
    const { user } = useAuth();

    const { data: student, isLoading: isLoadingStudent, refetch } = useQuery({
        queryKey: ["student-profile", user?.email],
        queryFn: () => (user?.email ? studentsService.getStudentByEmail(user.email) : null),
        enabled: !!user?.email,
        staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    });

    // Lógica centralizada de prioridade: Banco de Dados > Metadados > Fallback
    const displayName = student?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Aluno";
    const displayEmail = user?.email || "";
    const displayAvatar = user?.user_metadata?.avatar_url || "";
    const displayRegistration = student?.registration_number || user?.user_metadata?.matricula || "...";
    // Prioriza turma do banco se existir, senão metadados, senão padrão
    const displayClass = student?.class_name || user?.user_metadata?.turma || "Teologia Sistemática";

    return {
        student,
        isLoading: isLoadingStudent,
        refetchStudent: refetch,
        displayName,
        displayEmail,
        displayAvatar,
        displayRegistration,
        displayClass
    };
}
