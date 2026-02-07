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



export default function AdminConfiguracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

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
        description: "Não foi possível salvar as configurações.",
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
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="escola" className="gap-2">
              <School className="h-4 w-4" />
              <span className="hidden sm:inline">Escola</span>
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">E-mail</span>
            </TabsTrigger>
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

          {/* Pagamentos */}
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
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="pagarme">Pagar.me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_api_key">Access Token</Label>
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
                      Token de acesso do Mercado Pago (ambiente produção).
                    </p>
                  </div>

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
