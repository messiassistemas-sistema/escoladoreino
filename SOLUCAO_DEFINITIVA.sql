-- Execute este script no SQL Editor do Supabase

-- 1. Remove qualquer política antiga com o mesmo nome (para evitar o erro "policy already exists")
DROP POLICY IF EXISTS "Alunos podem marcar presença" ON "public"."attendance_records";
DROP POLICY IF EXISTS "Alunos podem registrar presença" ON "public"."attendance_records";

-- 2. Recria a permissão correta (validando pelo email do aluno)
CREATE POLICY "Alunos podem registrar presença"
ON "public"."attendance_records"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."students" s
    WHERE s.id = "public"."attendance_records"."student_id"
    AND s.email = (auth.jwt() ->> 'email')
  )
);
