import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { landingService } from "@/services/landingService";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cursos() {
    useEffect(() => {
        document.title = "Escola do Reino - Nossos Cursos";
    }, []);

    const { data: content, isLoading } = useQuery({
        queryKey: ["landing-content"],
        queryFn: landingService.getContent,
    });

    const cursos = content?.courses_data || [];

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="bg-gradient-hero py-20 text-white">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-3xl text-center"
                        >
                            <h1 className="mb-6 font-display text-4xl font-bold md:text-5xl">
                                Nossos Cursos
                            </h1>
                            <p className="text-lg text-white/90">
                                Conheça nossa grade curricular e escolha o caminho ideal para sua
                                jornada de crescimento espiritual e ministerial.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Cursos Grid */}
                <section className="py-20">
                    <div className="container">
                        {isLoading ? (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {cursos.length > 0 ? (
                                    cursos.map((curso, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex flex-col rounded-2xl border border-border bg-card shadow-soft transition-all hover:shadow-elevated hover:scale-[1.02] overflow-hidden"
                                        >
                                            <div className="bg-primary/5 p-6 border-b border-border/50">
                                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                                    <BookOpen className="h-6 w-6 text-primary" />
                                                </div>
                                                <h3 className="mb-2 font-display text-2xl font-bold">{curso.title}</h3>
                                                <p className="text-sm text-muted-foreground">{curso.description}</p>
                                            </div>

                                            <div className="flex-1 p-6">
                                                <div className="mb-6 space-y-3">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4 text-primary" />
                                                        <span>Duração: <span className="font-semibold text-foreground">{curso.duration}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <GraduationCap className="h-4 w-4 text-primary" />
                                                        <span>Nível: <span className="font-semibold text-foreground">{curso.level}</span></span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-8">
                                                    {(curso.features || []).map((feature, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-sm">
                                                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                                                            <span>{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-auto">
                                                    {curso.available !== false ? (
                                                        <Link to={`/matricula?curso=${encodeURIComponent(curso.title)}`} className="block">
                                                            <Button className="w-full rounded-xl font-bold" size="lg">
                                                                Inscreva-se Agora
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Button className="w-full rounded-xl font-bold opacity-80" size="lg" disabled>
                                                            Em breve
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                        <p>Nenhum curso cadastrado no momento.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-muted/50 py-20">
                    <div className="container">
                        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-hero text-white shadow-2xl">
                            <div className="relative p-12 text-center md:p-20">
                                <div className="absolute top-0 right-0 p-12 opacity-10">
                                    <GraduationCap className="h-64 w-64" />
                                </div>

                                <h2 className="relative mb-6 font-display text-3xl font-bold md:text-4xl text-white">
                                    Pronto para começar sua jornada?
                                </h2>
                                <p className="relative mb-8 text-lg text-white/90 max-w-2xl mx-auto">
                                    Não perca a oportunidade de aprofundar seu conhecimento e crescer espiritualmente.
                                    As matrículas estão abertas!
                                </p>
                                <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    <Link to="/matricula">
                                        <Button size="lg" className="min-w-[200px] rounded-xl bg-white text-primary hover:bg-white/90 font-bold shadow-lg shadow-black/20">
                                            Fazer Matrícula
                                        </Button>
                                    </Link>
                                    <Link to="/contato">
                                        <Button variant="outline" size="lg" className="min-w-[200px] rounded-xl border-white/20 text-white hover:bg-white/10 font-bold">
                                            Tirar Dúvidas
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
