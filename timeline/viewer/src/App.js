
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Viewer from './Viewer';
import ResearchLayout from './components/research/ResearchLayout';
import StatsOverview from './components/research/Dashboard/StatsOverview';
import ActorTable from './components/research/ActorManager/ActorTable';
import TimelineTable from './components/research/Timeline/TimelineTable';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/research" element={<ResearchLayout />}>
          <Route index element={<StatsOverview />} />
          {/* Add sub-routes here as we build them */}
          <Route path="timeline" element={<TimelineTable />} />
          <Route path="actors" element={<ActorTable />} />
          <Route path="standardization" element={<div>Standardization Queue (Coming Soon)</div>} />
        </Route>

        {/* Main Viewer Route - Catch all non-research routes */}
        <Route path="/*" element={<Viewer />} />
      </Routes>
    </Router>
  );
}

export default App;