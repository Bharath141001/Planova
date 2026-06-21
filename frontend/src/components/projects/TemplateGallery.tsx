import { cx } from '@/utils/cx';
import styles from './TemplateGallery.module.scss';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'SCRUM' | 'KANBAN';
  suggestedKey?: string;
  defaultColumns?: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'scrum-software',
    name: 'Software Development',
    description: 'Sprints, backlog, epics and velocity tracking for engineering teams.',
    icon: '💻',
    type: 'SCRUM',
    defaultColumns: ['To Do', 'In Progress', 'In Review', 'Done'],
  },
  {
    id: 'scrum-bugtracker',
    name: 'Bug Tracker',
    description: 'Triage bugs, set severity, track resolution with sprint-based cycles.',
    icon: '🐛',
    type: 'SCRUM',
    defaultColumns: ['New', 'Triaged', 'In Fix', 'Resolved'],
  },
  {
    id: 'kanban-marketing',
    name: 'Marketing Campaign',
    description: 'Continuous-flow board for campaign ideation, production, and launch.',
    icon: '📣',
    type: 'KANBAN',
    defaultColumns: ['Idea', 'Planning', 'In Progress', 'Review', 'Published'],
  },
  {
    id: 'kanban-content',
    name: 'Content Creation',
    description: 'Editorial pipeline from draft to published with review stages.',
    icon: '✍️',
    type: 'KANBAN',
    defaultColumns: ['Draft', 'Editing', 'Review', 'Approved', 'Published'],
  },
  {
    id: 'kanban-personal',
    name: 'Personal Tasks',
    description: 'Lightweight kanban for personal productivity and to-do management.',
    icon: '✅',
    type: 'KANBAN',
    defaultColumns: ['To Do', 'In Progress', 'Done'],
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch. Pick your own type, columns, and workflow.',
    icon: '⬜',
    type: 'SCRUM',
  },
];

interface TemplateGalleryProps {
  selected: string | null;
  onSelect: (template: ProjectTemplate) => void;
}

export function TemplateGallery({ selected, onSelect }: TemplateGalleryProps) {
  return (
    <div className={styles.gallery}>
      {PROJECT_TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          className={cx(styles.card, selected === tpl.id && styles.selected)}
          onClick={() => onSelect(tpl)}
          aria-pressed={selected === tpl.id}
        >
          <span className={styles.icon}>{tpl.icon}</span>
          <div className={styles.info}>
            <p className={styles.name}>{tpl.name}</p>
            <p className={styles.desc}>{tpl.description}</p>
          </div>
          <span className={cx(styles.typeBadge, tpl.type === 'SCRUM' ? styles.scrum : styles.kanban)}>
            {tpl.type}
          </span>
        </button>
      ))}
    </div>
  );
}
