import React from 'react';
import { X, Github, Book, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import './AboutOverlay.css';

const AboutOverlay = ({ onClose }) => {
    return (
        <div className="about-overlay-backdrop" onClick={onClose}>
            <motion.div
                className="about-overlay-content"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
            >
                <button className="close-button" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="about-header">
                    <h1>About The Capture Cascade Timeline</h1>
                    <p className="subtitle">Tracking Patterns of Democratic Degradation</p>
                </div>

                <div className="about-body">
                    <section>
                        <h2>Our Mission</h2>
                        <p>
                            This timeline documents the systematic capture of American democracy through verifiable events, court records, and public reporting. We're building a living intelligence infrastructure that helps citizens understand and respond to the erosion of democratic institutions.
                        </p>
                    </section>

                    <section className="framework-section">
                        <h2>The Capture Cascade Framework</h2>
                        <p>
                            Democracy doesn't fall gradually—it <strong>cascades</strong>. Each captured institution enables the capture of three more, creating exponential acceleration.
                        </p>

                        <div className="pattern-list">
                            <div className="pattern-item">
                                <span className="step">1</span>
                                <strong>Capture Oversight</strong> → No one watching
                            </div>
                            <div className="pattern-item">
                                <span className="step">2</span>
                                <strong>Capture Courts</strong> → No legal recourse
                            </div>
                            <div className="pattern-item">
                                <span className="step">3</span>
                                <strong>Capture Enforcement</strong> → Selective prosecution
                            </div>
                            <div className="pattern-item">
                                <span className="step">4</span>
                                <strong>Capture Media</strong> → Public can't see
                            </div>
                            <div className="pattern-item">
                                <span className="step">5</span>
                                <strong>Cascade Accelerates</strong> → Each enables 3 more
                            </div>
                        </div>

                        <div className="evidence-box">
                            <h3>The Evidence</h3>
                            <ul>
                                <li><strong>1970s:</strong> &lt;1 event/year</li>
                                <li><strong>2010s:</strong> 8 events/year</li>
                                <li><strong>2020s:</strong> 100+ events/year</li>
                            </ul>
                            <p>This isn't gradual erosion—it's exponential acceleration.</p>
                        </div>
                    </section>

                    <section className="stats-grid">
                        <div className="stat-card">
                            <h3>1,945+</h3>
                            <p>Verified Events</p>
                        </div>
                        <div className="stat-card">
                            <h3>6,373</h3>
                            <p>Credible Sources</p>
                        </div>
                        <div className="stat-card">
                            <h3>3,606</h3>
                            <p>Tags Tracking Patterns</p>
                        </div>
                        <div className="stat-card">
                            <h3>3,585</h3>
                            <p>Actors Mapped</p>
                        </div>
                    </section>

                    <section>
                        <h2>Our Standards</h2>
                        <ul className="standards-list">
                            <li><strong>Minimum 2 credible sources</strong> (tier-1 or tier-2)</li>
                            <li><strong>Verifiable documentation</strong> - court records, official documents</li>
                            <li><strong>Clear significance</strong> - explains impact on institutions</li>
                            <li><strong>Proper context</strong> - connects to broader patterns</li>
                        </ul>
                    </section>
                </div>

                <div className="about-footer">
                    <a href="https://github.com/markramm/CaptureCascadeTimeline" target="_blank" rel="noopener noreferrer" className="footer-link">
                        <Github size={20} />
                        GitHub
                    </a>
                    <a href="https://github.com/markramm/CaptureCascadeTimeline/discussions" target="_blank" rel="noopener noreferrer" className="footer-link">
                        <Globe size={20} />
                        Discussions
                    </a>
                    <a href="/" className="footer-link">
                        <Book size={20} />
                        Documentation
                    </a>
                </div>
            </motion.div>
        </div>
    );
};

export default AboutOverlay;
