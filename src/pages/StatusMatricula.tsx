import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatusType = "pending" | "approved" | "rejected" | null;

interface StatusInfo {
  status: StatusType;
  name: string;
  email: string;
  turma: string;
  matricula?: string;
}

export default function StatusMatricula() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);

  useEffect(() => {
    document.title = "Escola do Reino - Status da Matrícula";
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusInfo(null);

    try {
      // Import dynamically to avoid circular dependencies if any, though standard import is fine usually.
      // Better to import at top, but for replace_file_content I'll add imports in a separate step or assume I can do it here if I replace enough.
      // actually I need to add the import first.

      const { studentsService } = await import("@/services/studentsService");
      const student = await studentsService.getStudentByEmail(email);

      if (student) {
        setStatusInfo({
          status: student.status === 'ativo' ? 'approved' : 'pending', // Mapeamento básico
          name: student.name,
          email: student.email || email,
          turma: student.class_name || "Turma não definida",
          matricula: student.registration_number || undefined,
        });
      } else {
        // Se não encontrar, ou mostramos erro ou null.
        // Para manter a UX, se não achar, assumimos que não tem matrícula ou foi rejeitado/não existe.
        // Vou setar null, mas talvez o user queira ver "recusado" se não achar?
        // O mock retornava "recusado" para emails específicos.
        // Aqui, se não existe, é "Não Encontrado".
        setStatusInfo(null);
        // Poderia mostrar um toast ou mensagem de erro
        console.log("Aluno não encontrado");
      }

    } catch (error) {
      console.error("Erro ao buscar status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!statusInfo) return null;

    switch (statusInfo.status) {
      case "approved":
        return (
          <div className="rounded-2xl border border-success/30 bg-success/10 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-success">
                  Matrícula Aprovada!
                </h3>
                <p className="text-sm text-muted-foreground">Pagamento confirmado</p>
              </div>
            </div>
            <div className="space-y-3 border-t border-success/20 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Aluno</span>
                <span className="font-medium">{statusInfo.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Matrícula</span>
                <span className="font-medium">#{statusInfo.matricula}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Turma</span>
                <span className="font-medium">{statusInfo.turma}</span>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/portal">
                <Button className="w-full gap-2">
                  Acessar Portal do Aluno
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        );

      case "pending":
        return (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-warning">
                  Aguardando Pagamento
                </h3>
                <p className="text-sm text-muted-foreground">Seu pagamento está sendo processado</p>
              </div>
            </div>
            <div className="space-y-3 border-t border-warning/20 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Aluno</span>
                <span className="font-medium">{statusInfo.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Turma</span>
                <span className="font-medium">{statusInfo.turma}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-background p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground">
                  Caso já tenha efetuado o pagamento, aguarde até 24h úteis para a confirmação.
                  Se o problema persistir, entre em contato conosco.
                </p>
              </div>
            </div>
          </div>
        );

      case "rejected":
        return (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-destructive">
                  Pagamento Recusado
                </h3>
                <p className="text-sm text-muted-foreground">Houve um problema com seu pagamento</p>
              </div>
            </div>
            <div className="space-y-3 border-t border-destructive/20 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Aluno</span>
                <span className="font-medium">{statusInfo.name}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-background p-3">
              <p className="text-sm text-muted-foreground">
                Por favor, tente novamente com outro método de pagamento ou entre em contato
                com nossa equipe para mais informações.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/matricula">
                <Button variant="outline" className="w-full gap-2">
                  Tentar Novamente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="mb-4 font-display text-3xl font-bold">
                Status da Matrícula
              </h1>
              <p className="mb-8 text-muted-foreground">
                Verifique o status do seu processo de matrícula.
              </p>
            </motion.div>

            {!statusInfo ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail da inscrição</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">Código de verificação (opcional)</Label>
                    <Input
                      id="token"
                      placeholder="Enviado por e-mail"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? (
                      "Buscando..."
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Consultar Status
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {getStatusDisplay()}
                <Button
                  variant="ghost"
                  className="mt-4 w-full"
                  onClick={() => setStatusInfo(null)}
                >
                  Fazer nova consulta
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
