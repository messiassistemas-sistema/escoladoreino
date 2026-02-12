
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export const ProtectedRoute = ({
    adminOnly = false,
    allowedRoles = [],
    requiredPermission
}: {
    adminOnly?: boolean;
    allowedRoles?: string[];
    requiredPermission?: string;
}) => {
    const { user, isAdmin, role, loading: authLoading } = useAuth();
    const { hasPermission, isLoading: permissionsLoading } = usePermissions();
    const location = useLocation();
    const { toast } = useToast();

    if (authLoading || permissionsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles.length > 0) {
        if (role !== 'admin' && (!role || !allowedRoles.includes(role))) {
            return <Navigate to="/" replace />;
        }
    }

    if (requiredPermission) {
        if (!hasPermission(requiredPermission)) {
            toast({
                title: "Acesso Negado",
                description: "Você não tem permissão para acessar este recurso.",
                variant: "destructive"
            });
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};
