import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const isManager = profile?.role === 'manager';
    const homePath = isManager ? '/manager/sales' : '/';

    return (
        <Card className="p-8 text-center max-w-md mx-auto mt-12">
            <div className="text-5xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2 tracking-tight">404</h1>
            <p className="text-sm text-stone-500 mb-6">The page you're looking for doesn't exist.</p>
            <Button variant="primary" size="lg" fullWidth onClick={() => navigate(homePath, { replace: true })}>
                {isManager ? 'Back to Sales' : 'Back to Shifts'}
            </Button>
        </Card>
    );
}
