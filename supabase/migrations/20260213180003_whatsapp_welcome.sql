-- Ativar extensão pg_net se não estiver ativa
create extension if not exists pg_net with schema extensions;

-- Função para disparar o WhatsApp de boas-vindas
create or replace function public.handle_new_student_enrollment()
returns trigger as $$
begin
  -- Disparar apenas para status 'pendente' (novas matrículas)
  if (new.status = 'pendente') then
    perform
      net.http_post(
        url := 'https://zlamplvubedftzgqrwcf.supabase.co/functions/v1/whatsapp-welcome-enrollment',
        body := jsonb_build_object(
          'type', 'INSERT',
          'table', 'students',
          'record', row_to_json(new)::jsonb,
          'schema', 'public'
        ),
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger na tabela students
drop trigger if exists on_student_enrolled on public.students;
create trigger on_student_enrolled
  after insert on public.students
  for each row
  execute function public.handle_new_student_enrollment();

-- Garantir que as tabelas sejam visíveis para a API (corrige erro 404 no console)
grant all on table public.students to postgres, anon, authenticated, service_role;
grant all on table public.payments to postgres, anon, authenticated, service_role;
