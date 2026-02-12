import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserPlus, CreditCard, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function DashboardQuickActions() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const actions = [
        {
            label: "Nova Matrícula",
            icon: UserPlus,
            onClick: () => navigate("/admin/matriculas/nova"),
            color: "bg-blue-500",
        },
        {
            label: "Lançar Pagamento",
            icon: CreditCard,
            onClick: () => navigate("/admin/financeiro/novo"),
            color: "bg-emerald-500",
        },
        {
            label: "Realizar Chamada",
            icon: ClipboardCheck,
            onClick: () => navigate("/admin/presenca"),
            color: "bg-purple-500",
        },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
            <AnimatePresence>
                {isOpen && (
                    <div className="absolute bottom-16 right-0 space-y-3 flex flex-col items-end">
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.label}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className="flex items-center gap-3"
                            >
                                <span className="text-sm font-medium bg-white px-2 py-1 rounded-md shadow-sm dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                    {action.label}
                                </span>
                                <Button
                                    size="icon"
                                    className={`h-10 w-10 rounded-full shadow-lg ${action.color} hover:opacity-90 transition-opacity`}
                                    onClick={() => {
                                        action.onClick();
                                        setIsOpen(false);
                                    }}
                                >
                                    <action.icon className="h-5 w-5 text-white" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <Button
                size="icon"
                className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary hover:bg-primary/90"
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </Button>
        </div>
    );
}
