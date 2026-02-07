import { AdminLayout } from "@/components/admin/AdminLayout";
import { UsersManagement } from "@/components/admin/UsersManagement";

export default function AdminUsuarios() {
    return (
        <AdminLayout title="Usuários" description="Gerencie o acesso de administradores e membros da equipe.">
            <div className="space-y-6">
                <UsersManagement />
            </div>
        </AdminLayout>
    );
}
