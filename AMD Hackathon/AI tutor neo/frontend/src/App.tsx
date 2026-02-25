/**
 * Main App Component
 * 
 * Root component with routing between Tutor and Analytics pages.
 */

import React, { useState } from 'react';
import TutorPage from './pages/TutorPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'tutor' | 'analytics'>('tutor');

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentPage('tutor')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'tutor'
                    ? 'border-primary text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Tutor
              </button>
              <button
                onClick={() => setCurrentPage('analytics')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'analytics'
                    ? 'border-primary text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {currentPage === 'tutor' ? <TutorPage /> : <AnalyticsPage />}
    </div>
  );
}

export default App;
