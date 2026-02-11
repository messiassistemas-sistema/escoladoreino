
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: any | null;
    loading: boolean;
    isAdmin: boolean;
    role: string | null; // Added role
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    role: null,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            console.log("Auth state change:", _event);

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // Check metadata for immediate role availability
                const metadataRole = session.user.user_metadata?.role;
                console.log("Metadata role:", metadataRole);

                try {
                    console.log("Fetching profile for user:", session.user.id);

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
                    );

                    const fetchPromise = supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", session.user.id)
                        .maybeSingle();

                    const result: any = await Promise.race([fetchPromise, timeoutPromise]);
                    const { data, error } = result;

                    if (error) {
                        console.error("Error fetching profile:", error);
                    } else {
                        console.log("Profile fetched successfully", data);
                        if (mounted) setProfile(data);
                    }
                } catch (error) {
                    console.error("Critical error or timeout in profile fetch:", error);
                } finally {
                    if (mounted) setLoading(false);
                }
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    // calculate isAdmin from Profile OR Metadata
    const isAdmin = profile?.role === "admin" || user?.user_metadata?.role === "admin";

    const role = profile?.role || user?.user_metadata?.role || null;

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, isAdmin, role, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
