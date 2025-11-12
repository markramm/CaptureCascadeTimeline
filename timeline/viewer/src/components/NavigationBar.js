import React from 'react';
import { Home, FileText, Laptop, Info, UserPlus } from 'lucide-react';
import './NavigationBar.css';

const NavigationBar = () => {
  // Remove /viewer from path to get base URL
  const getBaseUrl = () => {
    const origin = window.location.origin;
    return origin.replace(/\/viewer\/?$/, '');
  };

  const baseUrl = getBaseUrl();

  const navLinks = [
    { href: baseUrl + '/', label: 'Home', icon: Home },
    { href: baseUrl + '/events/', label: 'Timeline', icon: FileText },
    { href: baseUrl + '/viewer/', label: 'Interactive Viewer', icon: Laptop, active: true },
    { href: baseUrl + '/about/', label: 'About', icon: Info },
    { href: baseUrl + '/contribute/', label: 'Contribute', icon: UserPlus }
  ];

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-brand">
          <a href={baseUrl + '/'} className="brand-link">
            Kleptocracy Timeline
          </a>
        </div>
        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.href} className={link.active ? 'active' : ''}>
              <a href={link.href} className="nav-link">
                <link.icon size={16} />
                <span>{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavigationBar;
