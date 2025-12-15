'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { GlassPanel, CloseIcon, TrashIcon, EditIcon, PlusIcon } from '@/components/ui';
import { type Education } from '@/lib/schemas';
import { RESUME_CONFIG } from '@/lib/constants';

export interface EducationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  education: Education[];
  onSave: (education: Education[]) => Promise<void>;
}

interface EducationFormData {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location: string;
  description: string;
}

const emptyForm: EducationFormData = {
  school: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  location: '',
  description: '',
};

export function EducationEditor({
  isOpen,
  onClose,
  education,
  onSave,
}: EducationEditorProps) {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<Education[]>(education);

  useEffect(() => {
    setItems(education);
  }, [education]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<EducationFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => `edu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const handleEdit = useCallback((item: Education) => {
    setFormData({
      school: item.school,
      degree: item.degree || '',
      fieldOfStudy: item.fieldOfStudy || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      isCurrent: item.endDate === null,
      location: item.location || '',
      description: item.description || '',
    });
    setEditingId(item.id);
    setIsAdding(false);
    setError(null);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(true);
    setError(null);
  }, []);

  const handleCancel = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
    setError(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (editingId === id) {
      handleCancel();
    }
  }, [editingId, handleCancel]);

  const handleSaveForm = useCallback(() => {
    if (!formData.school.trim()) {
      setError(t('educationRequired'));
      return;
    }

    const newItem: Education = {
      id: editingId || generateId(),
      school: formData.school.trim(),
      degree: formData.degree.trim() || undefined,
      fieldOfStudy: formData.fieldOfStudy.trim() || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.isCurrent ? null : (formData.endDate || undefined),
      location: formData.location.trim() || undefined,
      description: formData.description.trim() || undefined,
    };

    if (editingId) {
      setItems(prev => prev.map(item => item.id === editingId ? newItem : item));
    } else {
      setItems(prev => [newItem, ...prev]);
    }

    handleCancel();
  }, [formData, editingId, handleCancel, t]);

  const handleSaveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(items);
      onClose();
    } catch {
      setError(t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [items, onSave, onClose, t]);

  const updateField = useCallback(<K extends keyof EducationFormData>(
    field: K,
    value: EducationFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  if (!isOpen) return null;

  const isEditing = editingId !== null || isAdding;
  const hasReachedLimit = items.length >= RESUME_CONFIG.educationMaxItems;

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
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                {t('educationTitle')}
              </h2>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <CloseIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {isEditing && (
                <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">
                    {editingId ? t('editEducation') : t('addEducation')}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {t('school')} *
                      </label>
                      <input
                        type="text"
                        value={formData.school}
                        onChange={(e) => updateField('school', e.target.value)}
                        maxLength={RESUME_CONFIG.educationSchoolMaxLength}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder={t('schoolPlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          {t('degree')}
                        </label>
                        <input
                          type="text"
                          value={formData.degree}
                          onChange={(e) => updateField('degree', e.target.value)}
                          maxLength={RESUME_CONFIG.educationDegreeMaxLength}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          placeholder={t('degreePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          {t('fieldOfStudy')}
                        </label>
                        <input
                          type="text"
                          value={formData.fieldOfStudy}
                          onChange={(e) => updateField('fieldOfStudy', e.target.value)}
                          maxLength={RESUME_CONFIG.educationFieldMaxLength}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          placeholder={t('fieldOfStudyPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          {t('startDate')}
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
                        <div className="flex items-center gap-2">
                          <input
                            type="month"
                            value={formData.endDate}
                            onChange={(e) => updateField('endDate', e.target.value)}
                            disabled={formData.isCurrent}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          />
                          <label className="flex items-center gap-1 text-xs text-slate-400">
                            <input
                              type="checkbox"
                              checked={formData.isCurrent}
                              onChange={(e) => updateField('isCurrent', e.target.checked)}
                            />
                            {t('currentEducation')}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {t('location')}
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        maxLength={RESUME_CONFIG.educationLocationMaxLength}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder={t('locationPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {t('description')}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        maxLength={RESUME_CONFIG.educationDescriptionMaxLength}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                        placeholder={t('educationDescriptionPlaceholder')}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleSaveForm}
                        disabled={isSaving}
                        className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded transition-colors disabled:opacity-50"
                      >
                        {t('saveEducation')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {!hasReachedLimit && !isEditing && (
                  <button
                    onClick={handleAdd}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-dashed border-slate-600 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {t('addEducation')}
                  </button>
                )}

                {items.length === 0 && !isEditing && (
                  <p className="text-sm text-slate-400 text-center py-6">
                    {t('noEducation')}
                  </p>
                )}

                {items.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-white font-semibold">{item.school}</p>
                      <p className="text-sm text-slate-300">
                        {[item.degree, item.fieldOfStudy].filter(Boolean).join(' • ')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {[item.startDate, item.endDate || (item.endDate === null ? t('present') : '')].filter(Boolean).join(' - ')}
                      </p>
                      {item.location && (
                        <p className="text-xs text-slate-400">{item.location}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-900/60">
              <div className="text-xs text-slate-400">
                {items.length}/{RESUME_CONFIG.educationMaxItems} {t('educationLabel')}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-3 py-1 text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    t('saveAll')
                  )}
                </button>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
