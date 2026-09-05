import { useState } from 'react';
import { useTemplates } from '../../templates/hooks/useTemplates';
import { useProducts } from '../../products/hooks/useProducts';
import { Card, CardHeader } from '../../../components/ui/Card';
import { TemplateFormModal } from './TemplateFormModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { validateTemplate } from '../../../utils/validation';
import type { ShiftTemplate } from '../../../types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * WORKFLOW FOR ADDING A NEW BRAND EXPORT FORMAT:
 * 1. Create profile file in src/features/export/profiles/
 * 2. Register in index.ts exportProfiles array
 * 3. Add mapping in templateMapping.ts
 * 4. Run SQL to set export_category on products
 * No UI changes needed — export profile is auto-assigned by template name.
 */

function SortableTemplateItem({
    template,
    onEdit,
    onDelete,
}: {
    template: ShiftTemplate;
    onEdit: (t: ShiftTemplate) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: template.templateId });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200/60 bg-white shadow-sm"
        >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-100 rounded touch-none flex-shrink-0"
                >
                    <svg className="w-4 h-4 text-stone-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <div className="text-left min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">{template.templateName}</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {template.brandList.join(', ') || 'No brands yet'}
                        {template.exportProfile && template.exportProfile !== 'default' && (
                            <span className="ml-2 text-emerald-600">({template.exportProfile})</span>
                        )}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                    onClick={() => onEdit(template)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                </button>
                <button
                    onClick={() => onDelete(template.templateId)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export function TemplatesSection() {
    const { templates, loading, error, add, update, remove, reorder } = useTemplates();

    const { distinctValues } = useProducts();

    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
    const [form, setForm] = useState({ templateName: '', selectedBrands: [] as string[] });
    const [formError, setFormError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const openAddTemplate = () => {
        setEditingTemplate(null);
        setForm({ templateName: '', selectedBrands: [] });
        setFormError('');
        setShowForm(true);
    };

    const openEditTemplate = (template: ShiftTemplate) => {
        setEditingTemplate(template);
        setForm({ templateName: template.templateName, selectedBrands: template.brandList });
        setFormError('');
        setShowForm(true);
    };

    const saveTemplate = async () => {
        const v = validateTemplate(
            { templateName: form.templateName, selectedBrands: form.selectedBrands },
            templates,
            editingTemplate?.templateId
        );
        if (!v.valid) {
            setFormError(v.error!);
            return;
        }

        try {
            if (editingTemplate) {
                await update(editingTemplate.templateId, {
                    templateName: form.templateName,
                    brandList: form.selectedBrands,
                });
            } else {
                await add({ templateName: form.templateName, brandList: form.selectedBrands });
            }
            setShowForm(false);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = templates.findIndex(t => t.templateId === active.id);
        const newIdx = templates.findIndex(t => t.templateId === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
            const reordered = arrayMove(templates, oldIdx, newIdx);
            await reorder(reordered.map(t => t.templateId));
        }
    };

    return (
        <Card>
            <CardHeader>
                <h3 className="font-semibold text-stone-900 tracking-tight">
                    Templates{' '}
                    <span className="text-stone-300 font-normal text-sm">({loading ? '...' : templates.length})</span>
                </h3>
                <button
                    onClick={openAddTemplate}
                    className="text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: '#5b8c7a' }}
                >
                    + New Template
                </button>
            </CardHeader>

            {error ? (
                <div className="text-red-500 text-sm py-4 text-center">{error}</div>
            ) : loading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-14 bg-stone-100 rounded-xl" />
                    <div className="h-14 bg-stone-100 rounded-xl" />
                    <div className="h-14 bg-stone-100 rounded-xl" />
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={templates.map(t => t.templateId)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {templates.map(t => (
                                <SortableTemplateItem
                                    key={t.templateId}
                                    template={t}
                                    onEdit={openEditTemplate}
                                    onDelete={id => setDeleteTarget({ id, name: t.templateName })}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <TemplateFormModal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                editingTemplate={
                    editingTemplate
                        ? {
                              templateId: editingTemplate.templateId,
                              templateName: editingTemplate.templateName,
                              brandList: editingTemplate.brandList,
                          }
                        : null
                }
                form={form}
                onChange={setForm}
                error={formError}
                brands={distinctValues.brands}
                onSave={saveTemplate}
            />

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (deleteTarget) {
                        await remove(deleteTarget.id);
                        setDeleteTarget(null);
                    }
                }}
                title="Delete Template"
                message={`Delete "${deleteTarget?.name}"?`}
                confirmLabel="Delete"
                danger
            />
        </Card>
    );
}
