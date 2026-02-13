import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { landingService } from "@/services/landingService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle, Loader2, MapPin, Globe, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { asaasService } from "@/services/asaasService";
import { settingsService } from "@/services/settingsService";
import { supabase } from "@/integrations/supabase/client";

export default function Matricula() {
  useEffect(() => {
    document.title = "Escola do Reino - Matrícula";
  }, []);

  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const cursoSelecionado = searchParams.get("curso");

  const { data: content } = useQuery({
    queryKey: ["landing-content"],
    queryFn: landingService.getContent,
  });

  // Debugging logs
  useEffect(() => {
    if (content) {
      console.log("URL Param (curso):", cursoSelecionado);
      console.log("Available Courses:", content.courses_data?.map(c => c.title));
      const match = content.courses_data?.find(c => c.title.trim() === cursoSelecionado?.trim());
      console.log("Found Match:", match);
    }
  }, [content, cursoSelecionado]);

  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");

  useEffect(() => {
    if (cursoSelecionado) {
      // Verificamos se o curso da URL está disponível (ativo)
      // Ajuste: available !== false cobre tanto true quanto undefined (novo curso)
      const isActive = content?.courses_data?.some(c =>
        c.title.trim().toLowerCase() === cursoSelecionado.trim().toLowerCase() &&
        c.available !== false
      );

      if (isActive) {
        setSelectedCourseTitle(cursoSelecionado.trim());
      } else if (content?.courses_data) {
        // Se não estiver ativo, pegamos o primeiro ativo disponível
        const firstActive = content.courses_data.find(c => c.available !== false);
        if (firstActive) setSelectedCourseTitle(firstActive.title);
      }
    } else if (content?.courses_data && !selectedCourseTitle) {
      const firstActive = content.courses_data.find(c => c.available !== false);
      if (firstActive) setSelectedCourseTitle(firstActive.title);
    }
  }, [cursoSelecionado, content]);


  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsService.getSettings,
  });

  // Prioritize active courses only
  // Modification: available !== false means it's active by default (common in the EditorSite logic)
  const availableActiveCourses = content?.courses_data?.filter(c => c.available !== false) || [];

  const selectedCourseData = availableActiveCourses.find(c => c.title.trim().toLowerCase() === selectedCourseTitle.trim().toLowerCase());

  // Priority: 1. Global Settings Value -> 2. Course Specific Price -> 3. Default 100
  const currentPrice = settings?.enrollment_value || selectedCourseData?.price || 100.00;

  // const courseTitle = selectedCourseData?.title || "Curso (Selecione na página anterior)";

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    modality: "presencial" as "presencial" | "online",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit iniciado", formData);

    if (!formData.acceptTerms) {
      toast({
        title: "Atenção",
        description: "Você precisa aceitar os termos para continuar.",
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = formData.telefone.replace(/\D/g, "");
    if (cleanPhone.length !== 11) {
      toast({
        title: "Telefone inválido",
        description: "O telefone deve ter 11 dígitos (DDD + número).",
        variant: "destructive",
      });
      return;
    }

    const cleanCpf = formData.cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "O CPF deve ter 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create Student (DB)
      const { studentsService } = await import("@/services/studentsService");

      await studentsService.createStudent({
        name: formData.nome,
        email: formData.email,
        phone: formData.telefone,
        registration_number: null,
        class_name: selectedCourseData?.title || "Turma 2025.1",
        status: 'pendente',
        attendance_rate: 0,
        average_grade: 0,
        modality: formData.modality
      });

      // 2. Create Asaas Customer
      const cleanCpf = formData.cpf.replace(/\D/g, "");
      const cleanPhone = formData.telefone.replace(/\D/g, "");

      const customer = await asaasService.createCustomer({
        name: formData.nome,
        email: formData.email,
        cpfCnpj: cleanCpf,
        mobilePhone: cleanPhone,
        externalReference: formData.email
      });

      // 2.5 Send WhatsApp Notification
      try {
        const firstName = formData.nome.split(" ")[0];
        // Use configured message or fallback
        const messageTemplate = settings?.whatsapp_welcome_message || "Olá {nome}, que bom que sua matrícula foi feita na Escola do Reino! Em breve entraremos em contato.";
        const finalMessage = messageTemplate.replace(/{nome}/g, firstName).replace(/{name}/g, firstName);

        console.log("Tentando enviar WhatsApp...", { phone: cleanPhone, message: finalMessage });

        const { data, error } = await supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: cleanPhone,
            message: finalMessage,
          },
        });

        if (error) {
          console.error("Erro na função send-whatsapp:", error);
          throw error;
        }

        if (data && data.success === false) {
          console.error("Erro retornado pela API:", data.error);
          alert(`Erro no WhatsApp: ${data.error}`);
          throw new Error(data.error);
        }

        console.log("WhatsApp enviado com sucesso:", data);

      } catch (waError: any) {
        console.error("Falha ao enviar WhatsApp (Catch):", waError);
        // Continue execution, don't block payment flow
      }

      // 3. Create Payment 
      const payment = await asaasService.createPayment({
        customer: customer.id,
        billingType: 'UNDEFINED',
        value: currentPrice,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Matrícula: ${selectedCourseData?.title || "Curso Geral"}`,
        externalReference: `MAT-${Date.now()}`
      });

      toast({
        title: "Pré-inscrição realizada!",
        description: "Redirecionando para o pagamento...",
      });

      if (payment.invoiceUrl) {
        window.location.href = payment.invoiceUrl;
      } else {
        toast({
          title: "Erro",
          description: "Link de pagamento não gerado.",
          variant: "destructive",
        });
        setIsLoading(false);
      }

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro na inscrição",
        description: error.message || "Não foi possível realizar sua inscrição. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };



  const getPaymentProviderLabel = (provider: string | undefined) => {
    switch (provider) {
      case 'asaas': return 'Asaas';
      case 'stripe': return 'Stripe';
      case 'mercadopago': return 'Mercado Pago';
      case 'pagseguro': return 'PagSeguro';
      default: return 'Mercado Pago'; // Default fallback
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="mb-4 font-display text-3xl font-bold md:text-4xl">
                Matrícula
              </h1>

              <div className="mb-6 max-w-md mx-auto text-left">
                <Label className="mb-2 block">Selecione o Curso</Label>
                <Select
                  value={selectedCourseTitle}
                  onValueChange={(value) => {
                    setSelectedCourseTitle(value);
                  }}
                >
                  <SelectTrigger className="w-full bg-background/50 backdrop-blur-sm border-primary/20 h-12 text-lg font-medium ring-offset-background focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione um curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableActiveCourses.map((course) => (
                      <SelectItem key={course.title} value={course.title} className="py-3">
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableActiveCourses.length === 0 && (
                  <p className="mt-2 text-sm text-destructive font-medium">
                    Não há cursos com matrículas abertas no momento.
                  </p>
                )}
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-8 relative inline-block"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 blur rounded-2xl" />
                <div className="relative bg-card/80 backdrop-blur-sm border border-primary/20 px-8 py-4 rounded-2xl shadow-lg">
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
                    Valor da Inscrição
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-primary">R$</span>
                    <span className="text-5xl font-black tracking-tight text-foreground">
                      {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(currentPrice).split(',')[0]}
                    </span>
                    <span className="text-2xl font-bold text-foreground/70">
                      ,{new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(currentPrice).split(',')[1]}
                    </span>
                  </div>
                </div>
              </motion.div>

              <p className="mb-8 text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">
                Preencha seus dados reais e o e-mail que você mais utiliza para receber seu acesso.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        telefone: formatPhone(e.target.value),
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Modalidade de Estudo *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, modality: 'presencial' }))}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                        formData.modality === 'presencial'
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      <MapPin className={cn("h-6 w-6", formData.modality === 'presencial' ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-bold text-sm">Presencial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, modality: 'online' }))}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                        formData.modality === 'online'
                          ? "border-amber-500 bg-amber-500/10 text-amber-500"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-amber-500/30"
                      )}
                    >
                      <Globe className={cn("h-6 w-6", formData.modality === 'online' ? "text-amber-500" : "text-muted-foreground")} />
                      <span className="font-bold text-sm">Online</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {formData.modality === 'online' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-sm leading-relaxed">
                          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                          <p>
                            <strong>Atenção:</strong> A modalidade Online é destinada a alunos residentes fora de Cerejeiras. Sua solicitação passará por uma análise da direção antes da liberação definitiva.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cpf: formatCPF(e.target.value),
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado apenas para emissão de nota fiscal e certificado.
                  </p>
                </div>

                {/* Payment Method Selector removed to allow choice at checkout */}

                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, acceptTerms: checked === true }))
                      }
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      Li e concordo com os{" "}
                      <Link to="/termos" className="text-primary underline hover:no-underline">
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link to="/privacidade" className="text-primary underline hover:no-underline">
                        Política de Privacidade
                      </Link>{" "}
                      da Escola do Reino.
                    </Label>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Continuar para Pagamento
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Pagamento seguro via {getPaymentProviderLabel(settings?.payment_provider)}
                </div>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-center text-sm text-muted-foreground"
            >
              Já fez a matrícula?{" "}
              <Link to="/status-matricula" className="text-primary underline hover:no-underline">
                Verifique o status aqui
              </Link>
            </motion.p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
