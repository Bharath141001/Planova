import { useEffect } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { Bold, Italic, List, ListOrdered, Code, Heading2 } from 'lucide-react';
import { cx } from '@/utils/cx';
import { userService } from '@/services/userService';
import { MentionList, type MentionListRef } from './MentionList';
import styles from './RichTextEditor.module.scss';

// Configured once at module level — the render() closure is re-created per trigger.
const mentionExtension = Mention.configure({
  HTMLAttributes: { 'data-type': 'mention', class: styles.mention },
  suggestion: {
    char: '@',
    items: async ({ query }: { query: string }) => {
      if (!query) return [];
      return userService.search(query).then((u) => u.slice(0, 8)).catch(() => []);
    },
    render: () => {
      let component: ReactRenderer<MentionListRef> | null = null;
      let wrapper: HTMLElement | null = null;

      const setPosition = (props: { clientRect?: (() => DOMRect | null) | null }) => {
        const rect = props.clientRect?.();
        if (rect && wrapper) {
          wrapper.style.top = `${rect.bottom + 4}px`;
          wrapper.style.left = `${rect.left}px`;
        }
      };

      return {
        onStart(props) {
          wrapper = document.createElement('div');
          wrapper.style.cssText = 'position:fixed;z-index:9999;';
          document.body.appendChild(wrapper);
          component = new ReactRenderer(MentionList, { props, editor: props.editor });
          wrapper.appendChild(component.element);
          setPosition(props);
        },
        onUpdate(props) {
          component?.updateProps(props);
          setPosition(props);
        },
        onKeyDown(props) {
          if (props.event.key === 'Escape') {
            wrapper?.remove();
            wrapper = null;
            return true;
          }
          return (component?.ref as MentionListRef | null)?.onKeyDown(props) ?? false;
        },
        onExit() {
          wrapper?.remove();
          wrapper = null;
          component?.destroy();
          component = null;
        },
      };
    },
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Add a description…',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder }), mentionExtension],
    content: value,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  return (
    <div className={styles.editorWrap}>
      {editable && (
        <div className={styles.toolbar}>
          {[
            { label: 'Bold', icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
            { label: 'Italic', icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
            { label: 'Heading', icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
            { label: 'Bullet list', icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
            { label: 'Numbered list', icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
            { label: 'Code', icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
          ].map(({ label, icon: Icon, action, active }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onClick={action}
              className={cx(styles.toolbarBtn, active && styles.toolbarBtnActive)}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      )}
      <div className={styles.editorContent}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export function RichTextView({ html }: { html: string | null | undefined }) {
  if (!html || html === '<p></p>') {
    return <p className={styles.emptyView}>No description.</p>;
  }
  return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
