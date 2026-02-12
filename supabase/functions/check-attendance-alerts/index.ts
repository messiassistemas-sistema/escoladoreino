import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_LESSONS_PER_MODULE = 5;

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        let type = "ACCUMULATED";
        try {
            const body = await req.json();
            type = body.type || "ACCUMULATED";
        } catch {
            // Minimal fallback
        }

        console.log(`Checking attendance alerts for type: ${type}`);

        const { data: settings } = await supabase.from("system_settings").select("*").single();
        if (!settings) throw new Error("System settings not found");

        if (type === "DAILY_LATE") {
            return await handleDailyLateAlerts(supabase, settings);
        } else {
            return await handleAccumulatedAbsenceAlerts(supabase, settings);
        }

    } catch (error) {
        console.error("Alert Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});

async function handleDailyLateAlerts(supabase, settings) {
    const today = new Date().toISOString().split("T")[0];

    const { data: students } = await supabase.from("students").select("id, name, phone").eq("status", "ativo");
    if (!students) return new Response(JSON.stringify({ success: true, count: 0 }));

    const { data: presences } = await supabase.from("attendance_records")
        .select("student_id")
        .eq("status", "present")
        .gte("created_at", today);

    const presentStudentIds = new Set(presences?.map(p => p.student_id));
    const missingStudents = students.filter(s => !presentStudentIds.has(s.id));

    for (const student of missingStudents) {
        const message = `Oi ${student.name}! 📚 Sentimos sua falta hoje. A aula começou às ${settings.class_start_time || '19:30'}. Está tudo bem?`;
        await notifyViaWhatsApp(supabase, student.phone, message);
    }

    if (settings.secretary_phone && missingStudents.length > 0) {
        const secMessage = `📢 *Relatório de Ausências (${new Date().toLocaleDateString('pt-BR')})*\n\nAlunos que não fizeram check-in até as ${settings.check_in_deadline_time || '20:15'}:\n\n${missingStudents.map(s => `• ${s.name}`).join("\n")}`;
        await notifyViaWhatsApp(supabase, settings.secretary_phone, secMessage);
    }

    return new Response(JSON.stringify({ success: true, alerted: missingStudents.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

async function handleAccumulatedAbsenceAlerts(supabase, settings) {
    const alertThreshold = settings.absences_alert_threshold || 2;
    const failThreshold = settings.absences_fail_threshold || 3;

    const { data: students } = await supabase.from("students").select("id, name, phone").eq("status", "ativo");
    if (!students) return new Response(JSON.stringify({ success: true, count: 0 }));

    for (const student of students) {
        // Determine the subject/module context. Usually, we'd check current enrollment.
        // Simplifying: Check absences for all active lessons the student belongs to via subject.
        // In a real scenario, we would group by subject_id.

        // Get all subjects the student has attendance records for
        const { data: activeSubjects } = await supabase
            .from("attendance_records")
            .select(`
        lesson:lessons(subject_id)
      `)
            .eq("student_id", student.id);

        const subjectIds = [...new Set(activeSubjects?.map(a => a.lesson?.subject_id).filter(Boolean))];

        for (const subject_id of subjectIds) {
            const { count: presenceCount } = await supabase
                .from("attendance_records")
                .select("id", { count: 'exact', head: true })
                .eq("student_id", student.id)
                .eq("status", "present")
                .filter("lesson_id", "in", (
                    // This is a simplified subquery logic for Deno environment
                    // Real implementation would join or use a rpc
                    supabase.from("lessons").select("id").eq("subject_id", subject_id)
                ));

            // Fetch workload or lesson count for the subject
            const { data: subject } = await supabase.from("subjects").select("workload, name").eq("id", subject_id).single();
            const totalLessons = subject?.workload || DEFAULT_LESSONS_PER_MODULE;

            const absencesCount = totalLessons - (presenceCount || 0);

            if (absencesCount >= alertThreshold) {
                const severity = absencesCount >= failThreshold ? 'CRITICAL' : 'HIGH';

                const { data: existing } = await supabase.from("attendance_alerts")
                    .select("id")
                    .eq("student_id", student.id)
                    .eq("subject_id", subject_id)
                    .eq("absences_count", absencesCount)
                    .maybeSingle();

                if (!existing) {
                    const msg = severity === 'CRITICAL'
                        ? `⚠️ ALERTA CRÍTICO: ${student.name} atingiu ${absencesCount} faltas na disciplina ${subject?.name} e está REPROVADO.`
                        : `📚 ALERTA: ${student.name} atingiu ${absencesCount} faltas na disciplina ${subject?.name}.`;

                    await supabase.from("attendance_alerts").insert({
                        student_id: student.id,
                        subject_id: subject_id,
                        type: 'LOW_ATTENDANCE',
                        severity: severity,
                        absences_count: absencesCount
                    });

                    await notifyViaWhatsApp(supabase, student.phone, `Oi ${student.name}! Você tem ${absencesCount} faltas em ${subject?.name}. Precisa de assiduidade para ser aprovado!`);
                    await notifyViaWhatsApp(supabase, settings.secretary_phone, msg);
                }
            }
        }
    }

    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

async function notifyViaWhatsApp(supabase, phone, message) {
    if (!phone) return;
    await supabase.functions.invoke("send-whatsapp", {
        body: { phone, message }
    });
}
