import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { useQuery } from "@tanstack/react-query";
import { landingService } from "@/services/landingService";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Escola do Reino - Formação Teológica";
  }, []);

  const { data: content, isLoading: isLandingLoading } = useQuery({
    queryKey: ["landing-content"],
    queryFn: landingService.getContent,
  });

  if (loading || isLandingLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Carregando conteúdos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection content={content} />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection content={content} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
