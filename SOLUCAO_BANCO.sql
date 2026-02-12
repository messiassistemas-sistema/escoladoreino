-- Este arquivo deve ser rodado no Editor SQL do Supabase
-- para corrigir permissões de presença

-- 1. Habilitar RLS na tabela attendance_records (se não estiver)
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para permitir que o aluno insira sua própria presença
-- (Se a tabela students tiver o email igual ao do usuário logado)
CREATE POLICY "Alunos podem registrar presença"
ON attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = attendance_records.student_id
    AND s.email = auth.jwt() ->> 'email'
  )
);

-- 3. Permitir leitura (já deve existir, mas reforçando)
CREATE POLICY "Alunos podem ver suas presenças"
ON attendance_records
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
  )
);
