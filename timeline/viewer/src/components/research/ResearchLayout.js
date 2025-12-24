
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const ResearchLayout = () => {
    return (
        <div className="research-layout" style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
            <aside style={{ width: '250px', background: '#2c3e50', color: 'white', padding: '20px' }}>
                <h2 style={{ marginBottom: '30px' }}>Research Tools</h2>
                <nav>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '10px' }}>
                            <Link to="/research" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                            <Link to="/research/timeline" style={{ color: 'white', textDecoration: 'none' }}>Timeline Events</Link>
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                            <Link to="/research/actors" style={{ color: 'white', textDecoration: 'none' }}>Actor Manager</Link>
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                            <Link to="/research/standardization" style={{ color: 'white', textDecoration: 'none' }}>Standardization</Link>
                        </li>
                    </ul>
                </nav>
                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #444' }}>
                    <Link to="/" style={{ color: '#aaa', fontSize: '14px' }}>← Back to Viewer</Link>
                </div>
            </aside>
            <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default ResearchLayout;
