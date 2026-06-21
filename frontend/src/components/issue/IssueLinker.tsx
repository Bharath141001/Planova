import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { issueService } from '@/services/issueService';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { PermissionGate } from '@/components/common/PermissionGate';
import { LINK_TYPES, QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import type { Issue, IssueLink } from '@/types/issue.types';
import type { IssueLinkType } from '@/types/common.types';
import styles from './IssueLinker.module.scss';

export function IssueLinker({ issue }: { issue: Issue }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [targetKey, setTargetKey] = useState('');
  const [type, setType] = useState<IssueLinkType>('RELATES_TO');

  const add = useMutation({
    mutationFn: () => issueService.link(issue.key, targetKey.toUpperCase(), type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.issue(issue.key) });
      setAdding(false);
      setTargetKey('');
      toast.success('Issue linked');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (linkId: string) => issueService.unlink(issue.key, linkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.issue(issue.key) }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const links = [
    ...issue.sourceLinks.map((l) => ({ ...l, related: l.targetIssue })),
    ...issue.targetLinks.map((l) => ({ ...l, related: l.sourceIssue })),
  ] as (IssueLink & { related?: { key: string; title: string; status: string } })[];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h4 className={styles.sectionLabel}>
          <Link2 size={14} /> Linked issues
        </h4>
        <PermissionGate permission="issue:edit">
          <button onClick={() => setAdding((a) => !a)} className={styles.addBtn} aria-label="Add link">
            <Plus size={16} />
          </button>
        </PermissionGate>
      </div>

      {adding && (
        <div className={styles.addRow}>
          <Select value={type} onChange={(e) => setType(e.target.value as IssueLinkType)} className={styles.typeSelect}>
            {LINK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input value={targetKey} onChange={(e) => setTargetKey(e.target.value)} placeholder="ISSUE-123" className={styles.keyInput} />
          <Button size="sm" onClick={() => add.mutate()} loading={add.isPending} disabled={!targetKey}>Link</Button>
        </div>
      )}

      {links.length === 0 ? (
        <p className={styles.empty}>No linked issues.</p>
      ) : (
        <ul className={styles.list}>
          {links.map((l) => (
            <li key={l.id} className={styles.linkItem}>
              <span className={styles.linkType}>{LINK_TYPES.find((t) => t.value === l.type)?.label}</span>
              {l.related && <Link to={`/issues/${l.related.key}`} className={styles.linkKey}>{l.related.key}</Link>}
              <span className={styles.linkTitle}>{l.related?.title}</span>
              <PermissionGate permission="issue:edit">
                <button onClick={() => remove.mutate(l.id)} className={styles.removeBtn} aria-label="Remove link">
                  <X size={14} />
                </button>
              </PermissionGate>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
