import { type ReactNode } from 'react';

type Props = { selected: boolean; onClick: () => void; children: ReactNode };

/**
 * Wraps a card with checkbox behavior when in select mode.
 * Shows a checkbox on the left. Clicking anywhere toggles selection.
 */
export function CheckboxCard({ selected, onClick, children }: Props) {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer transition-colors rounded-2xl ${
                selected ? 'ring-2 ring-stone-900 ring-offset-1' : ''
            }`}
        >
            <div className="flex items-start gap-3 p-1">
                <div className="flex-shrink-0 pt-4 pl-3">
                    <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{ accentColor: '#5b8c7a' }}
                    />
                </div>
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
}
