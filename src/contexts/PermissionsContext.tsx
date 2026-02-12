import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PermissionsContextType {
    permissions: string[];
    isLoading: boolean;
    hasPermission: (permission: string) => boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
    const { user, session } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPermissions = async () => {
        if (!user) {
            setPermissions([]);
            setIsLoading(false);
            return;
        }

        try {
            // Get user role from profiles (or metadata as fallback)
            // Ideally we rely on public.profiles.role which is what the DB uses
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const role = profile?.role || user.user_metadata?.role;

            if (!role) {
                setPermissions([]);
                setIsLoading(false);
                return;
            }

            // Fetch permissions for this role
            const { data, error } = await supabase
                .from('role_permissions')
                .select('permission')
                .eq('role', role);

            if (error) {
                console.error("Error fetching permissions:", error);
                setPermissions([]);
            } else {
                setPermissions(data.map(p => p.permission));
            }

        } catch (err) {
            console.error("Unexpected error loading permissions:", err);
            setPermissions([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [user, session]);

    const hasPermission = (permission: string) => {
        // Admin always has logic bypass in DB, but let's enforce explicitly here too if needed
        // Or strictly follow the list. The list should contain everything for admin.
        // But for safety, let's say if permission list includes '*', valid? 
        // No, let's stick to strict list check for now.
        // Wait, Admin seed data has everything. So strict check is fine.
        return permissions.includes(permission);
    };

    return (
        <PermissionsContext.Provider value={{ permissions, isLoading, hasPermission, refreshPermissions: fetchPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error("usePermissions must be used within a PermissionsProvider");
    }
    return context;
}
