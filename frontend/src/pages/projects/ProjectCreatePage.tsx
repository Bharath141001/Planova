import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { useCreateProject } from '@/hooks/useProject';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, FieldError } from '@/components/ui/Input';
import { TemplateGallery, PROJECT_TEMPLATES } from '@/components/projects/TemplateGallery';
import type { ProjectTemplate } from '@/components/projects/TemplateGallery';
import { projectSchema, type ProjectForm } from '@/utils/validators';
import styles from './ProjectCreatePage.module.scss';

type Step = 'template' | 'details';

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { type: 'SCRUM', isPrivate: false },
  });

  const name = watch('name');

  const suggestKey = () => {
    const key = (name ?? '').replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 6);
    if (key.length >= 2) setValue('key', key);
  };

  const handleTemplateSelect = (tpl: ProjectTemplate) => {
    setSelectedTemplate(tpl.id);
    setValue('type', tpl.type);
  };

  const handleTemplateContinue = () => {
    if (!selectedTemplate) {
      const blank = PROJECT_TEMPLATES.find((t) => t.id === 'blank')!;
      handleTemplateSelect(blank);
    }
    setStep('details');
  };

  const onSubmit = handleSubmit((values) => {
    createProject.mutate(
      { ...values, isPrivate: values.isPrivate ?? false },
      { onSuccess: (project) => navigate(`/projects/${project.key}/board`) },
    );
  });

  const chosenTemplate = PROJECT_TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div className={styles.page}>
      <PageHeader title="Create project" breadcrumbs={[{ label: 'Projects', to: '/projects' }, { label: 'New' }]} />

      {step === 'template' ? (
        <div className={styles.card}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>Choose a template</h2>
            <p className={styles.stepSubtitle}>Templates pre-configure your board type and workflow. You can customise everything after creation.</p>
          </div>
          <TemplateGallery selected={selectedTemplate} onSelect={handleTemplateSelect} />
          <div className={styles.footer}>
            <Button type="button" variant="ghost" onClick={() => navigate('/projects')}>Cancel</Button>
            <Button type="button" onClick={handleTemplateContinue}>
              {selectedTemplate ? 'Continue' : 'Skip & continue'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className={styles.card}>
          <button type="button" className={styles.backBtn} onClick={() => setStep('template')}>
            <ChevronLeft size={16} /> Back to templates
          </button>

          {chosenTemplate && chosenTemplate.id !== 'blank' && (
            <div className={styles.templateBadge}>
              <span>{chosenTemplate.icon}</span>
              <span>{chosenTemplate.name}</span>
              <span className={styles.templateType}>{chosenTemplate.type}</span>
            </div>
          )}

          <div className={styles.field}>
            <Label>Project name</Label>
            <Input autoFocus placeholder="Web Application" {...register('name')} onBlur={suggestKey} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className={styles.field}>
            <Label>Project key</Label>
            <Input placeholder="APP" style={{ textTransform: 'uppercase' }} {...register('key')} />
            <FieldError message={errors.key?.message} />
            <p className={styles.keyHint}>Used as the prefix for issue keys, e.g. APP-42.</p>
          </div>
          <div className={styles.field}>
            <Label>Description</Label>
            <Textarea placeholder="What is this project about?" {...register('description')} />
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <Label>Board type</Label>
              <div className={styles.typeToggle}>
                {(['SCRUM', 'KANBAN'] as const).map((t) => (
                  <label
                    key={t}
                    className={`${styles.typeOption} ${watch('type') === t ? styles.typeOptionActive : ''}`}
                  >
                    <input type="radio" value={t} {...register('type')} style={{ display: 'none' }} />
                    {t === 'SCRUM' ? '🏃 Scrum' : '📋 Kanban'}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input type="checkbox" {...register('isPrivate')} /> Private project
              </label>
            </div>
          </div>
          <div className={styles.footer}>
            <Button type="button" variant="ghost" onClick={() => navigate('/projects')}>Cancel</Button>
            <Button type="submit" loading={createProject.isPending}>Create project</Button>
          </div>
        </form>
      )}
    </div>
  );
}
