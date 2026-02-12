
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteRequest {
    student_id: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Init Supabase Clients
        const authHeader = req.headers.get("Authorization");

        // Client for verifying the caller
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        // check if user is logged in
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized: Caller must be logged in." }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check if user has permission (admin or secretary)
        // We can check the public.profiles table
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const allowedRoles = ['admin', 'secretary', 'treasurer'];
        if (!profile || !allowedRoles.includes(profile.role)) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized: Insufficient permissions." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Admin Client for performing privileged actions (deleting)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 2. Parse Request
        const { student_id } = await req.json() as DeleteRequest;
        if (!student_id) throw new Error("Missing student_id");

        console.log(`Deleting student: ${student_id} requested by ${user.email} (${profile.role})`);

        // 3. Delete Student Data
        // Note: This will cascade delete related records if foreign keys are set up with ON DELETE CASCADE
        // If not, we might need to delete related data manually. Assuming FKs handles it or simple deletion for now.
        const { error: deleteError } = await supabaseAdmin
            .from("students")
            .delete()
            .eq("id", student_id);

        if (deleteError) {
            throw deleteError;
        }

        return new Response(
            JSON.stringify({ success: true, message: "Student deleted successfully." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error deleting student:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
