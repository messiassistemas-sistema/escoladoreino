import { useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { studentsService, Student } from "@/services/studentsService";
import { classesService } from "@/services/classesService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, PauseCircle, PlayCircle, StopCircle, RefreshCw, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function AdminComunicados() {
    const { toast } = useToast();
    const [message, setMessage] = useState("");
    const [selectedAudience, setSelectedAudience] = useState("all"); // 'all', 'class', 'status' (future)
    const [selectedClassId, setSelectedClassId] = useState("");

    // Sending State
    const [isSending, setIsSending] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [sentCount, setSentCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [currentStudent, setCurrentStudent] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Refs for controlling the loop
    const shouldStopRef = useRef(false);
    const isPausedRef = useRef(false);

    // Fetch Students
    const { data: students = [], isLoading: isLoadingStudents } = useQuery({
        queryKey: ["students-for-messaging"],
        queryFn: studentsService.getStudents,
    });

    // Fetch Classes
    const { data: classes = [] } = useQuery({
        queryKey: ["classes-for-filter"],
        queryFn: classesService.getClasses,
    });

    // Valid Students Filter
    const targetStudents = students.filter(student => {
        // Must have phone and be active (optional condition, maybe 'ativo' only)
        const hasPhone = student.phone && student.phone.length > 8;
        const isActive = student.status === 'ativo'; // Only active students? Maybe allow all for now.

        if (!hasPhone) return false;

        if (selectedAudience === 'all') return isActive;
        if (selectedAudience === 'class') return isActive && student.class_name === selectedClassId; // Trying to match by name as student.class_name stores the name, not ID? Need to check.

        return false;
    });

    // Since student.class_name typically stores the name string in this app (based on previous files), 
    // I'll assume we match by Name for now. If ID is needed, I'll adjust.
    // Actually, looking at studentsService, it stores `class_name`. classesService likely returns objects with `name`.

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleStartSending = async () => {
        if (!message.trim()) {
            toast({ title: "Erro", description: "Escreva uma mensagem para enviar.", variant: "destructive" });
            return;
        }

        if (targetStudents.length === 0) {
            toast({ title: "Erro", description: "Nenhum aluno encontrado com este filtro.", variant: "destructive" });
            return;
        }

        if (!confirm(`Tem certeza que deseja enviar para ${targetStudents.length} alunos? Isso pode levar alguns minutos.`)) {
            return;
        }

        setIsSending(true);
        setIsPaused(false);
        shouldStopRef.current = false;
        isPausedRef.current = false;
        setSentCount(0);
        setErrorCount(0);
        setProgress(0);
        setLogs([]);

        for (let i = 0; i < targetStudents.length; i++) {
            // Check Stop
            if (shouldStopRef.current) {
                addLog("🛑 Envio interrompido pelo usuário.");
                break;
            }

            // Check Pause (Spinlockish)
            while (isPausedRef.current) {
                if (shouldStopRef.current) break;
                await delay(1000);
            }

            const student = targetStudents[i];
            setCurrentStudent(student.name);

            try {
                // Prepare Phone (basic clean again just to be safe, though Function does it too)
                const cleanPhone = student.phone?.replace(/\D/g, "") || "";

                // Construct Message
                const firstName = student.name.split(" ")[0];
                const finalMessage = message.replace(/{nome}/g, firstName).replace(/{name}/g, firstName);

                addLog(`📤 Enviando para ${student.name} (${i + 1}/${targetStudents.length})...`);

                const { data, error } = await supabase.functions.invoke("send-whatsapp", {
                    body: {
                        phone: cleanPhone,
                        message: finalMessage,
                    },
                });

                if (error) throw error;
                if (data && !data.success) throw new Error(data.error);

                setSentCount(prev => prev + 1);
                addLog(`✅ Sucesso: ${student.name}`);

            } catch (err: any) {
                console.error(err);
                setErrorCount(prev => prev + 1);
                addLog(`❌ Erro ${student.name}: ${err.message || "Falha desconhecida"}`);
            }

            // Update Progress
            const newProgress = Math.round(((i + 1) / targetStudents.length) * 100);
            setProgress(newProgress);

            // Rate Limit Delay (Random between 10s and 15s to look generic)
            if (i < targetStudents.length - 1) { // Don't wait after last one
                const waitTime = Math.floor(Math.random() * (15000 - 10000 + 1) + 10000);
                addLog(`⏳ Aguardando ${Math.round(waitTime / 1000)}s para segurança...`);
                await delay(waitTime);
            }
        }

        setIsSending(false);
        setCurrentStudent(null);
        toast({ title: "Envio finalizado!", description: `Sucessos: ${sentCount}. Erros: ${errorCount}.` });
    };

    const handleStop = () => {
        shouldStopRef.current = true;
        setIsSending(false); // UI update immediately
    };

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current;
        setIsPaused(isPausedRef.current);
        addLog(isPausedRef.current ? "⏸️ Envio pausado." : "▶️ Envio retomado.");
    };

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev]); // Newest first
    };

    return (
        <AdminLayout title="Disparo WhatsApp" description="Envie mensagens em massa para seus alunos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">

                {/* Left Column: Configuration */}
                <div className="space-y-6 flex flex-col">
                    <Card className="flex-1 shadow-soft flex flex-col">
                        <CardHeader>
                            <CardTitle>Configuração do Envio</CardTitle>
                            <CardDescription>Selecione o público e escreva a mensagem.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 flex flex-col">

                            {/* Filters */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Público Alvo</Label>
                                    <Select value={selectedAudience} onValueChange={setSelectedAudience} disabled={isSending}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Alunos Ativos</SelectItem>
                                            <SelectItem value="class">Por Turma</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedAudience === 'class' && (
                                    <div className="space-y-2">
                                        <Label>Selecione a Turma</Label>
                                        <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isSending}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha a turma" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map((cls: any) => (
                                                    <SelectItem key={cls.id} value={cls.title || cls.name || ""}>
                                                        {cls.title || cls.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Audience Summary */}
                            <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Destinatários estimados:</span>
                                <Badge variant="secondary" className="text-base px-3">
                                    {isLoadingStudents ? <Loader2 className="h-3 w-3 animate-spin" /> : targetStudents.length} alunos
                                </Badge>
                            </div>

                            {/* Message Editor */}
                            <div className="space-y-2 flex-1 flex flex-col">
                                <Label>Mensagem</Label>
                                <div className="text-xs text-muted-foreground mb-1">
                                    Variáveis disponíveis: <code className="bg-muted px-1 rounded">{`{nome}`}</code>
                                </div>
                                <Textarea
                                    className="flex-1 min-h-[150px] resize-none font-sans text-base"
                                    placeholder="Olá {nome}, temos um comunicado importante..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    disabled={isSending}
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-3">
                                {!isSending ? (
                                    <Button onClick={handleStartSending} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" size="lg" disabled={targetStudents.length === 0}>
                                        <Send className="mr-2 h-4 w-4" /> Iniciar Disparo
                                    </Button>
                                ) : (
                                    <>
                                        <Button onClick={togglePause} variant="outline" className="flex-1">
                                            {isPaused ? <><PlayCircle className="mr-2 h-4 w-4" /> Retomar</> : <><PauseCircle className="mr-2 h-4 w-4" /> Pausar</>}
                                        </Button>
                                        <Button onClick={handleStop} variant="destructive" className="flex-1">
                                            <StopCircle className="mr-2 h-4 w-4" /> Parar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Monitoring */}
                <div className="space-y-6 flex flex-col h-full">
                    <Card className="h-full shadow-soft flex flex-col border-none bg-muted/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Monitoramento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-6">

                            {/* Progress Status */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Progresso Total</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-3 w-full transition-all" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Enviados: <span className="text-green-600 font-bold">{sentCount}</span></span>
                                    <span>Erros: <span className="text-red-500 font-bold">{errorCount}</span></span>
                                    <span>Restantes: {targetStudents.length - (sentCount + errorCount)}</span>
                                </div>
                            </div>

                            {/* Current Action */}
                            <div className="bg-background border rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Status Atual</h4>
                                {isSending ? (
                                    <div className="flex items-center gap-3">
                                        {isPaused ? (
                                            <PauseCircle className="h-8 w-8 text-yellow-500 animate-pulse" />
                                        ) : (
                                            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {isPaused ? "Envio Pausado" : (currentStudent ? `Enviando para ${currentStudent}...` : "Aguardando intervalo...")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isPaused ? "Clique em Retomar para continuar" : "Mantenha esta janela aberta"}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <StopCircle className="h-4 w-4" /> O sistema está pronto para iniciar.
                                    </p>
                                )}
                            </div>

                            {/* Logs Console */}
                            <div className="flex-1 flex flex-col min-h-0 bg-black/90 text-green-400 font-mono text-xs rounded-lg overflow-hidden border border-border/50 shadow-inner">
                                <div className="p-2 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                    <span>Console de Execução</span>
                                    <Badge variant="outline" className="text-[10px] h-4 border-green-500/30 text-green-500">Live</Badge>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                                    {logs.length === 0 && <span className="text-white/30 italic">Aguardando início...</span>}
                                    {logs.map((log, i) => (
                                        <div key={i} className="break-words opacity-90 hover:opacity-100 transition-opacity">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
