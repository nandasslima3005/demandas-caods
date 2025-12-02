import { cn } from '@/lib/utils';
import { Status, STATUS_LABELS } from '@/types/request';
import { Clock, FileSearch, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<Status, { icon: React.ElementType; className: string }> = {
  pendente: {
    icon: Clock,
    className: 'bg-status-pending/15 text-status-pending border-status-pending/30',
  },
  em_analise: {
    icon: FileSearch,
    className: 'bg-status-analysis/15 text-status-analysis border-status-analysis/30',
  },
  em_andamento: {
    icon: Loader2,
    className: 'bg-status-progress/15 text-status-progress border-status-progress/30',
  },
  aguardando_resposta: {
    icon: MessageCircle,
    className: 'bg-status-waiting/15 text-status-waiting border-status-waiting/30',
  },
  concluido: {
    icon: CheckCircle2,
    className: 'bg-status-completed/15 text-status-completed border-status-completed/30',
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {STATUS_LABELS[status]}
    </span>
  );
}
