'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { GlassPanel, CloseIcon, TrashIcon, EditIcon, PlusIcon, ArrowLeftIcon } from '@/components/ui';
import { type Project } from '@/lib/schemas';
import { RESUME_CONFIG } from '@/lib/constants';

export interface ProjectEditorProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSave: (projects: Project[]) => Promise<void>;
}

interface ProjectFormData {
  name: string;
  description: string;
  url: string;
  technologies: string;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
}

const emptyForm: ProjectFormData = {
  name: '',
  description: '',
  url: '',
  technologies: '',
  startDate: '',
  endDate: '',
  isOngoing: false,
};

export function ProjectEditor({
  isOpen,
  onClose,
  projects,
  onSave,
}: ProjectEditorProps) {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<Project[]>(projects);

  // Sync items state when projects prop changes
  useEffect(() => {
    setItems(projects);
  }, [projects]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique ID for new project
  const generateId = () => `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Start editing an existing item
  const handleEdit = useCallback((item: Project) => {
    setFormData({
      name: item.name,
      description: item.description,
      url: item.url || '',
      technologies: item.technologies.join(', '),
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      isOngoing: item.endDate === null,
    });
    setEditingId(item.id);
    setIsAdding(false);
    setError(null);
  }, []);

  // Start adding a new item
  const handleAdd = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(true);
    setError(null);
  }, []);

  // Cancel editing/adding - go back to list
  const handleBack = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
    setError(null);
  }, []);

  // Delete an item and auto-save
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const newItems = items.filter(item => item.id !== id);
      await onSave(newItems);
      setItems(newItems);
      if (editingId === id) {
        handleBack();
      }
    } catch {
      setError(t('saveFailed'));
    } finally {
      setDeletingId(null);
    }
  }, [items, editingId, handleBack, onSave, t]);

  // Parse technologies string to array
  const parseTechnologies = (techString: string): string[] => {
    return techString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, RESUME_CONFIG.projectTechnologiesMaxItems);
  };

  // Save current form and immediately persist to backend
  const handleSaveForm = useCallback(async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      setError(t('projectRequired'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const newItem: Project = {
        id: editingId || generateId(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        url: formData.url.trim() || undefined,
        technologies: parseTechnologies(formData.technologies),
        startDate: formData.startDate || undefined,
        endDate: formData.isOngoing ? null : (formData.endDate || undefined),
      };

      let newItems: Project[];
      if (editingId) {
        // Update existing item
        newItems = items.map(item => item.id === editingId ? newItem : item);
      } else {
        // Add new item
        newItems = [newItem, ...items];
      }

      // Save to backend immediately
      await onSave(newItems);
      setItems(newItems);
      handleBack();
    } catch {
      setError(t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingId, items, handleBack, onSave, t]);

  // Update form field
  const updateField = useCallback(<K extends keyof ProjectFormData>(
    field: K,
    value: ProjectFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  if (!isOpen) return null;

  const isEditing = editingId !== null || isAdding;
  const hasReachedLimit = items.length >= RESUME_CONFIG.projectsMaxItems;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && !isSaving && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[85vh] overflow-hidden"
        >
          <GlassPanel className="p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                {isEditing && (
                  <button
                    onClick={handleBack}
                    disabled={isSaving}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    title={t('backToDashboard')}
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-slate-400" />
                  </button>
                )}
                <h2 className="text-lg font-semibold text-white">
                  {isEditing
                    ? (editingId ? t('editProject') : t('addProject'))
                    : t('projectsTitle')
                  }
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <CloseIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Edit/Add Form Page */}
              {isEditing ? (
                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t('projectName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      maxLength={RESUME_CONFIG.projectNameMaxLength}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder={t('projectNamePlaceholder')}
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t('projectDescription')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      maxLength={RESUME_CONFIG.projectDescriptionMaxLength}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                      placeholder={t('projectDescriptionPlaceholder')}
                    />
                  </div>

                  {/* Project URL */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t('projectUrl')}
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => updateField('url', e.target.value)}
                      maxLength={RESUME_CONFIG.projectUrlMaxLength}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder={t('projectUrlPlaceholder')}
                    />
                  </div>

                  {/* Technologies */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t('projectTechnologies')}
                    </label>
                    <input
                      type="text"
                      value={formData.technologies}
                      onChange={(e) => updateField('technologies', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder={t('projectTechnologiesPlaceholder')}
                    />
                    <p className="text-xs text-slate-500 mt-1">{t('projectTechnologiesHint')}</p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {t('projectStartDate')}
                      </label>
                      <input
                        type="month"
                        value={formData.startDate}
                        onChange={(e) => updateField('startDate', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {t('projectEndDate')}
                      </label>
                      <input
                        type="month"
                        value={formData.endDate}
                        onChange={(e) => updateField('endDate', e.target.value)}
                        disabled={formData.isOngoing}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Ongoing project checkbox */}
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isOngoing}
                      onChange={(e) => updateField('isOngoing', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                    {t('ongoingProject')}
                  </label>
                </div>
              ) : (
                /* List Page */
                <>
                  {/* Add button */}
                  {!hasReachedLimit && (
                    <button
                      onClick={handleAdd}
                      className="w-full mb-4 p-3 flex items-center justify-center gap-2 text-sm text-amber-400 hover:text-amber-300 border border-dashed border-slate-600 hover:border-amber-500/50 rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {t('addProject')}
                    </button>
                  )}

                  {/* Projects list */}
                  {items.length > 0 ? (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{item.name}</h4>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-amber-400 hover:text-amber-300 truncate block"
                                >
                                  {item.url}
                                </a>
                              )}
                              {item.description && (
                                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              {item.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.technologies.slice(0, 5).map((tech, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                  {item.technologies.length > 5 && (
                                    <span className="px-2 py-0.5 text-xs text-slate-500">
                                      +{item.technologies.length - 5}
                                    </span>
                                  )}
                                </div>
                              )}
                              {(item.startDate || item.endDate !== undefined) && (
                                <p className="text-xs text-slate-500 mt-2">
                                  {item.startDate || ''} {item.startDate && (item.endDate !== undefined) ? '-' : ''} {item.endDate === null ? t('ongoing') : item.endDate || ''}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded transition-colors"
                                title={t('editProject')}
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                                title={t('deleteProject')}
                              >
                                {deletingId === item.id ? (
                                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <TrashIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <div className="text-4xl mb-3">📁</div>
                      <p>{t('noProjects')}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
              {isEditing ? (
                <>
                  <button
                    onClick={handleBack}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSaveForm}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving && (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    )}
                    {t('saveProject')}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {t('cancel')}
                </button>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
