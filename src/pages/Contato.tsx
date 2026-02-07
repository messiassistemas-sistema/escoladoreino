import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

export default function Contato() {
  useEffect(() => {
    document.title = "Escola do Reino - Contato";
  }, []);

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    mensagem: "",
  });

  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsService.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  const contactInfo = {
    email: settings?.contact_email || "contato@escoladoreino.com.br",
    phone: settings?.contact_phone || "(11) 99999-9999",
    address: settings?.address || "Rua da Esperança, 123, Centro, Cidade - UF"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: formData.nome,
        email: formData.email,
        phone: formData.telefone,
        message: formData.mensagem,
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: "Recebemos sua mensagem e entraremos em contato em breve.",
      });
      setFormData({ nome: "", email: "", telefone: "", mensagem: "" });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar",
        description: "Houve um problema ao enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <h1 className="mb-4 font-display text-4xl font-bold">Entre em Contato</h1>
            <p className="text-muted-foreground">
              Tem alguma dúvida? Estamos aqui para ajudar!
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="mb-6 font-display text-xl font-semibold">
                  Informações de Contato
                </h2>

                <div className="space-y-4">
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">E-mail</div>
                      <div className="text-sm text-muted-foreground">
                        {contactInfo.email}
                      </div>
                    </div>
                  </a>

                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Telefone / WhatsApp</div>
                      <div className="text-sm text-muted-foreground">
                        {contactInfo.phone}
                      </div>
                    </div>
                  </a>

                  <div className="flex items-start gap-4 rounded-lg p-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Endereço</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-line">
                        {contactInfo.address}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="mb-4 font-display font-semibold">
                  Horário de Atendimento
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Segunda a Sexta</span>
                    <span>9h às 18h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sábado</span>
                    <span>9h às 12h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domingo</span>
                    <span>Fechado</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
                <h2 className="mb-6 font-display text-xl font-semibold">
                  Envie sua mensagem
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      placeholder="Seu nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nome: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone (opcional)</Label>
                    <Input
                      id="telefone"
                      placeholder="(11) 99999-9999"
                      value={formData.telefone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, telefone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem">Mensagem</Label>
                    <Textarea
                      id="mensagem"
                      placeholder="Como podemos ajudar?"
                      rows={5}
                      value={formData.mensagem}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, mensagem: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
