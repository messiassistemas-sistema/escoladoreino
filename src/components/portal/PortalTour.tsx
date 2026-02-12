import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';

interface PortalTourProps {
    runOnMount?: boolean;
}

export const PortalTour: React.FC<PortalTourProps> = ({ runOnMount = false }) => {
    const [run, setRun] = useState(false);
    const { user, role } = useAuth();

    if (role !== 'admin') {
        return null;
    }

    useEffect(() => {
        // Check if user has already completed the tour
        const tourCompleted = localStorage.getItem(`tour_completed_${user?.id}`);
        if (!tourCompleted && runOnMount) {
            // Delay slightly to ensure elements are rendered
            const timer = setTimeout(() => {
                setRun(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user?.id, runOnMount]);

    // Listen for global events to restart the tour
    useEffect(() => {
        const handleRestartTour = () => {
            setRun(true);
        };
        window.addEventListener('restart-portal-tour', handleRestartTour);
        return () => window.removeEventListener('restart-portal-tour', handleRestartTour);
    }, []);

    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            title: '🎓 Bem-vindo à sua jornada acadêmica!',
            content: 'Este é o seu portal do aluno. Vamos fazer um tour rápido pelos recursos que vão impulsionar seus estudos na Escola do Reino.',
            disableBeacon: true,
        },
        {
            target: '#tour-stats',
            title: '📊 Seu Progresso em Tempo Real',
            content: 'Aqui você acompanha sua média geral, frequência nas aulas e comunicados pendentes. Mantenha esses números em dia para um desempenho excelente.',
        },
        {
            target: '#tour-agenda',
            title: '📅 Agenda de Aulas',
            content: 'Não perca nenhum conteúdo! Veja aqui as próximas aulas, horários e acesse as gravações caso precise rever algum ponto.',
        },
        {
            target: '#tour-performance',
            title: '📈 Desempenho por Disciplina',
            content: 'Acompanhe como você está se saindo em cada matéria específica. A consistência é a chave para o aprendizado teológico profundo.',
        },
        {
            target: '#tour-nav-home',
            title: '🏠 Início',
            content: 'Sempre que precisar voltar para esta visão geral, utilize este botão no menu.',
        },
        {
            target: '#tour-nav-grades',
            title: '📝 Notas e Médias',
            content: 'Acesse seu relatório detalhado de avaliações e sinta a alegria de ver seu crescimento documentado.',
        },
        {
            target: '#tour-nav-materials',
            title: '📚 Materiais de Estudo',
            content: 'O acervo de apostilas, slides e recursos complementares está todo aqui, organizado para sua facilidade.',
        },
        {
            target: '#tour-resources',
            title: '⚡ Recursos de Apoio',
            content: 'Acesse rapidamente a biblioteca virtual ou tire dúvidas com nossos tutores acadêmicos.',
        },
        {
            target: '#tour-profile-summary',
            title: '👤 Seu Perfil Acadêmico',
            content: 'Confira sua matrícula e turma. Clique aqui ou no menu "Meu Perfil" para atualizar seus dados e senha com segurança.',
        },
        {
            target: '#tour-logout',
            title: '🔒 Segurança',
            content: 'Ao terminar seus estudos, lembre-se de sair da conta, especialmente se estiver em um dispositivo compartilhado.',
        },
        {
            target: 'body',
            placement: 'center',
            title: '✨ Tudo Pronto!',
            content: 'O tour acabou, mas sua jornada apenas começou. Bons estudos e que este tempo seja de grande crescimento!',
        },
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem(`tour_completed_${user?.id}`, 'true');
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            callback={handleJoyrideCallback}
            locale={{
                back: 'Voltar',
                close: 'Fechar',
                last: 'Finalizar',
                next: 'Próximo',
                nextLabelWithProgress: 'Próximo ({step} de {steps})',
                skip: 'Pular Tour',
            }}
            styles={{
                options: {
                    primaryColor: '#eab308', // yellow-500 matching the portal's gold
                    backgroundColor: '#1a1b1e', // dark matching the portal
                    textColor: '#ffffff',
                    arrowColor: '#1a1b1e',
                    overlayColor: 'rgba(0, 0, 0, 0.75)',
                },
                tooltipContainer: {
                    textAlign: 'left',
                    borderRadius: '16px',
                    padding: '10px',
                },
                buttonNext: {
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    padding: '10px 20px',
                },
                buttonBack: {
                    marginRight: '10px',
                    fontWeight: 'bold',
                    color: '#eab308'
                },
                buttonSkip: {
                    color: '#9ca3af',
                    fontWeight: 'bold'
                },
            }}
        />
    );
};
