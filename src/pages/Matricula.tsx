import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { landingService } from "@/services/landingService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle, Loader2, MapPin, Globe, AlertTriangle, Search, User, Mail, Phone, CreditCard, X } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    document.title = "Escola do Reino - Matrícula";
  }, []);

  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const cursoSelecionado = searchParams.get("curso");

  const { data: content, isLoading: isLoadingContent } = useQuery({
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
      const normalize = (val: string) => val.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const isActive = content?.courses_data?.some(c =>
        normalize(c.title) === normalize(cursoSelecionado) &&
        c.available !== false
      );

      if (isActive) {
        setSelectedCourseTitle(cursoSelecionado.trim());
      } else if (content?.courses_data) {
        const firstActive = content.courses_data.find(c => c.available !== false);
        if (firstActive) setSelectedCourseTitle(firstActive.title);
      }
    } else if (content?.courses_data && !selectedCourseTitle) {
      const firstActive = content.courses_data.find(c => c.available !== false);
      if (firstActive) setSelectedCourseTitle(firstActive.title);
    }
  }, [cursoSelecionado, content]);

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
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

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    modality: "presencial" as "presencial" | "online",
    acceptTerms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit (Validação)", formData);

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

    setShowConfirmation(true);
  };

  const processEnrollment = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      const cleanPhone = formData.telefone.replace(/\D/g, "");
      const cleanCpf = formData.cpf.replace(/\D/g, "");

      // 1. Create Student (DB)
      const { studentsService } = await import("@/services/studentsService");

      const newStudent = await studentsService.createStudent({
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

      // 3. Payment Step (Simplified to Asaas)
      let checkoutUrl = '';
      const customer = await asaasService.createCustomer({
        name: formData.nome,
        email: formData.email,
        cpfCnpj: cleanCpf,
        mobilePhone: cleanPhone,
        externalReference: formData.email
      });

      const payment = await asaasService.createPayment({
        customer: customer.id,
        billingType: 'UNDEFINED',
        value: currentPrice,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Matrícula: ${selectedCourseData?.title || "Curso Geral"}`,
        externalReference: newStudent.id // ID do aluno para o Webhook processar
      });
      checkoutUrl = payment.invoiceUrl;

      toast({
        title: "Pré-inscrição realizada!",
        description: "Redirecionando para o pagamento...",
      });

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Link de pagamento não gerado.");
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
                  disabled={isLoadingContent}
                >
                  <SelectTrigger className="w-full bg-background/50 backdrop-blur-sm border-primary/20 h-12 text-lg font-medium ring-offset-background focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder={isLoadingContent ? "Carregando cursos..." : "Selecione um curso..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableActiveCourses.map((course) => (
                      <SelectItem key={course.title} value={course.title} className="py-3">
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isLoadingContent && availableActiveCourses.length === 0 && (
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
                    {isLoadingContent || isLoadingSettings ? (
                      <div className="h-12 w-32 bg-primary/20 animate-pulse rounded-lg" />
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-primary">R$</span>
                        <span className="text-5xl font-black tracking-tight text-foreground">
                          {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(currentPrice).split(',')[0]}
                        </span>
                        <span className="text-2xl font-bold text-foreground/70">
                          ,{new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(currentPrice).split(',')[1]}
                        </span>
                      </>
                    )}
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
                  Pagamento seguro via Asaas
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

      {/* Modal de Confirmação de Dados */}
      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-2xl"
            >
              {/* Header do Modal */}
              <div className="relative border-b border-primary/10 bg-primary/5 px-6 py-8 text-center sm:px-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Confira seus dados</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Verifique se tudo está correto para garantir o seu acesso.
                </p>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Corpo do Modal */}
              <div className="px-6 py-8 sm:px-10">
                <div className="space-y-4">
                  <div className="group flex items-center gap-4 rounded-2xl border border-primary/5 bg-muted/30 p-4 transition-colors hover:border-primary/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</p>
                      <p className="font-semibold text-foreground">{formData.nome}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="group flex items-center gap-4 rounded-2xl border border-primary/5 bg-muted/30 p-4 transition-colors hover:border-primary/20">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">E-mail</p>
                        <p className="truncate font-semibold text-foreground">{formData.email}</p>
                      </div>
                    </div>

                    <div className="group flex items-center gap-4 rounded-2xl border border-primary/5 bg-muted/30 p-4 transition-colors hover:border-primary/20">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</p>
                        <p className="font-semibold text-foreground">{formData.telefone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="group flex items-center gap-4 rounded-2xl border border-primary/5 bg-muted/30 p-4 transition-colors hover:border-primary/20">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CPF</p>
                        <p className="font-semibold text-foreground">{formData.cpf}</p>
                      </div>
                    </div>

                    <div className="group flex items-center gap-4 rounded-2xl border border-primary/5 bg-muted/30 p-4 transition-colors hover:border-primary/20">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modalidade</p>
                        <p className="font-bold text-primary">{formData.modality === 'presencial' ? 'Presencial' : 'Online'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <Button
                    onClick={processEnrollment}
                    size="lg"
                    className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Confirmar e Ir para Pagamento
                  </Button>
                  <Button
                    onClick={() => setShowConfirmation(false)}
                    variant="ghost"
                    className="h-12 w-full rounded-2xl text-muted-foreground hover:bg-primary/5"
                  >
                    Corrigir Informações
                  </Button>
                </div>

                <p className="mt-6 text-center text-[10px] text-muted-foreground">
                  Ao confirmar, você será redirecionado para o ambiente seguro de pagamento do Asaas.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
