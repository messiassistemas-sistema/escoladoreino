
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { phone, message } = await req.json();

        console.log("Function invoked with:", { phone, message });

        if (!phone || !message) {
            throw new Error("Phone and message are required");
        }

        // Cleaning phone number (keeping only digits)
        let cleanPhone = phone.replace(/\D/g, "");

        // Add Brazil DDI (55) if missing and length is 10 or 11 (DDD + Number)
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
            cleanPhone = "55" + cleanPhone;
        }

        console.log("Formatted Phone (Z-API target):", cleanPhone);

        // Z-API Credentials from Environment Variables
        const instanceIdRaw = Deno.env.get("ZAPI_INSTANCE_ID");
        const instanceTokenRaw = Deno.env.get("ZAPI_CLIENT_TOKEN"); // This is the Instance Token
        const securityTokenRaw = Deno.env.get("ZAPI_SECURITY_TOKEN"); // This is the Client Token (Security)

        const instanceId = instanceIdRaw?.trim();
        const instanceToken = instanceTokenRaw?.trim();
        const securityToken = securityTokenRaw?.trim();

        if (!instanceId || !instanceToken) {
            console.error("Missing Z-API credentials in environment variables.");
            throw new Error("Server configuration error: Missing WhatsApp API credentials");
        }

        // Construct API URL carefully
        const apiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;

        console.log(`Sending request to Z-API: ${apiUrl.replace(instanceToken, "HIDDEN_TOKEN")}`);
        console.log("Using Instance ID:", instanceId ? instanceId.substring(0, 4) + "***" : "MISSING");
        console.log("Using Instance Token:", instanceToken ? instanceToken.substring(0, 4) + "***" : "MISSING");
        console.log("Using Security Token:", securityToken ? securityToken.substring(0, 4) + "***" : "NOT_CONFIGURED");

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (securityToken) {
            headers["Client-Token"] = securityToken;
        }

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                phone: cleanPhone,
                message: message,
            }),
        });

        const data = await response.json();
        console.log("Z-API Response Payload:", data);

        if (!response.ok) {
            console.error("Z-API HTTP Error:", response.status, response.statusText);
            // Return full data to help debugging
            const debugInfo = `[ID_Len:${instanceId?.length}, Tk_Len:${instanceToken?.length}, SecTk:${securityToken ? "YES" : "NO"}]`;
            const errorMessage = (data.message || JSON.stringify(data) || "Failed to send WhatsApp message") + " " + debugInfo;
            throw new Error(errorMessage);
        }

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error handler caught:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});
