-- Adicionar colunas para templates de mensagens na tabela system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS msg_enrollment_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS msg_payment_confirmed_whatsapp_new TEXT,
ADD COLUMN IF NOT EXISTS msg_payment_confirmed_whatsapp_returning TEXT,
ADD COLUMN IF NOT EXISTS msg_payment_confirmed_email_new TEXT,
ADD COLUMN IF NOT EXISTS msg_payment_confirmed_email_returning TEXT;

-- Atualizar o registro existente com os textos atuais (hardcoded) para não quebrar o fluxo
UPDATE system_settings 
SET 
  msg_enrollment_whatsapp = 'Olá *{nome}*! 👋 Que alegria receber sua inscrição na **Escola do Reino**! 📖\n\nSua pré-matrícula para o curso *{curso}* foi realizada com sucesso. Percebemos que você está na fase de pagamento. ✅\n\n*O que acontece agora?*\nAssim que o pagamento for confirmado pelo sistema, eu enviarei por aqui mesmo (e por e-mail) seus dados de acesso exclusivos ao nosso Portal do Aluno.\n\nSeja muito bem-vindo(a) à nossa jornada de formação teológica! Deus abençoe seu chamado. 🙏',
  
  msg_payment_confirmed_whatsapp_new = 'Olá *{nome}*! 👋\n\nSua matrícula na *Escola do Reino* foi aprovada! ✅\n\nAqui estão seus dados de acesso ao portal:\n\n📧 *Login:* {email}\n🔑 *Senha:* {senha}\n\n🔗 Acesse em: https://escoladoreino.site/login',
  
  msg_payment_confirmed_whatsapp_returning = 'Olá *{nome}*! 👋 Que alegria ter você conosco em mais uma jornada! ✅\n\nSua nova matrícula na **Escola do Reino** já está ativa e o conteúdo liberado. 📖\n\nComo você já é nosso aluno, seus dados de acesso permanecem os mesmos. Basta entrar com seu e-mail e a senha que você já utiliza habitualmente.\n\n🔗 *Acesse agora o Portal:* https://escoladoreino.site/login\n\nBons estudos e que Deus abençoe seu chamado! 🙏',
  
  msg_payment_confirmed_email_new = '<h1>Credenciais de Acesso - Escola do Reino</h1><p>Olá <strong>{nome}</strong>,</p><p>Sua matrícula foi aprovada com sucesso! Aqui estão seus dados de acesso:</p><ul><li><strong>Login:</strong> {email}</li><li><strong>Senha:</strong> {senha}</li></ul><p>Recomendamos que altere sua senha após o primeiro acesso.</p><p>Acesse o portal aqui: <a href="https://escoladoreino.site/login">Portal do Aluno</a></p>',
  
  msg_payment_confirmed_email_returning = '<div style="font-family: sans-serif; line-height: 1.6; color: #333;"><h1 style="color: #7c3aed;">Plataforma Liberada! 🎓</h1><p>Olá <strong>{nome}</strong>, tudo bem?</p><p>É uma alegria ter você conosco em mais um curso da <strong>Escola do Reino</strong>! Sua matrícula foi confirmada e o novo conteúdo já está disponível no seu painel.</p><p>Basta entrar no portal com seu e-mail e a senha que você já cadastrou anteriormente.</p><p style="text-align: center; margin: 30px 0;"><a href="https://escoladoreino.site/login" style="background-color: #7c3aed; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">ACESSAR MEU PORTAL</a></p></div>'
WHERE id = (SELECT id FROM system_settings ORDER BY updated_at DESC LIMIT 1);
