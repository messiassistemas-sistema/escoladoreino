-- Adiciona a coluna 'date' que está faltando na tabela
ALTER TABLE "public"."attendance_records" 
ADD COLUMN IF NOT EXISTS "date" timestamp with time zone DEFAULT now();

-- Recarrega o cache do schema (opcional, mas bom pra garantir)
NOTIFY pgrst, 'reload config';
