-- Política: Secretaria tem controle total sobre presenças
CREATE POLICY "Secretaria possuem acesso total" ON attendance_records
FOR ALL
TO authenticated
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretaria'
)
WITH CHECK (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretaria'
);
