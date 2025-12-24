
import { useState, type KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import './TagInput.css';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    suggestions?: string[];
    label?: string;
    error?: string;
}

export function TagInput({ value = [], onChange, placeholder = "Add tag...", suggestions = [], label, error }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value.length - 1);
        }
    };

    const addTag = (tagToAdd?: string) => {
        const text = (tagToAdd || inputValue).trim();
        if (text && !value.includes(text)) {
            onChange([...value, text]);
            setInputValue('');
        }
    };

    const removeTag = (index: number) => {
        const newTags = [...value];
        newTags.splice(index, 1);
        onChange(newTags);
    };

    return (
        <div className="tag-input-container form-group">
            {label && <label>{label}</label>}
            <div className={`tag-input-wrapper ${error ? 'error-border' : ''}`}>
                {value.map((tag, index) => (
                    <span key={index} className="tag-chip">
                        {tag}
                        <button type="button" onClick={() => removeTag(index)} className="tag-remove-btn">
                            <X size={12} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="tag-input-field"
                />
            </div>
            {error && <span className="error-message">{error}</span>}

            {suggestions.length > 0 && inputValue.length > 1 && (
                <div className="tag-suggestions">
                    {suggestions
                        .filter(s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s))
                        .slice(0, 5)
                        .map(s => (
                            <button key={s} type="button" onClick={() => addTag(s)} className="suggestion-btn">
                                <Plus size={12} /> {s}
                            </button>
                        ))
                    }
                </div>
            )}
        </div>
    );
}
