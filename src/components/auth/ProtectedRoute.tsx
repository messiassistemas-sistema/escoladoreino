
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface ProtectedRouteProps {
    adminOnly?: boolean;
}

export const ProtectedRoute = ({ adminOnly = false, allowedRoles = [] }: { adminOnly?: boolean; allowedRoles?: string[] }) => {
    const { user, isAdmin, role, loading } = useAuth();
    const { toast } = useToast();

    // Side effect for checking access
    useEffect(() => {
        if (!loading && user) {
            const hasAccess = (adminOnly ? isAdmin : true) &&
                (allowedRoles.length > 0 ? (role && (allowedRoles.includes(role) || role === 'admin')) : true);

            if (!hasAccess) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar esta área.",
                    variant: "destructive"
                });
            }
        }
    }, [loading, user, isAdmin, role, adminOnly, allowedRoles, toast]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles.length > 0) {
        // Admin always has access. If not admin, check if user role is in allowedRoles
        if (role !== 'admin' && (!role || !allowedRoles.includes(role))) {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};
