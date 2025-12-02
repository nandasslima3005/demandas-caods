import { cn } from '@/lib/utils';
import { Priority, PRIORITY_LABELS } from '@/types/request';
import { ArrowDown, ArrowRight, ArrowUp, AlertTriangle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  showIcon?: boolean;
}

const priorityConfig: Record<Priority, { icon: React.ElementType; className: string }> = {
  baixa: {
    icon: ArrowDown,
    className: 'bg-priority-low/15 text-priority-low border-priority-low/30',
  },
  media: {
    icon: ArrowRight,
    className: 'bg-priority-medium/15 text-priority-medium border-priority-medium/30',
  },
  alta: {
    icon: ArrowUp,
    className: 'bg-priority-high/15 text-priority-high border-priority-high/30',
  },
  urgente: {
    icon: AlertTriangle,
    className: 'bg-priority-urgent/15 text-priority-urgent border-priority-urgent/30 animate-pulse-subtle',
  },
};

export function PriorityBadge({ priority, className, showIcon = true }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
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
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
