import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { landingService } from "@/services/landingService";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
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
      setSelectedCourseTitle(cursoSelecionado);
    } else if (content?.courses_data && content.courses_data.length > 0 && !selectedCourseTitle) {
      setSelectedCourseTitle(content.courses_data[0].title);
    }
  }, [cursoSelecionado, content]);

  const selectedCourseData = content?.courses_data?.find(c => c.title.trim() === selectedCourseTitle.trim());
  // Default to 100.00 if no price set found.
  const currentPrice = selectedCourseData?.price || 100.00;

  // const courseTitle = selectedCourseData?.title || "Curso (Selecione na página anterior)";

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      toast({
        title: "Atenção",
        description: "Você precisa aceitar os termos para continuar.",
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
        average_grade: 0
      });

      // 2. Create Asaas Customer
      const cleanCpf = formData.cpf.replace(/\D/g, "");
      const cleanPhone = formData.telefone.replace(/\D/g, "");

      const customer = await asaasService.createCustomer({
        name: formData.nome,
        email: formData.email,
        cpfCnpj: cleanCpf || "00000000000", // Fallback for sandbox if empty, but usually required
        mobilePhone: cleanPhone,
        externalReference: formData.email
      });

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
                    setFormData(prev => ({ ...prev, class_name: value }));
                  }}
                >
                  <SelectTrigger className="w-full bg-background/50 backdrop-blur-sm border-primary/20 h-11 text-lg">
                    <SelectValue placeholder="Selecione um curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {content?.courses_data?.map((course) => (
                      <SelectItem key={course.title} value={course.title}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mb-8 text-muted-foreground">
                Valor da Inscrição: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPrice)}</strong>
              </p>
              <p className="mb-8 text-muted-foreground">
                Preencha seus dados para iniciar o processo de matrícula.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="cpf">CPF (opcional)</Label>
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
                  Pagamento seguro via Mercado Pago
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
        </div >
      </main >
      <Footer />
    </div >
  );
}
