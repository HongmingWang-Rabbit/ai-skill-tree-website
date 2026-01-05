import { useState, useCallback, useEffect } from 'react';

interface BaseItem {
  id: string;
}

interface UseEditorStateOptions<T extends BaseItem, F> {
  items: T[];
  emptyForm: F;
  onSave: (items: T[]) => Promise<void>;
  generateId: () => string;
  itemToForm: (item: T) => F;
  formToItem: (form: F, id: string) => T;
  validateForm: (form: F) => string | null;
  errorMessages: {
    saveFailed: string;
    validationFailed: string;
  };
}

export function useEditorState<T extends BaseItem, F>({
  items: initialItems,
  emptyForm,
  onSave,
  generateId,
  itemToForm,
  formToItem,
  validateForm,
  errorMessages,
}: UseEditorStateOptions<T, F>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<F>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync items state when prop changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const isEditing = editingId !== null || isAdding;

  // Start editing an existing item
  const handleEdit = useCallback((item: T) => {
    setFormData(itemToForm(item));
    setEditingId(item.id);
    setIsAdding(false);
    setError(null);
  }, [itemToForm]);

  // Start adding a new item
  const handleAdd = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(true);
    setError(null);
  }, [emptyForm]);

  // Cancel editing/adding - go back to list
  const handleBack = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
    setError(null);
  }, [emptyForm]);

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
      setError(errorMessages.saveFailed);
    } finally {
      setDeletingId(null);
    }
  }, [items, editingId, handleBack, onSave, errorMessages.saveFailed]);

  // Save current form and immediately persist to backend
  const handleSaveForm = useCallback(async () => {
    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const newItem = formToItem(formData, editingId || generateId());

      let newItems: T[];
      if (editingId) {
        newItems = items.map(item => item.id === editingId ? newItem : item);
      } else {
        newItems = [newItem, ...items];
      }

      await onSave(newItems);
      setItems(newItems);
      handleBack();
    } catch {
      setError(errorMessages.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingId, items, handleBack, onSave, generateId, formToItem, validateForm, errorMessages.saveFailed]);

  // Update form field
  const updateField = useCallback(<K extends keyof F>(field: K, value: F[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  return {
    items,
    formData,
    editingId,
    isAdding,
    isEditing,
    isSaving,
    deletingId,
    error,
    handleEdit,
    handleAdd,
    handleBack,
    handleDelete,
    handleSaveForm,
    updateField,
  };
}

// Utility function to generate unique IDs
export function createIdGenerator(prefix: string) {
  return () => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
