-- Remover a política incorreta caso já tenha sido aplicada
DROP POLICY IF EXISTS "Secretaria possuem acesso total" ON attendance_records;

-- Política: Secretary (Secretaria) tem controle total sobre presenças
CREATE POLICY "Secretary possuem acesso total" ON attendance_records
FOR ALL
TO authenticated
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretary'
)
WITH CHECK (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretary'
);
