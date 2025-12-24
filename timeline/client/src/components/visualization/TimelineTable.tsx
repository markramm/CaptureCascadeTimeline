import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, ExternalLink, Edit, Plus } from 'lucide-react';
import type { TimelineEvent } from '../../schemas/events';
import { useValidations } from '../../hooks/useValidations';
import { ValidationBadge } from '../common/ValidationBadge';
import './TimelineTable.css';

const EMPTY_ARRAY: TimelineEvent[] = [];

export function TimelineTable() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<keyof TimelineEvent>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const validationsMap = useValidations();

    const ITEMS_PER_PAGE = 20;

    // Reactive query from Dexie
    const allEvents = useLiveQuery(() => db.events.toArray()) || EMPTY_ARRAY;

    // Filter & Sort
    const filteredEvents = useMemo(() => {
        let result = [...allEvents];

        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(e =>
                e.title.toLowerCase().includes(lower) ||
                e.summary.toLowerCase().includes(lower) ||
                (e.tags || []).some(t => t.toLowerCase().includes(lower))
            );
        }

        result.sort((a, b) => {
            const valA = a[sortField] || '';
            const valB = b[sortField] || '';

            if (sortDir === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });

        return result;
    }, [allEvents, search, sortField, sortDir]);

    // Pagination
    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
    const paginatedEvents = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEvents, page, ITEMS_PER_PAGE]);

    const handleSort = (field: keyof TimelineEvent) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    return (
        <div className="timeline-table-container">
            <div className="table-header-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2>Timeline Explorer</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/events/new')}>
                        <Plus size={16} /> New
                    </button>
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('date')} className="sortable">Date {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                            <th>Status</th>
                            <th onClick={() => handleSort('title')} className="sortable">Title {sortField === 'title' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                            <th>Type</th>
                            <th>Tags</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEvents.map(event => (
                            <tr key={event.id}>
                                <td className="col-date">{event.date}</td>
                                <td>
                                    <ValidationBadge validations={validationsMap.get(event.id)} compact />
                                </td>
                                <td className="col-title">
                                    <div className="event-title">{event.title}</div>
                                    <div className="event-summary">{event.summary.substring(0, 100)}...</div>
                                </td>
                                <td><span className="badge badge-type">{event.type || 'Generic'}</span></td>
                                <td>
                                    <div className="tags-list">
                                        {(event.tags || []).slice(0, 3).map(tag => (
                                            <span key={tag} className="badge badge-tag">{tag}</span>
                                        ))}
                                        {(event.tags || []).length > 3 && <span className="badge badge-more">+{(event.tags || []).length - 3}</span>}
                                    </div>
                                </td>
                                <td className="col-actions">
                                    <button className="icon-btn" title="View Source">
                                        <ExternalLink size={16} />
                                    </button>
                                    <button className="icon-btn" title="Edit Event" onClick={() => navigate(`/events/${event.id}/edit`)}>
                                        <Edit size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedEvents.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No events found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination-controls">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={16} /> Previous
                </button>
                <span>Page {page} of {totalPages || 1}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
