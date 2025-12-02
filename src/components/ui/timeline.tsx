import { cn } from '@/lib/utils';
import { TimelineEvent, Status } from '@/types/request';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, FileSearch, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const statusIcons: Record<Status, React.ElementType> = {
  pendente: Clock,
  em_analise: FileSearch,
  em_andamento: Loader2,
  aguardando_resposta: MessageCircle,
  concluido: CheckCircle2,
};

const statusColors: Record<Status, string> = {
  pendente: 'bg-status-pending text-status-pending',
  em_analise: 'bg-status-analysis text-status-analysis',
  em_andamento: 'bg-status-progress text-status-progress',
  aguardando_resposta: 'bg-status-waiting text-status-waiting',
  concluido: 'bg-status-completed text-status-completed',
};

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {events.map((event, index) => {
        const Icon = statusIcons[event.status];
        const isLast = index === events.length - 1;
        const colorClass = statusColors[event.status];

        return (
          <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                colorClass.replace('text-', 'bg-').replace('bg-status', 'bg-status') + '/20'
              )}
            >
              <Icon className={cn('h-4 w-4', colorClass.split(' ')[1])} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground">{event.title}</h4>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{event.description}</p>
              {event.user && (
                <p className="text-xs text-muted-foreground mt-1">
                  Por: <span className="font-medium">{event.user}</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
