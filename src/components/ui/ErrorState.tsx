import { Card } from './Card';

type Props = { message: string };

export function ErrorState({ message }: Props) {
    return (
        <Card className="p-6 text-center">
            <p className="text-red-500 text-sm">{message}</p>
        </Card>
    );
}
