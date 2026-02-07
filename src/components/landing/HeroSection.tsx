import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Users, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { landingService } from "@/services/landingService";

const stats = [
  { icon: Users, value: "500+", label: "Alunos formados" },
  { icon: BookOpen, value: "12", label: "Disciplinas" },
  { icon: Award, value: "8", label: "Anos de história" },
  { icon: Calendar, value: "2", label: "Anos de formação" },
];

export function HeroSection() {
  const { data: content } = useQuery({
    queryKey: ["landing-content"],
    queryFn: landingService.getContent,
  });

  const displayContent = content || {
    hero_badge: "Matrículas Abertas para 2025",
    hero_title: "Forme-se para servir ao Reino de Deus",
    hero_description: "A Escola do Reino oferece formação teológica sólida e prática, preparando homens e mulheres para o ministério cristão com excelência e compromisso bíblico.",
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-block rounded-full bg-secondary/20 px-4 py-1.5 text-sm font-medium text-secondary">
              {displayContent.hero_badge}
            </span>

          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            {displayContent.hero_title}
          </motion.h1>


          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-white/80"
          >
            {displayContent.hero_description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to="/matricula">
              <Button size="lg" variant="secondary" className="gap-2 shadow-gold">
                Quero me Matricular
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/cursos">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Conhecer o Curso
              </Button>
            </Link>

          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/5 p-4 text-center backdrop-blur-sm"
            >
              <stat.icon className="mx-auto mb-2 h-6 w-6 text-secondary" />
              <div className="font-display text-2xl font-bold text-white">
                {stat.value}
              </div>
              <div className="text-xs text-white/70">{stat.label}</div>
            </div>

          ))}
        </motion.div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
