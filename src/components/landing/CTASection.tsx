import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { landingService } from "@/services/landingService";

export function CTASection() {
  const { data: content } = useQuery({
    queryKey: ["landing-content"],
    queryFn: landingService.getContent,
  });

  const displayContent = content || {
    cta_title: "Comece sua jornada de formação teológica hoje",
    cta_description: "Junte-se a centenas de alunos que já transformaram suas vidas através do conhecimento bíblico profundo.",
    pricing_installments: "12x de R$ 150",
    pricing_total: "ou R$ 1.500 à vista",
    benefits: [
      "Professores experientes e qualificados",
      "Material didático completo incluso",
      "Certificado reconhecido ao final",
      "Aulas presenciais e suporte online",
    ],
    course_duration: "2 anos",
    course_workload: "360 horas",
    course_modality: "Presencial",
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-16">
          {/* Decorative */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-4 font-display text-3xl font-bold text-white md:text-4xl"
              >
                {displayContent.cta_title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mb-6 text-white/80"
              >

                {displayContent.cta_description}
              </motion.p>

              <motion.ul
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mb-8 space-y-3"
              >
                {(displayContent.benefits || []).map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-white/90">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    {benefit}
                  </li>
                ))}


              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Link to="/matricula">
                  <Button size="lg" variant="secondary" className="gap-2 shadow-gold">
                    Matricule-se Agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="relative">
                <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
                  <div className="mb-4 text-center">
                    <span className="text-sm text-white/70">Investimento</span>
                    <div className="font-display text-4xl font-bold text-white">
                      {displayContent.pricing_installments}
                    </div>
                    <span className="text-sm text-white/70">{displayContent.pricing_total}</span>

                  </div>
                  <div className="space-y-2 text-sm text-white/80">
                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
                      <span>Duração</span>
                      <span className="font-medium text-white">{displayContent.course_duration}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
                      <span>Carga horária</span>
                      <span className="font-medium text-white">{displayContent.course_workload}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
                      <span>Modalidade</span>
                      <span className="font-medium text-white">{displayContent.course_modality}</span>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
