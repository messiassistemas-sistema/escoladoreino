import { motion } from "framer-motion";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  Bell,
  QrCode,
  BarChart3
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Portal do Aluno",
    description: "Acompanhe suas notas, faltas e calendário de aulas em tempo real.",
  },
  {
    icon: QrCode,
    title: "Presença por QR Code",
    description: "Registre sua presença de forma rápida e segura via QR Code.",
  },
  {
    icon: FileText,
    title: "Materiais Didáticos",
    description: "Acesse apostilas, slides e recursos complementares online.",
  },
  {
    icon: Bell,
    title: "Mural de Avisos",
    description: "Fique por dentro de todas as novidades e comunicados.",
  },
  {
    icon: Calendar,
    title: "Calendário Integrado",
    description: "Visualize todas as aulas e eventos do seu curso.",
  },
  {
    icon: BarChart3,
    title: "Acompanhamento de Notas",
    description: "Veja seu desempenho por disciplina e média geral.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-block text-sm font-medium text-secondary"
          >
            Recursos do Sistema
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-4 font-display text-3xl font-bold md:text-4xl"
          >
            Tudo que você precisa em um só lugar
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground"
          >
            Uma plataforma completa para acompanhar sua jornada de formação teológica.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-card"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
