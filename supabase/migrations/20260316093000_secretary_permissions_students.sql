-- Migração para liberar permissões de edição de alunos para o perfil de secretaria
-- Autor: Antigravity
-- Data: 2026-03-16

-- 1. Permissões para a tabela de Estudantes (students)
DROP POLICY IF EXISTS "Secretaria possui acesso total aos alunos" ON public.students;
CREATE POLICY "Secretaria possui acesso total aos alunos" ON public.students
FOR ALL
TO authenticated
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretary'
)
WITH CHECK (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretary'
);

-- 2. Permissões para a tabela de Pagamentos (payments)
-- Necessário pois a secretaria ao ativar um aluno pode precisar criar um registro de pagamento
DROP POLICY IF EXISTS "Secretaria possui acesso total aos pagamentos" ON public.payments;
CREATE POLICY "Secretaria possui acesso total aos pagamentos" ON public.payments
FOR ALL
TO authenticated
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretary'
)
WITH CHECK (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretary'
);

-- 3. Permissões para a tabela de Configurações do Sistema (system_settings)
-- Necessário para buscar valores padrão de matrícula
DROP POLICY IF EXISTS "Secretaria pode visualizar configurações" ON public.system_settings;
CREATE POLICY "Secretaria pode visualizar configurações" ON public.system_settings
FOR SELECT
TO authenticated
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretary'
);

-- 4. Permissões para a tabela de Perfis (profiles)
-- Necessário para visualizar informações de usuários vinculados
DROP POLICY IF EXISTS "Secretaria pode visualizar perfis" ON public.profiles;
CREATE POLICY "Secretaria pode visualizar perfis" ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'secretary'
);
