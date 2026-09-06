import { useState } from 'react';
import { useTemplates } from '../../templates/hooks/useTemplates';
import { useProducts } from '../../products/hooks/useProducts';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { TemplateFormModal } from './TemplateFormModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { DragHandleIcon, EditIcon, DeleteIcon } from '../../../components/ui/icons';
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
                    <DragHandleIcon className="w-4 h-4" />
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
                    <EditIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(template.templateId)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <DeleteIcon className="w-4 h-4" />
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
                <Skeleton rows={3} height="h-14" />
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
