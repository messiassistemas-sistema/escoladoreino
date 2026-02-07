import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "A Escola do Reino transformou minha forma de estudar a Bíblia. Os professores são excelentes e o conteúdo é muito rico.",
    author: "Maria Silva",
    role: "Aluna formada em 2023",
  },
  {
    quote: "O conhecimento que adquiri aqui me capacitou para liderar melhor minha célula e servir com mais excelência na igreja.",
    author: "João Santos",
    role: "Aluno formado em 2022",
  },
  {
    quote: "A estrutura das aulas e o material didático são de alta qualidade. Recomendo a todos que desejam se aprofundar na Palavra.",
    author: "Ana Oliveira",
    role: "Aluna formada em 2024",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-muted/50 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-block text-sm font-medium text-secondary"
          >
            Depoimentos
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-4 font-display text-3xl font-bold md:text-4xl"
          >
            O que nossos alunos dizem
          </motion.h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-secondary/20" />
              <p className="mb-6 text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display font-semibold text-primary">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
