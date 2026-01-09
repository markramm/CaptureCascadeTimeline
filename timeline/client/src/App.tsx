import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { syncEvents, type SyncResult } from './db/loader';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { TimelineTable } from './components/visualization/TimelineTable';
import { EventEditor } from './components/editor/EventEditor';
import { NetworkGraph } from './components/visualization/NetworkGraph';
import { Database, LayoutDashboard, Bug, Plus, Share2, Settings as SettingsIcon, AlertTriangle, X } from 'lucide-react';
import { Settings as SettingsView } from './components/Settings';
import { TimelineView } from './components/visualization/TimelineView';
import { getConfig } from './config/timeline';

interface InitState {
  initialized: boolean;
  count: number;
  error?: string;
  schemaWarning?: string;
  source?: string;
}

function App() {
  const [init, setInit] = useState<InitState>({
    initialized: false,
    count: 0
  });
  const [dismissedWarning, setDismissedWarning] = useState(false);

  useEffect(() => {
    const config = getConfig();
    syncEvents()
      .then((res: SyncResult) => setInit({
        initialized: true,
        count: res.count,
        schemaWarning: res.schemaWarning,
        source: config.dataUrl
      }))
      .catch((err) => setInit({ initialized: true, count: 0, error: err.message }));
  }, []);

  if (!init.initialized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#64748b' }}>Initializing Universal Timeline Client...</h2>
      </div>
    );
  }

  if (init.error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Initialization Failed</h2>
        <p>{init.error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{ width: '250px', background: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'white' }}>Timeline UTC</h2>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Local-First Research</div>
          </div>
          <nav style={{ flex: 1, padding: '20px 0' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#e2e8f0', textDecoration: 'none' }}>
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
              </li>
              <li>
                <Link to="/graph" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#e2e8f0', textDecoration: 'none' }}>
                  <Share2 size={18} /> Graph View
                </Link>
              </li>
              <li>
                <Link to="/timeline" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#e2e8f0', textDecoration: 'none' }}>
                  <LayoutDashboard size={18} /> Timeline
                </Link>
              </li>
              <li>
                <Link to="/events/new" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#e2e8f0', textDecoration: 'none' }}>
                  <Plus size={18} /> New Event
                </Link>
              </li>
              <li>
                <Link to="/debug" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#94a3b8', textDecoration: 'none' }}>
                  <Bug size={18} /> DB Debug ({init.count})
                </Link>
              </li>
              <li>
                <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#94a3b8', textDecoration: 'none' }}>
                  <SettingsIcon size={18} /> Settings
                </Link>
              </li>
            </ul>
          </nav>
          <div style={{ padding: '20px', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} /> IndexedDB Active
            </div>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', position: 'relative' }}>
          {/* Schema Warning Banner */}
          {init.schemaWarning && !dismissedWarning && (
            <div style={{
              background: '#fef3c7',
              borderBottom: '1px solid #f59e0b',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '0.9rem', color: '#92400e' }}>
                <strong>Schema Version Warning:</strong> {init.schemaWarning}
              </div>
              <button
                onClick={() => setDismissedWarning(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#92400e'
                }}
              >
                <X size={18} />
              </button>
            </div>
          )}

          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/timeline" element={<div style={{ height: '100%', padding: '20px' }}><TimelineView /></div>} />
            <Route path="/events/new" element={<div style={{ padding: '30px' }}><EventEditor /></div>} />
            <Route path="/events/:id/edit" element={<div style={{ padding: '30px' }}><EventEditor /></div>} />
            <Route path="/debug" element={<DebugView />} />
            <Route path="/settings" element={<div style={{ padding: '30px' }}><SettingsView /></div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function DashboardView() {
  return (
    <div className="container" style={{ maxWidth: '1400px', padding: '30px' }}>
      <TimelineTable />
    </div>
  );
}

function GraphView() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title and Description are now passed to NetworkGraph for overlay rendering */}
      <NetworkGraph
        title="Network Graph"
        description="Visualizing relationships based on shared tags and temporal proximity."
      />
    </div>
  );
}

function DebugView() {
  const events = useLiveQuery(() => db.events.limit(20).toArray());

  return (
    <div className="container" style={{ padding: '30px' }}>
      <h1>Debug View</h1>
      <p>Showing first 20 events from IndexedDB</p>
      <div style={{ marginTop: '20px' }}>
        {events?.map(ev => (
          <div key={ev.id} className="card" style={{ marginBottom: '10px', padding: '15px' }}>
            <strong>{ev.date}</strong> - {ev.title}
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
              Sources: {ev.sources.length} | Tags: {ev.tags.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
