import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Video, BookOpen, AlignLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LessonDetailsDialogProps {
    lesson: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LessonDetailsDialog({ lesson, open, onOpenChange }: LessonDetailsDialogProps) {
    if (!lesson) return null;

    const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const date = parseLocalDate(lesson.date);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="bg-primary/5 p-6 border-b border-border/50">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-background text-primary border-primary/20 uppercase tracking-widest text-[10px] font-black">
                                {lesson.subject?.name || "Disciplina"}
                            </Badge>
                            <Badge variant={lesson.mode === 'online' ? 'secondary' : 'outline'} className="uppercase tracking-widest text-[10px] font-black">
                                {lesson.mode}
                            </Badge>
                        </div>
                        <DialogTitle className="font-display text-2xl font-bold leading-tight">
                            {lesson.topic || lesson.subject?.name || "Aula"}
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground font-medium flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {date.toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long' })}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {/* Informações Básicas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border/50 shadow-sm">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Professor</p>
                                    <p className="font-semibold text-sm">{lesson.teacher_name || "A definir"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border/50 shadow-sm">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Horário</p>
                                    <p className="font-semibold text-sm">{lesson.time}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 md:col-span-2">
                                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border/50 shadow-sm">
                                    {lesson.mode === 'online' ? <Video className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        {lesson.mode === 'online' ? 'Link de Acesso' : 'Localização'}
                                    </p>
                                    <p className="font-semibold text-sm">{lesson.location || "A definir"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Descrição */}
                        {lesson.description && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlignLeft className="h-5 w-5 text-primary" />
                                    <h4 className="font-display text-lg font-bold">Sobre a Aula</h4>
                                </div>
                                <div className="prose prose-sm max-w-none text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
                                    <p className="whitespace-pre-line leading-relaxed">{lesson.description}</p>
                                </div>
                            </div>
                        )}

                        {!lesson.description && (
                            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                                <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground/50">Nenhuma descrição disponível para esta aula.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-6 pt-2 border-t border-border/50 bg-background">
                    <Button className="w-full font-bold shadow-lg" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
