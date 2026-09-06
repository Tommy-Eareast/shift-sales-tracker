import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { ProductsSection } from '../../features/admin/components/ProductsSection';
import { TemplatesSection } from '../../features/admin/components/TemplatesSection';
import { MembersSection } from '../../features/admin/components/MembersSection';

export default function AdminPage() {
    const [section, setSection] = useState<'products' | 'templates' | 'members'>('products');

    return (
        <div className="space-y-4">
            <Card noPadding className="p-1 flex">
                {(['products', 'templates', 'members'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setSection(s)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${section === s ? 'text-white' : 'text-stone-500 hover:text-stone-700'}`}
                        style={section === s ? { background: 'linear-gradient(135deg, #5b8c7a, #6d9e8a)' } : {}}
                    >
                        {s === 'members' ? 'Team' : s}
                    </button>
                ))}
            </Card>

            {section === 'products' && <ProductsSection />}
            {section === 'templates' && <TemplatesSection />}
            {section === 'members' && <MembersSection />}
        </div>
    );
}
