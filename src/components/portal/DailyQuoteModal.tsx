import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Check } from "lucide-react";
import { dailyQuotesService, DailyQuote } from "@/services/dailyQuotesService";
import { motion, AnimatePresence } from "framer-motion";

export function DailyQuoteModal() {
    const [open, setOpen] = useState(false);
    const [quote, setQuote] = useState<DailyQuote | null>(null);

    useEffect(() => {
        const checkQuote = async () => {
            const today = new Date().toISOString().split('T')[0];
            const lastShown = localStorage.getItem("last_daily_quote_shown");

            if (lastShown !== today) {
                const dailyQuote = await dailyQuotesService.getQuoteOfTheDay();
                if (dailyQuote) {
                    setQuote(dailyQuote);
                    setOpen(true);
                }
            }
        };

        checkQuote();
    }, []);

    const handleClose = () => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem("last_daily_quote_shown", today);
        setOpen(false);
    };

    if (!quote) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] border-none bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden p-0">
                <div className="relative p-8 pt-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1.5 w-24 bg-primary/20 rounded-b-full" />

                    <DialogHeader className="items-center text-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
                            <BookOpen className="h-8 w-8" />
                        </div>
                        <DialogTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
                            Palavra para o Coração
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-8 relative italic">
                        <span className="absolute -top-6 -left-2 text-6xl text-primary/10 font-serif leading-none">“</span>
                        <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground/90 text-center px-4 relative z-10">
                            {quote.content}
                        </p>
                        <span className="absolute -bottom-10 -right-2 text-6xl text-primary/10 font-serif leading-none">”</span>
                    </div>

                    <div className="mt-10 text-center">
                        <div className="h-px w-12 bg-primary/30 mx-auto mb-3" />
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
                            {quote.author || "Pr. Messias Tavares"}
                        </p>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <Button
                            onClick={handleClose}
                            className="rounded-2xl px-12 py-6 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Check className="mr-2 h-5 w-5" />
                            Amém
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
