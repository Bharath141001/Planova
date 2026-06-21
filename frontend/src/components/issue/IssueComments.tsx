import { useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, MessageSquare, SmilePlus } from 'lucide-react';
import { useIssueComments, useCommentMutations } from '@/hooks/useIssue';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/Button';
import { RichTextEditor, RichTextView } from '@/components/common/RichTextEditor';
import { Dropdown } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGate } from '@/components/common/PermissionGate';
import { timeAgo } from '@/utils/formatters';
import { REACTION_EMOJIS } from '@/utils/constants';
import { cx } from '@/utils/cx';
import type { Comment } from '@/types/issue.types';
import styles from './IssueComments.module.scss';

export function IssueComments({ issueKey }: { issueKey: string }) {
  const { data: comments = [], isLoading } = useIssueComments(issueKey);
  const { add } = useCommentMutations(issueKey);
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim() || draft === '<p></p>') return;
    add.mutate({ body: draft }, { onSuccess: () => setDraft('') });
  };

  return (
    <div className={styles.root}>
      <PermissionGate permission="comment:create">
        <div className={styles.composeRow}>
          <Avatar user={useAuthStore.getState().user} size="md" />
          <div className={styles.composeBody}>
            <RichTextEditor value={draft} onChange={setDraft} placeholder="Add a comment… use @ to mention" />
            <div className={styles.composeActions}>
              <Button size="sm" onClick={submit} loading={add.isPending}>Comment</Button>
            </div>
          </div>
        </div>
      </PermissionGate>

      {isLoading ? (
        <p className={styles.empty}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className={styles.empty}>
          <MessageSquare size={16} /> No comments yet.
        </p>
      ) : (
        <ul className={styles.list}>
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} issueKey={issueKey} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({ comment, issueKey }: { comment: Comment; issueKey: string }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { update, remove, react } = useCommentMutations(issueKey);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwn = comment.authorId === currentUserId;

  const reactionGroups = comment.reactions.reduce<Record<string, { count: number; users: string[]; hasMe: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], hasMe: false };
    acc[r.emoji].count += 1;
    acc[r.emoji].users.push(r.user.displayName);
    if (r.userId === currentUserId) acc[r.emoji].hasMe = true;
    return acc;
  }, {});

  const myCurrentEmoji = Object.keys(reactionGroups).find((e) => reactionGroups[e].hasMe) ?? null;

  const handleReact = async (emoji: string) => {
    if (myCurrentEmoji && myCurrentEmoji !== emoji) {
      await react.mutateAsync({ commentId: comment.id, emoji: myCurrentEmoji });
    }
    react.mutate({ commentId: comment.id, emoji });
  };

  return (
    <li className={styles.item}>
      <Avatar user={comment.author} size="md" />
      <div className={styles.itemBody}>
        <div className={styles.itemMeta}>
          <span className={styles.authorName}>{comment.author.displayName}</span>
          <span className={styles.timestamp}>{timeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className={styles.timestamp}>(edited)</span>}
        </div>

        {editing ? (
          <div>
            <RichTextEditor value={body} onChange={setBody} />
            <div className={styles.editActions}>
              <Button size="sm" onClick={() => update.mutate({ commentId: comment.id, body }, { onSuccess: () => setEditing(false) })} loading={update.isPending}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className={styles.commentBody}>
            <RichTextView html={comment.body} />
          </div>
        )}

        <div className={styles.reactions}>
          {Object.entries(reactionGroups).map(([emoji, { count, users, hasMe }]) => (
            <Tooltip key={emoji} content={users.join(', ')}>
              <button
                onClick={() => void handleReact(emoji)}
                className={cx(styles.reactionBtn, hasMe && styles.reactionBtnActive)}
              >
                {emoji} {count}
              </button>
            </Tooltip>
          ))}
          <Dropdown
            trigger={
              <button className={styles.actionBtn} aria-label="Add reaction">
                <SmilePlus size={16} />
              </button>
            }
          >
            {(close) => (
              <div className={styles.emojiPicker}>
                {REACTION_EMOJIS.map((emoji) => {
                  const alreadyReacted = reactionGroups[emoji]?.hasMe ?? false;
                  return (
                    <button
                      key={emoji}
                      className={cx(styles.emojiBtn, alreadyReacted && styles.emojiBtnActive)}
                      onClick={() => { void handleReact(emoji); close(); }}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            )}
          </Dropdown>
          {isOwn && !editing && (
            <>
              <button onClick={() => setEditing(true)} className={styles.actionBtn} aria-label="Edit comment">
                <Pencil size={14} />
              </button>
              <button onClick={() => setConfirmDelete(true)} className={cx(styles.actionBtn, styles.danger)} aria-label="Delete comment">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete comment?"
        message="This cannot be undone."
        destructive
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(comment.id, { onSuccess: () => { setConfirmDelete(false); toast.success('Comment deleted'); } })}
      />
    </li>
  );
}
