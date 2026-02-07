import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Award,
  Heart,
  Target,
  CheckCircle2
} from "lucide-react";

const valores = [
  {
    icon: BookOpen,
    title: "Excelência Bíblica",
    description: "Compromisso com o ensino fiel das Escrituras Sagradas.",
  },
  {
    icon: Heart,
    title: "Amor ao Próximo",
    description: "Formação de líderes que servem com amor e compaixão.",
  },
  {
    icon: Target,
    title: "Prática Ministerial",
    description: "Ensino que conecta teoria e prática no ministério.",
  },
  {
    icon: Users,
    title: "Comunhão",
    description: "Ambiente de comunhão e crescimento mútuo.",
  },
];

const diferenciais = [
  "Professores com formação acadêmica e experiência pastoral",
  "Material didático próprio e atualizado",
  "Aulas práticas e dinâmicas",
  "Acompanhamento individual do aluno",
  "Certificado reconhecido",
  "Flexibilidade de horários",
];

export default function Sobre() {
  useEffect(() => {
    document.title = "Escola do Reino - Sobre";
  }, []);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-hero py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-center"
            >
              <h1 className="mb-6 font-display text-4xl font-bold text-white md:text-5xl">
                Sobre a Escola do Reino
              </h1>
              <p className="text-lg text-white/90">
                Há mais de 8 anos formando homens e mulheres para o ministério
                cristão com excelência e compromisso bíblico.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-6 font-display text-3xl font-bold">Nossa História</h2>
                <div className="prose prose-lg text-muted-foreground">
                  <p>
                    A Escola do Reino nasceu em 2016 com a visão de oferecer formação
                    teológica acessível e de qualidade para todos aqueles que desejam
                    se aprofundar no conhecimento das Escrituras e se preparar para
                    o serviço no Reino de Deus.
                  </p>
                  <p>
                    Fundada por um grupo de pastores e teólogos comprometidos com a
                    excelência no ensino bíblico, nossa escola já formou mais de 500
                    alunos que hoje atuam em diversas frentes ministeriais, desde
                    liderança de células até pastorado de igrejas.
                  </p>
                  <p>
                    Nossa metodologia une o rigor acadêmico à aplicação prática,
                    garantindo que nossos alunos não apenas conheçam a teoria, mas
                    saibam aplicá-la em seu dia a dia ministerial.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Valores */}
        <section className="bg-muted/50 py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 font-display text-3xl font-bold">Nossos Valores</h2>
              <p className="text-muted-foreground">
                Os pilares que fundamentam nossa missão educacional.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {valores.map((valor, index) => (
                <motion.div
                  key={valor.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <valor.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 font-display font-semibold">{valor.title}</h3>
                  <p className="text-sm text-muted-foreground">{valor.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="py-20">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-6 font-display text-3xl font-bold">
                  Por que estudar na Escola do Reino?
                </h2>
                <p className="mb-8 text-muted-foreground">
                  Oferecemos uma formação completa que prepara você para servir
                  com excelência em qualquer área do ministério cristão.
                </p>
                <ul className="space-y-4">
                  {diferenciais.map((item, index) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="rounded-2xl bg-primary/10 p-6 text-center">
                  <div className="font-display text-4xl font-bold text-primary">500+</div>
                  <div className="mt-1 text-sm text-muted-foreground">Alunos formados</div>
                </div>
                <div className="rounded-2xl bg-secondary/20 p-6 text-center">
                  <div className="font-display text-4xl font-bold text-secondary">8</div>
                  <div className="mt-1 text-sm text-muted-foreground">Anos de história</div>
                </div>
                <div className="rounded-2xl bg-secondary/20 p-6 text-center">
                  <div className="font-display text-4xl font-bold text-secondary">12</div>
                  <div className="mt-1 text-sm text-muted-foreground">Disciplinas</div>
                </div>
                <div className="rounded-2xl bg-primary/10 p-6 text-center">
                  <div className="font-display text-4xl font-bold text-primary">15</div>
                  <div className="mt-1 text-sm text-muted-foreground">Professores</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
