import { ChevronsUp, ChevronUp, Equal, ChevronDown, Minus } from 'lucide-react';
import { priorityMeta } from '@/utils/issueHelpers';
import { Tooltip } from '@/components/ui/Tooltip';
import type { IssuePriority } from '@/types/common.types';

const icons: Record<IssuePriority, typeof ChevronUp> = {
  CRITICAL: ChevronsUp,
  HIGH: ChevronUp,
  MEDIUM: Equal,
  LOW: ChevronDown,
  NONE: Minus,
};

export function IssuePriorityIcon({ priority, className }: { priority: IssuePriority; className?: string }) {
  const meta = priorityMeta(priority);
  const Icon = icons[priority];
  return (
    <Tooltip content={`${meta.label} priority`}>
      <Icon size={16} className={className} style={{ color: meta.color }} aria-label={meta.label} />
    </Tooltip>
  );
}
