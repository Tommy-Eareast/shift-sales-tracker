import { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';
import { whatsappService } from '../../features/export/services/whatsappService';

type Props = { shiftId: string; onError?: (message: string) => void };

/**
 * Compact copy button that copies the shift summary as WhatsApp-formatted text.
 * Shows ✓ for 1.5s after successful copy.
 */
export function CopyButton({ shiftId, onError }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        try {
            const text = await whatsappService.generateSummary(shiftId);
            await whatsappService.copyToClipboard(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Copy failed:', err);
            onError?.(err instanceof Error ? err.message : 'Failed to copy');
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-colors ${
                copied ? 'text-emerald-600 bg-emerald-50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
            }`}
            title={copied ? 'Copied!' : 'Copy summary'}
        >
            {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
        </button>
    );
}
