import { Card } from './Card';

type Props = { icon?: string; title: string; description?: string };

export function EmptyState({ icon = '⚱️', title, description }: Props) {
    return (
        <Card className="p-8 text-center">
            <div className="text-4xl mb-3">{icon}</div>
            <p className="text-stone-500 font-medium">{title}</p>
            {description && <p className="text-sm text-stone-400 mt-1">{description}</p>}
        </Card>
    );
}
