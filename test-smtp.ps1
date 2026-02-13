$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    TESTE DE ENVIO DE E-MAIL (GMAIL)      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Solicita credenciais
$EmailUser = Read-Host "Digite seu e-mail do Gmail (ex: msig12@gmail.com)"
$EmailTo = Read-Host "Digite o e-mail de destino (para onde enviar)"
$Password = Read-Host "Digite a Senha de App (16 caracteres)" -AsSecureString

# Converte SecureString para String
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$PasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Configurações SMTP
$SmtpServer = "smtp.gmail.com"
$Port = 587

try {
    Write-Host ""
    Write-Host "Conectando ao servidor SMTP ${SmtpServer}:${Port}..." -ForegroundColor Yellow
    
    $SmtpClient = New-Object System.Net.Mail.SmtpClient($SmtpServer, $Port)
    $SmtpClient.EnableSsl = $true
    $SmtpClient.Credentials = New-Object System.Net.NetworkCredential($EmailUser, $PasswordPlain)
    
    $Subject = "Teste de SMTP Local - Escola do Reino"
    $Body = "Este é um e-mail de teste enviado diretamente via PowerShell para validar suas credenciais."
    
    Write-Host "Enviando e-mail..." -ForegroundColor Yellow
    $SmtpClient.Send($EmailUser, $EmailTo, $Subject, $Body)
    
    Write-Host ""
    Write-Host "SUCESSO! Conexão estabelecida e e-mail enviado." -ForegroundColor Green
    Write-Host "Isso confirma que suas credenciais e rede estão OK." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "FALHA NO ENVIO" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.InnerException) {
        Write-Host "Detalhes: $($_.Exception.InnerException.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "DICAS:" -ForegroundColor White
    Write-Host "1. Verifique se a 'Senha de App' está correta." -ForegroundColor Gray
    Write-Host "2. Verifique se digitou o e-mail corretamente." -ForegroundColor Gray
}
Write-Host ""
Read-Host "Pressione ENTER para sair"
