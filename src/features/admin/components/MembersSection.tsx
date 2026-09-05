import { useState } from 'react';
import { useMembers } from '../../auth/hooks/useMembers';
import { Card, CardHeader } from '../../../components/ui/Card';
import { TeamMembersModal } from './TeamMembersModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import type { UserProfile } from '../../auth/services/authService';
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

function SortableMemberItem({ member, onRemove }: { member: UserProfile; onRemove: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: member.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <svg className="w-4 h-4 text-stone-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <div>
                    <p className="font-medium text-stone-900 text-sm">{member.display_name}</p>
                    <p className="text-xs text-stone-400">{member.email}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${member.role === 'manager' ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}
                >
                    {member.role}
                </span>
                <button
                    onClick={() => onRemove(member.id)}
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

export function MembersSection() {
    const { members, loading, error, add, remove, reorder } = useMembers();

    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const promoters = members.filter(m => m.role === 'promoter');
    const managers = members.filter(m => m.role === 'manager');

    const handlePromoterDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = promoters.findIndex(m => m.id === active.id);
        const newIdx = promoters.findIndex(m => m.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
            const reorderedPromoters = arrayMove(promoters, oldIdx, newIdx);
            const fullOrder = [...reorderedPromoters.map(m => m.id), ...managers.map(m => m.id)];
            await reorder(fullOrder);
        }
    };

    const handleManagerDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = managers.findIndex(m => m.id === active.id);
        const newIdx = managers.findIndex(m => m.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
            const reorderedManagers = arrayMove(managers, oldIdx, newIdx);
            const fullOrder = [...promoters.map(m => m.id), ...reorderedManagers.map(m => m.id)];
            await reorder(fullOrder);
        }
    };

    return (
        <Card>
            <CardHeader>
                <h3 className="font-semibold text-stone-900 tracking-tight">
                    Team Members{' '}
                    <span className="text-stone-300 font-normal text-sm">({loading ? '...' : members.length})</span>
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: '#5b8c7a' }}
                >
                    + Add Member
                </button>
            </CardHeader>

            {error ? (
                <div className="text-red-500 text-sm py-4 text-center">{error}</div>
            ) : loading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-12 bg-stone-100 rounded-xl" />
                    <div className="h-12 bg-stone-100 rounded-xl" />
                    <div className="h-12 bg-stone-100 rounded-xl" />
                </div>
            ) : (
                <>
                    {/* Promoters */}
                    <div className="mb-4">
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                            Promoters ({promoters.length})
                        </p>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handlePromoterDragEnd}
                        >
                            <SortableContext items={promoters.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {promoters.map(member => (
                                        <SortableMemberItem
                                            key={member.id}
                                            member={member}
                                            onRemove={id => setDeleteTarget({ id, name: member.display_name })}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Managers */}
                    <div>
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                            Managers ({managers.length})
                        </p>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleManagerDragEnd}
                        >
                            <SortableContext items={managers.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {managers.map(member => (
                                        <SortableMemberItem
                                            key={member.id}
                                            member={member}
                                            onRemove={id => setDeleteTarget({ id, name: member.display_name })}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </>
            )}

            <TeamMembersModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                members={members}
                onCreate={add}
                onRemove={remove}
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
                title="Remove Member"
                message={`Remove "${deleteTarget?.name}"?`}
                confirmLabel="Remove"
                danger
            />
        </Card>
    );
}
