
import React from 'react';
import { ShieldCheck, ShieldAlert, BadgeCheck } from 'lucide-react';
import type { ValidationRecord } from '../../schemas/validation';

interface ValidationBadgeProps {
    validations?: ValidationRecord[];
    compact?: boolean;
}

export const ValidationBadge: React.FC<ValidationBadgeProps> = ({ validations, compact = false }) => {
    if (!validations || validations.length === 0) return null;

    const highConfidence = validations.filter(v => v.confidence === 'high');
    const rejected = validations.filter(v => v.confidence === 'rejected');

    // Rules for display:
    // 1. If any rejected, show Alert.
    // 2. If high confidence > 0, show Verified.
    // 3. Otherwise show processed/low.

    if (rejected.length > 0) {
        return (
            <div className="inline-flex items-center text-red-500 gap-1" title="Validation Failed/Rejected">
                <ShieldAlert size={compact ? 14 : 16} />
                {!compact && <span className="text-xs font-semibold">Rejected</span>}
            </div>
        );
    }

    if (highConfidence.length > 0) {
        return (
            <div className="inline-flex items-center text-emerald-500 gap-1" title={`Verified by ${highConfidence.length} validator(s)`}>
                <BadgeCheck size={compact ? 14 : 16} fill="currentColor" className="text-white" />
                {!compact && <span className="text-xs font-semibold">Verified</span>}
            </div>
        );
    }

    return (
        <div className="inline-flex items-center text-slate-400 gap-1" title="Pending or Low Confidence">
            <ShieldCheck size={compact ? 14 : 16} />
            {!compact && <span className="text-xs">Reviewed</span>}
        </div>
    );
};
