
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch pending messages scheduled for now or in the past
        // Limit to 20 to avoid timeouts (Cron should run every minute)
        const { data: messages, error: fetchError } = await supabase
            .from("communication_queue")
            .select("*")
            .in("status", ["message_scheduled", "pending", "scheduled"]) // Handle various potential status strings
            .lte("scheduled_for", new Date().toISOString())
            .limit(20);

        if (fetchError) {
            throw fetchError;
        }

        if (!messages || messages.length === 0) {
            return new Response(JSON.stringify({ message: "No messages to process" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Process each message
        const results = [];
        const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
        const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
        const ZAPI_SECURITY_TOKEN = Deno.env.get("ZAPI_SECURITY_TOKEN");

        if (!ZAPI_INSTANCE_ID || !ZAPI_CLIENT_TOKEN || !ZAPI_SECURITY_TOKEN) {
            throw new Error("Missing Z-API credentials");
        }

        for (const msg of messages) {
            try {
                // Mark as processing
                await supabase
                    .from("communication_queue")
                    .update({ status: "processing" })
                    .eq("id", msg.id);

                // Sanitize Phone
                let phone = msg.phone?.replace(/\D/g, "") || "";
                if (!phone.startsWith("55")) {
                    phone = "55" + phone;
                }

                // Send via Z-API
                const response = await fetch(
                    `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_CLIENT_TOKEN}/send-text`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Client-Token": ZAPI_SECURITY_TOKEN,
                        },
                        body: JSON.stringify({
                            phone: phone,
                            message: msg.message_body,
                        }),
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    // Mark as Sent
                    await supabase
                        .from("communication_queue")
                        .update({
                            status: "sent",
                            sent_at: new Date().toISOString(),
                        })
                        .eq("id", msg.id);
                    results.push({ id: msg.id, status: "sent" });
                } else {
                    throw new Error(data.message || "Z-API Error");
                }
            } catch (err: any) {
                // Mark as Failed
                await supabase
                    .from("communication_queue")
                    .update({
                        status: "failed",
                        error_message: err.message,
                    })
                    .eq("id", msg.id);
                results.push({ id: msg.id, status: "failed", error: err.message });
            }
        }

        return new Response(JSON.stringify({ processed: results.length, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
