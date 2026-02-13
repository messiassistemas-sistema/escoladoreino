
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AsaasWebhookPayload {
    event: string;
    payment: {
        id: string;
        customer: string;
        value: number;
        status: string;
        externalReference: string; // This should be our student_id
        paymentMethod?: string;
    };
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload = await req.json() as AsaasWebhookPayload;
        const { event, payment } = payload;

        console.log(`Webhook received: ${event} for payment ${payment.id} / Student: ${payment.externalReference}`);

        // 1. Check if it's a success event
        const successEvents = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];

        if (successEvents.includes(event)) {
            const studentId = payment.externalReference;
            const asaasPaymentId = payment.id;

            if (!studentId) {
                console.warn("Webhook received without externalReference (studentId). Skipping conversion.");
                return new Response(JSON.stringify({ success: true, message: "Ignored: No externalReference" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // 2. Update Local Payments Table
            // Fetch student to get email since payments table uses email as key
            const { data: student } = await supabaseAdmin
                .from("students")
                .select("email")
                .eq("id", studentId)
                .single();

            if (student?.email) {
                console.log(`Linking payment ${asaasPaymentId} to student email ${student.email}`);
                const { error: paymentUpdateError } = await supabaseAdmin
                    .from("payments")
                    .update({
                        status: 'approved',
                        payment_method: payment.paymentMethod || 'asaas',
                        payment_provider: 'Asaas',
                        external_reference: asaasPaymentId,
                        last_updated_at: new Date().toISOString()
                    })
                    .eq("student_email", student.email)
                    .eq("status", "pending");

                if (paymentUpdateError) {
                    console.error("Failed to update local payment status:", paymentUpdateError);
                }
            } else {
                console.error(`Could not find student with ID ${studentId} to link payment.`);
            }

            // 3. Trigger approve-student Edge Function
            // Internal Token for S2S communication
            const internalToken = Deno.env.get("INTERNAL_WEBHOOK_TOKEN");

            if (!internalToken) {
                throw new Error("INTERNAL_WEBHOOK_TOKEN not configured on server.");
            }

            const approveUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/approve-student`;

            console.log(`Triggering auto-approval for student: ${studentId}`);

            const response = await fetch(approveUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-S2S-Api-Key": internalToken
                },
                body: JSON.stringify({ student_id: studentId })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Auto-approval failed:", result);
                throw new Error(`Approval function returned error: ${result.error}`);
            }

            console.log("Auto-approval successful:", result);

            return new Response(JSON.stringify({ success: true, message: "Approved", result }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Handle other events if needed (e.g., PAYMENT_OVERDUE)
        return new Response(JSON.stringify({ success: true, message: `Event ${event} ignored` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
