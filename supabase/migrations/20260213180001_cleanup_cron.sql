-- Função para limpar matrículas pendentes antigas (Lead Frio)
-- Remove alunos que ficaram como 'pendente' por mais de 7 dias e seus respectivos pagamentos.

create or replace function public.cleanup_stale_enrollments()
returns jsonb as $$
declare
    deleted_students_count int;
    deleted_payments_count int;
begin
    -- 1. Remover pagamentos pendentes de alunos que serão removidos
    delete from public.payments
    where status = 'pending'
    and student_email in (
        select email from public.students
        where status = 'pendente'
        and created_at < now() - interval '7 days'
        and email is not null
    );
    get diagnostics deleted_payments_count = row_count;

    -- 2. Remover alunos pendentes antigos
    delete from public.students
    where status = 'pendente'
    and created_at < now() - interval '7 days';
    get diagnostics deleted_students_count = row_count;

    return jsonb_build_object(
        'success', true,
        'deleted_students', deleted_students_count,
        'deleted_payments', deleted_payments_count,
        'timestamp', now()
    );
end;
$$ language plpgsql security definer;

-- Comentário de instrução:
-- Para automatizar isso no Supabase, você pode usar a extensão pg_cron ou criar um Edge Function de Cron.
-- Ativar via SQL Editor: select cleanup_stale_enrollments();
