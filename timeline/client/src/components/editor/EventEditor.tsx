
import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Sparkles } from 'lucide-react';
import { db } from '../../db';
import { TimelineEventSchema, type TimelineEvent } from '../../schemas/events';
import { verifyEventWithAI, type VerificationResult } from '../../services/aiService';
import { TagInput } from './TagInput';
import './EventEditor.css';

// Check for crypto.randomUUID support or polyfill
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
};

export function EventEditor() {
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!paramId;
    const initialId = isEditMode && paramId ? paramId : generateId();

    const { register, control, handleSubmit, reset, getValues, setValue, formState: { errors, isSubmitting } } = useForm<TimelineEvent>({
        resolver: zodResolver(TimelineEventSchema) as any,
        defaultValues: {
            id: initialId,
            tags: [],
            entities: [],
            sources: [],
            verification_history: [],
            type: 'political',
            title: '',
            date: '',
            summary: ''
        }
    });

    const { fields: sourceFields, append: appendSource, remove: removeSource } = useFieldArray({
        control,
        name: "sources"
    });

    // Load data if edit mode
    useEffect(() => {
        if (isEditMode && paramId) {
            db.events.get(paramId).then(event => {
                if (event) {
                    reset(event);
                } else {
                    alert('Event not found');
                    navigate('/');
                }
            });
        }
    }, [paramId, isEditMode, reset, navigate]);

    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        const values = getValues();
        setIsVerifying(true);
        try {
            const result = await verifyEventWithAI(values);
            setVerificationResult(result);
            if (result.records.length > 0) {
                const currentHistory = getValues('verification_history') || [];
                setValue('verification_history', [...currentHistory, ...result.records]);
            }
        } catch (e) {
            console.error("Verification failed", e);
        } finally {
            setIsVerifying(false);
        }
    };


    const onSubmit: import('react-hook-form').SubmitHandler<TimelineEvent> = async (data) => {
        try {
            const eventToSave = { ...data };
            await db.events.put(eventToSave);
            console.log('Saved event:', eventToSave);
            navigate('/');
        } catch (error) {
            console.error('Failed to save event:', error);
            alert('Failed to save event');
        }
    };

    return (
        <div className="editor-container">
            <div className="editor-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Back
                </button>
                <h2>{isEditMode ? 'Edit Event' : 'New Event'}</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="editor-form">
                <input type="hidden" {...register('id')} />

                {/* Section: Core Info */}
                <div className="form-section">
                    <h3 className="section-title">Core Info</h3>
                    <div className="form-group">
                        <label>Title</label>
                        <input {...register('title')} placeholder="Event Title" className="input-lg" />
                        {errors.title && <span className="error">{errors.title.message}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>Date</label>
                            <input type="date" {...register('date')} />
                            {errors.date && <span className="error">{errors.date.message}</span>}
                        </div>
                        <div className="form-group half">
                            <label>Type</label>
                            <select {...register('type')}>
                                <option value="legislative">Legislative</option>
                                <option value="judicial">Judicial</option>
                                <option value="financial">Financial</option>
                                <option value="corporate">Corporate</option>
                                <option value="political">Political</option>
                                <option value="cultural">Cultural</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section: Content */}
                <div className="form-section">
                    <h3 className="section-title">Content</h3>
                    <div className="form-group">
                        <label>Summary</label>
                        <textarea {...register('summary')} rows={3} placeholder="Brief summary..." />
                        {errors.summary && <span className="error">{errors.summary.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Detailed Content (Markdown)</label>
                        <textarea {...register('content')} rows={10} placeholder="Full details..." className="content-area" />
                    </div>
                </div>

                {/* Section: Classification */}
                <div className="form-section">
                    <h3 className="section-title">Classification</h3>

                    <Controller
                        control={control}
                        name="tags"
                        render={({ field }) => (
                            <TagInput
                                value={field.value}
                                onChange={field.onChange}
                                label="Tags"
                                placeholder="Add thematic tag..."
                                error={errors.tags?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="entities"
                        render={({ field }) => (
                            <TagInput
                                value={field.value || []}
                                onChange={field.onChange}
                                label="Entities (People / Organizations)"
                                placeholder="Add person or org..."
                                error={errors.entities?.message}
                            />
                        )}
                    />
                </div>

                {/* Section: Sources */}
                <div className="form-section">
                    <h3 className="section-title">Evidence</h3>
                    <div className="form-group">
                        <label>Sources</label>
                        {sourceFields.map((field, index) => (
                            <div key={field.id} className="source-row">
                                <input
                                    {...register(`sources.${index}.url`)}
                                    placeholder="https://example.com"
                                    className="source-url-input"
                                />
                                <input
                                    {...register(`sources.${index}.title`)}
                                    placeholder="Source Title"
                                    className="source-title-input"
                                />
                                <button type="button" onClick={() => removeSource(index)} className="icon-btn-danger">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button type="button" className="btn-outline-sm" onClick={() => appendSource({ url: '', title: '' })}>
                            <Plus size={14} /> Add Source
                        </button>
                        {errors.sources && <span className="error">{errors.sources.message}</span>}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="form-actions-footer">
                    <button type="button" onClick={handleVerify} className="btn-verify" disabled={isVerifying}>
                        <Sparkles size={16} />
                        {isVerifying ? 'Verifying...' : 'AI Verify'}
                    </button>

                    <div className="right-actions">
                        <button type="button" onClick={() => navigate('/')} className="btn-text">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : <><Save size={16} /> Save Event</>}
                        </button>
                    </div>
                </div>

                {verificationResult && (
                    <div className="verification-results">
                        <h4><Sparkles size={16} /> AI Verification Results</h4>
                        {verificationResult.records.map((r, i) => (
                            <div key={i} className={`verification-item status-${r.status}`}>
                                <div className="verifier-id">{r.agent_id}</div>
                                <div className="verifier-notes">{r.notes} ({Math.round(r.confidence_score * 100)}% Confidence)</div>
                            </div>
                        ))}
                        {verificationResult.suggestedTags && verificationResult.suggestedTags.length > 0 && (
                            <div className="suggested-tags">
                                <strong>Suggested:</strong> {verificationResult.suggestedTags.join(', ')}
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
