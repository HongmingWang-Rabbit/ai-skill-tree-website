'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { GlassPanel, CloseIcon, TrashIcon, EditIcon, PlusIcon, ArrowLeftIcon } from '@/components/ui';
import { type WorkExperience } from '@/lib/schemas';
import { RESUME_CONFIG } from '@/lib/constants';

export interface ExperienceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  experience: WorkExperience[];
  onSave: (experience: WorkExperience[]) => Promise<void>;
}

interface ExperienceFormData {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  location: string;
}

const emptyForm: ExperienceFormData = {
  company: '',
  title: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  location: '',
};

export function ExperienceEditor({
  isOpen,
  onClose,
  experience,
  onSave,
}: ExperienceEditorProps) {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<WorkExperience[]>(experience);

  // Sync items state when experience prop changes
  useEffect(() => {
    setItems(experience);
  }, [experience]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<ExperienceFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique ID for new experience
  const generateId = () => `exp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Start editing an existing item
  const handleEdit = useCallback((item: WorkExperience) => {
    setFormData({
      company: item.company,
      title: item.title,
      startDate: item.startDate,
      endDate: item.endDate || '',
      isCurrent: item.endDate === null,
      description: item.description,
      location: item.location || '',
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

  // Save current form and immediately persist to backend
  const handleSaveForm = useCallback(async () => {
    // Validate required fields
    if (!formData.company.trim() || !formData.title.trim() || !formData.startDate) {
      setError(t('experienceRequired'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const newItem: WorkExperience = {
        id: editingId || generateId(),
        company: formData.company.trim(),
        title: formData.title.trim(),
        startDate: formData.startDate,
        endDate: formData.isCurrent ? null : (formData.endDate || null),
        description: formData.description.trim(),
        location: formData.location.trim() || undefined,
      };

      let newItems: WorkExperience[];
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
  const updateField = useCallback(<K extends keyof ExperienceFormData>(
    field: K,
    value: ExperienceFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  if (!isOpen) return null;

  const isEditing = editingId !== null || isAdding;
  const hasReachedLimit = items.length >= RESUME_CONFIG.experienceMaxItems;

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
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-slate-400" />
                  </button>
                )}
                <h2 className="text-lg font-semibold text-white">
                  {isEditing
                    ? (editingId ? t('editExperience') : t('addExperience'))
                    : t('experienceTitle')
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
                  {/* Company */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t('company')} *
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => updateField('company', e.target.value)}
                      maxLength={RESUME_CONFIG.experienceCompanyMaxLength}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder={t('companyPlaceholder')}
                      autoFocus
                    />
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t('jobTitle')} *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      maxLength={RESUME_CONFIG.experienceTitleMaxLength}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder={t('jobTitlePlaceholder')}
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {t('startDate')} *
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
                        {t('endDate')}
                      </label>
                      <input
                        type="month"
                        value={formData.endDate}
                        onChange={(e) => updateField('endDate', e.target.value)}
                        disabled={formData.isCurrent}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Current job checkbox */}
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isCurrent}
                      onChange={(e) => updateField('isCurrent', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                    {t('currentJob')}
                  </label>

                  {/* Location */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t('location')}
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      maxLength={RESUME_CONFIG.experienceLocationMaxLength}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder={t('locationPlaceholder')}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t('description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      maxLength={RESUME_CONFIG.experienceDescriptionMaxLength}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                      placeholder={t('descriptionPlaceholder')}
                    />
                  </div>
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
                      {t('addExperience')}
                    </button>
                  )}

                  {/* Experience list */}
                  {items.length > 0 ? (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{item.title}</h4>
                              <p className="text-sm text-slate-400">
                                {item.company}
                                {item.location && ` • ${item.location}`}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {item.startDate} - {item.endDate || t('present')}
                              </p>
                              {item.description && (
                                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded transition-colors"
                                title={t('editExperience')}
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                                title={t('deleteExperience')}
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
                      <div className="text-4xl mb-3">💼</div>
                      <p>{t('noExperience')}</p>
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
                    {t('saveExperience')}
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
