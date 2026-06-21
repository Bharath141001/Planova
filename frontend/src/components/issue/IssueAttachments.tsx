import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, File as FileIcon, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { issueService } from '@/services/issueService';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/common/PermissionGate';
import { formatFileSize } from '@/utils/formatters';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import { cx } from '@/utils/cx';
import type { Attachment } from '@/types/issue.types';
import styles from './IssueAttachments.module.scss';

export function IssueAttachments({ issueKey, attachments }: { issueKey: string; attachments: Attachment[] }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => issueService.uploadAttachment(issueKey, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.issue(issueKey) }); toast.success('File attached'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => issueService.deleteAttachment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.issue(issueKey) }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => upload.mutate(f));
  };

  return (
    <div className={styles.root}>
      <PermissionGate permission="attachment:upload">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={cx(styles.dropZone, dragOver && styles.dragOver)}
        >
          <Upload size={24} />
          <p>Drag & drop files here, or</p>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} loading={upload.isPending}>
            Browse files
          </Button>
          <input ref={inputRef} type="file" multiple className={styles.hidden} onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </PermissionGate>

      {attachments.length > 0 && (
        <ul className={styles.fileList}>
          {attachments.map((a) => (
            <li key={a.id} className={styles.fileItem}>
              <FileIcon size={20} style={{ flexShrink: 0, color: 'var(--color-text-subtle)' }} />
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{a.fileName}</p>
                <p className={styles.fileSize}>{formatFileSize(a.fileSize)}</p>
              </div>
              <a href={a.fileUrl} target="_blank" rel="noreferrer" className={styles.fileAction} aria-label="Download">
                <Download size={16} />
              </a>
              <PermissionGate permission="attachment:upload">
                <button onClick={() => remove.mutate(a.id)} className={cx(styles.fileAction, styles.danger)} aria-label="Delete attachment">
                  <Trash2 size={16} />
                </button>
              </PermissionGate>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
