import { issueTypeMeta } from '@/utils/issueHelpers';
import { Tooltip } from '@/components/ui/Tooltip';
import type { IssueType } from '@/types/common.types';

export function IssueTypeIcon({ type, className }: { type: IssueType; className?: string }) {
  const meta = issueTypeMeta(type);
  return (
    <Tooltip content={meta.label}>
      <span className={className} aria-label={meta.label} role="img">
        {meta.icon}
      </span>
    </Tooltip>
  );
}
