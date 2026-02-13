import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Save,
  School,
  CreditCard,
  Bell,
  Shield,
  Mail,
  Key,
  Users,
  MessageCircle,
  Book,
  Clock,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService, SystemSettings } from "@/services/settingsService";
import { useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";



export default function AdminConfiguracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const { isAdmin } = useAuth(); // Get admin status

  const { data: settings, isLoading: isFetching } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsService.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (newSettings: Partial<SystemSettings>) =>
      settingsService.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast({
        title: "Configurações salvas!",
        description: "As alterações foram aplicadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleSave = () => {
    mutation.mutate(formData);
  };

  const handleChange = useCallback((id: keyof SystemSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const isLoading = isFetching || mutation.isPending;

  if (isFetching && !formData.school_name) {
    return (
      <AdminLayout title="Configurações" description="Carregando configurações...">
        <div className="space-y-6">
          <div className="flex gap-2 border-b pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações" description="Configurações gerais do sistema">
      <div className="space-y-6">
        <Tabs defaultValue="escola" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="escola" className="gap-2">
              <School className="h-4 w-4" />
              <span className="hidden sm:inline">Escola</span>
            </TabsTrigger>
            <TabsTrigger value="academico" className="gap-2">
              <Book className="h-4 w-4" />
              <span className="hidden sm:inline">Gestão Acadêmica</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="pagamentos" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamentos</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">E-mail</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Escola */}
          <TabsContent value="escola">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display">Informações da Escola</CardTitle>
                  <CardDescription>
                    Configure as informações básicas da instituição.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="school_name">Nome da Escola</Label>
                      <Input
                        id="school_name"
                        value={formData.school_name || ""}
                        onChange={(e) => handleChange("school_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0001-00"
                        value={formData.cnpj || ""}
                        onChange={(e) => handleChange("cnpj", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo da Escola</Label>
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <Input
                          id="logo_upload"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            try {
                              toast({ title: "Enviando...", description: "Fazendo upload da imagem..." });

                              const fileExt = file.name.split('.').pop();
                              const fileName = `logo-${Date.now()}.${fileExt}`;
                              const { data, error } = await supabase.storage
                                .from('system-assets')
                                .upload(fileName, file);

                              if (error) throw error;

                              const { data: { publicUrl } } = supabase.storage
                                .from('system-assets')
                                .getPublicUrl(fileName);

                              handleChange("logo_url", publicUrl);
                              toast({ title: "Sucesso!", description: "Imagem enviada com sucesso." });
                            } catch (error: any) {
                              console.error(error);
                              toast({ title: "Erro", description: "Falha no upload: " + error.message, variant: "destructive" });
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione uma imagem (PNG ou JPG) para substituir a logo.
                        </p>
                      </div>
                      {formData.logo_url && (
                        <div className="relative h-16 w-16 border rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                          <img src={formData.logo_url} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school_description">Descrição</Label>
                    <Textarea
                      id="school_description"
                      value={formData.school_description || ""}
                      onChange={(e) => handleChange("school_description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">E-mail de Contato</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email || ""}
                        onChange={(e) => handleChange("contact_email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Telefone</Label>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone || ""}
                        onChange={(e) => handleChange("contact_phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="mb-4 font-display font-semibold">Regras de Aprovação</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="min_grade">Média Mínima para Aprovação</Label>
                        <Input
                          id="min_grade"
                          type="number"
                          value={formData.min_grade || ""}
                          onChange={(e) => handleChange("min_grade", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min_attendance">Frequência Mínima (%)</Label>
                        <Input
                          id="min_attendance"
                          type="number"
                          value={formData.min_attendance || ""}
                          onChange={(e) => handleChange("min_attendance", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

              </Card>
            </motion.div>
          </TabsContent>

          {/* Gestão Acadêmica */}
          <TabsContent value="academico">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display">Gestão Acadêmica e Alertas</CardTitle>
                  <CardDescription>
                    Configure limites de faltas e horários para o sistema de presença.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Alertas por Faltas (Módulo)</h4>
                      <div className="space-y-2">
                        <Label htmlFor="absences_alert_threshold">Limite de Faltas para Alerta</Label>
                        <Input
                          id="absences_alert_threshold"
                          type="number"
                          value={formData.absences_alert_threshold || 2}
                          onChange={(e) => handleChange("absences_alert_threshold", Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">O aluno e a secretaria serão notificados após atingir este número de faltas.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="absences_fail_threshold">Limite de Faltas para Reprovação</Label>
                        <Input
                          id="absences_fail_threshold"
                          type="number"
                          value={formData.absences_fail_threshold || 3}
                          onChange={(e) => handleChange("absences_fail_threshold", Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">A diretoria será notificada quando o aluno for reprovado por faltas.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Monitoramento em Tempo Real</h4>
                      <div className="space-y-2">
                        <Label htmlFor="class_start_time" className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Horário de Início das Aulas
                        </Label>
                        <Input
                          id="class_start_time"
                          type="time"
                          value={formData.class_start_time || "19:30"}
                          onChange={(e) => handleChange("class_start_time", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="check_in_deadline_time" className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Horário Limite de Alerta (20:15h)
                        </Label>
                        <Input
                          id="check_in_deadline_time"
                          type="time"
                          value={formData.check_in_deadline_time || "20:15"}
                          onChange={(e) => handleChange("check_in_deadline_time", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Neste horário, o sistema avisará sobre alunos que ainda não chegaram.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secretary_phone">WhatsApp de Alertas (Secretaria)</Label>
                        <Input
                          id="secretary_phone"
                          placeholder="5511999999999"
                          value={formData.secretary_phone || ""}
                          onChange={(e) => handleChange("secretary_phone", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Número que receberá as notificações de atraso (com DDI e DDD).</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-border">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" /> Personalização de Mensagens (WhatsApp)
                    </h4>

                    <div className="grid gap-4 md:grid-cols-1">
                      <div className="space-y-2">
                        <Label htmlFor="attendance_msg_daily_late">Mensagem de Ausência (Tempo Real)</Label>
                        <Textarea
                          id="attendance_msg_daily_late"
                          value={formData.attendance_msg_daily_late || ""}
                          onChange={(e) => handleChange("attendance_msg_daily_late", e.target.value)}
                          placeholder="Oi {nome}! 📚 Sentimos sua falta hoje..."
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          Variáveis: <strong>{'{nome}'}</strong>, <strong>{'{horario}'}</strong>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="attendance_msg_alert">Mensagem de Alerta (Faltas Acumuladas)</Label>
                        <Textarea
                          id="attendance_msg_alert"
                          value={formData.attendance_msg_alert || ""}
                          onChange={(e) => handleChange("attendance_msg_alert", e.target.value)}
                          placeholder="Oi {nome}! Você tem {faltas} faltas..."
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          Variáveis: <strong>{'{nome}'}</strong>, <strong>{'{faltas}'}</strong>, <strong>{'{disciplina}'}</strong>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="attendance_msg_fail">Mensagem de Reprovação</Label>
                        <Textarea
                          id="attendance_msg_fail"
                          value={formData.attendance_msg_fail || ""}
                          onChange={(e) => handleChange("attendance_msg_fail", e.target.value)}
                          placeholder="⚠️ ALERTA CRÍTICO: {nome} atingiu {faltas} faltas..."
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          Variáveis: <strong>{'{nome}'}</strong>, <strong>{'{faltas}'}</strong>, <strong>{'{disciplina}'}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-900/30">
                    <h5 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Resumo da Regra Vigente</h5>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Os alunos têm aulas às {formData.class_start_time}. Se não fizerem check-in até as {formData.check_in_deadline_time}, um alerta será gerado.
                      Além disso, com {formData.absences_alert_threshold} faltas acumuladas no módulo eles recebem um aviso, e com {formData.absences_fail_threshold} faltas são reprovados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Pagamentos */}
          {isAdmin && (
            <TabsContent value="pagamentos">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Configurações de Pagamento</CardTitle>
                    <CardDescription>
                      Configure a integração com o provedor de pagamentos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Provedor de Pagamento</Label>
                      <Select
                        value={formData.payment_provider || "mercadopago"}
                        onValueChange={(value) => handleChange("payment_provider", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                          <SelectItem value="asaas">Asaas</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="pagarme">Pagar.me</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_api_key">Access Token (Chave Privada)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="payment_api_key"
                          type="password"
                          placeholder="••••••••••••••••"
                          value={formData.payment_api_key || ""}
                          onChange={(e) => handleChange("payment_api_key", e.target.value)}
                        />
                        <Button variant="outline" size="icon">
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Access Token secreto do provedor selecionado (Mercado Pago ou Asaas).
                      </p>
                    </div>

                    {formData.payment_provider === 'mercadopago' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <Label htmlFor="payment_public_key">Public Key (Chave Pública)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="payment_public_key"
                            placeholder="APP_USR-••••••••••••••••"
                            value={formData.payment_public_key || ""}
                            onChange={(e) => handleChange("payment_public_key", e.target.value)}
                          />
                          <Button variant="outline" size="icon">
                            <School className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Necessária para o checkout transparente do Mercado Pago.
                        </p>
                      </motion.div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="enrollment_value">Valor da Matrícula (R$)</Label>
                        <Input
                          id="enrollment_value"
                          type="number"
                          value={formData.enrollment_value || ""}
                          onChange={(e) => handleChange("enrollment_value", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_installments">Máximo de Parcelas</Label>
                        <Input
                          id="max_installments"
                          type="number"
                          value={formData.max_installments || ""}
                          onChange={(e) => handleChange("max_installments", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <Label>Pagamento à Vista com Desconto</Label>
                        <p className="text-sm text-muted-foreground">
                          Oferecer desconto para pagamentos à vista.
                        </p>
                      </div>
                      <Switch
                        checked={formData.cash_discount || false}
                        onCheckedChange={(checked) => handleChange("cash_discount", checked)}
                      />
                    </div>
                  </CardContent>

                </Card>
              </motion.div>
            </TabsContent>
          )}

          {/* Notificações */}
          <TabsContent value="notificacoes">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display">Notificações</CardTitle>
                  <CardDescription>
                    Configure como os usuários receberão notificações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Notificações por E-mail</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar e-mails para avisos importantes.
                      </p>
                    </div>
                    <Switch
                      checked={formData.email_notif || false}
                      onCheckedChange={(checked) => handleChange("email_notif", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Notificações no Portal</Label>
                      <p className="text-sm text-muted-foreground">
                        Exibir notificações no painel do aluno.
                      </p>
                    </div>
                    <Switch
                      checked={formData.portal_notif || false}
                      onCheckedChange={(checked) => handleChange("portal_notif", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Lembrete de Aulas</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar lembrete 1 dia antes das aulas.
                      </p>
                    </div>
                    <Switch
                      checked={formData.lesson_reminder || false}
                      onCheckedChange={(checked) => handleChange("lesson_reminder", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Notificações de Notas</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando novas notas forem lançadas.
                      </p>
                    </div>
                    <Switch
                      checked={formData.grade_notif || false}
                      onCheckedChange={(checked) => handleChange("grade_notif", checked)}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_welcome_message">Mensagem de Boas-Vindas (Ao matricular)</Label>
                      <Textarea
                        id="whatsapp_welcome_message"
                        value={formData.whatsapp_welcome_message || ""}
                        onChange={(e) => handleChange("whatsapp_welcome_message", e.target.value)}
                        placeholder="Olá {nome}, bem-vindo à Escola do Reino!"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use <strong>{'{nome}'}</strong> para inserir o nome do aluno automaticamente.
                      </p>
                    </div>
                  </div>
                </CardContent>

              </Card>
            </motion.div>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="seguranca">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display">Segurança</CardTitle>
                  <CardDescription>
                    Configurações de segurança e autenticação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Autenticação em Dois Fatores (Admin)</Label>
                      <p className="text-sm text-muted-foreground">
                        Exigir 2FA para administradores.
                      </p>
                    </div>
                    <Switch
                      checked={formData.admin_2fa || false}
                      onCheckedChange={(checked) => handleChange("admin_2fa", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Tempo de QR Code (minutos)</Label>
                      <p className="text-sm text-muted-foreground">
                        Validade do QR Code de presença.
                      </p>
                    </div>
                    <Input
                      type="number"
                      value={formData.qr_validity || ""}
                      onChange={(e) => handleChange("qr_validity", Number(e.target.value))}
                      className="w-24"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Logs de Auditoria (LGPD)</Label>
                      <p className="text-sm text-muted-foreground">
                        Registrar ações administrativas.
                      </p>
                    </div>
                    <Switch
                      checked={formData.audit_logs || false}
                      onCheckedChange={(checked) => handleChange("audit_logs", checked)}
                    />
                  </div>
                </CardContent>

              </Card>
            </motion.div>
          </TabsContent>



          {/* E-mail */}
          {isAdmin && (
            <TabsContent value="email">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Configurações de E-mail</CardTitle>
                    <CardDescription>
                      Configure o servidor SMTP para envio de e-mails.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_host">Servidor SMTP</Label>
                        <Input
                          id="smtp_host"
                          placeholder="smtp.gmail.com"
                          value={formData.smtp_host || ""}
                          onChange={(e) => handleChange("smtp_host", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_port">Porta</Label>
                        <Input
                          id="smtp_port"
                          placeholder="587"
                          type="number"
                          value={formData.smtp_port || ""}
                          onChange={(e) => handleChange("smtp_port", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_user">Usuário</Label>
                        <Input
                          id="smtp_user"
                          placeholder="email@dominio.com"
                          value={formData.smtp_user || ""}
                          onChange={(e) => handleChange("smtp_user", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_pass">Senha</Label>
                        <Input
                          id="smtp_pass"
                          type="password"
                          placeholder="••••••••"
                          value={formData.smtp_pass || ""}
                          onChange={(e) => handleChange("smtp_pass", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sender_name">Nome do Remetente</Label>
                      <Input
                        id="sender_name"
                        value={formData.sender_name || ""}
                        onChange={(e) => handleChange("sender_name", e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          if (!formData.contact_email) {
                            toast({ title: "Erro", description: "Configure um e-mail de contato para receber o teste." });
                            return;
                          }
                          toast({ title: "Enviando...", description: "Testando envio para " + formData.contact_email });
                          try {
                            await settingsService.sendTestEmail(formData.contact_email);
                            toast({ title: "Sucesso!", description: "E-mail enviado. Verifique sua caixa de entrada.", variant: "default" });
                          } catch (e) {
                            toast({ title: "Erro", description: "Falha ao enviar. Verifique as credenciais.", variant: "destructive" });
                          }
                        }}
                        className="gap-2"
                        type="button"
                      >
                        <Mail className="h-4 w-4" />
                        Testar Configuração
                      </Button>
                    </div>
                  </CardContent>

                </Card>
              </motion.div>
            </TabsContent>
          )}

        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div >
    </AdminLayout >
  );
}
