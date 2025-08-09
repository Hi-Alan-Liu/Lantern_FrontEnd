import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LanternFlow } from './components/LanternFlow';
import { TaskCenter } from './components/TaskCenter';
import { WishWall } from './components/WishWall';

type Page = 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [userPoints, setUserPoints] = useState(3); // Starting points

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const addPoints = (points: number) => {
    setUserPoints(prev => prev + points);
  };

  const spendPoints = (points: number) => {
    if (userPoints >= points) {
      setUserPoints(prev => prev - points);
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#1a1d3a] to-[#2d1b69] relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full star-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {currentPage === 'landing' && (
          <LandingPage onNavigate={navigateTo} userPoints={userPoints} />
        )}
        {currentPage === 'lantern-flow' && (
          <LanternFlow 
            onNavigate={navigateTo} 
            userPoints={userPoints}
            onSpendPoints={spendPoints}
          />
        )}
        {currentPage === 'task-center' && (
          <TaskCenter onNavigate={navigateTo} onAddPoints={addPoints} />
        )}
        {currentPage === 'wish-wall' && (
          <WishWall onNavigate={navigateTo} />
        )}
      </div>
    </div>
  );
}