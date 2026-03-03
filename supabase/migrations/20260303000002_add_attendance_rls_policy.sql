-- Habilitar RLS na tabela de registros de presença
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para evitar duplicidade)
DROP POLICY IF EXISTS "Alunos podem registrar própria presença" ON attendance_records;
DROP POLICY IF EXISTS "Alunos podem ver própria presença" ON attendance_records;
DROP POLICY IF EXISTS "Admins possuem acesso total" ON attendance_records;

-- Política: Alunos podem inserir seus próprios registros
-- Nota: O student_id no banco deve corresponder ao que está no metadado do usuário auth.uid()
CREATE POLICY "Alunos podem registrar própria presença" ON attendance_records
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'student'
);

-- Política: Alunos podem visualizar seus próprios registros
CREATE POLICY "Alunos podem ver própria presença" ON attendance_records
FOR SELECT
TO authenticated
USING (
  auth.uid() = (SELECT id FROM profiles WHERE id = auth.uid()) -- Garante que é ele mesmo
  OR 
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- Política: Admins têm controle total
CREATE POLICY "Admins possuem acesso total" ON attendance_records
FOR ALL
TO authenticated
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
