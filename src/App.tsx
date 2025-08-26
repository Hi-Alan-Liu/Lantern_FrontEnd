import React, { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LanternFlow } from './components/LanternFlow';
import { TaskCenter } from './components/TaskCenter';
import { WishWall } from './components/WishWall';

type Page = 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall';

export interface UserLantern {
  id: string;
  style: string;
  category: string;
  content: string;
  timestamp: number;
  position: {
    x: number;
    y: number;
  };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [userPoints, setUserPoints] = useState(3); // Starting points
  const [userLanterns, setUserLanterns] = useState<UserLantern[]>([]);

  const API_BASE = 'https://lantern-api.zeabur.app';

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const storedUserId = localStorage.getItem('X-User-Id') || '';
        const res = await fetch(`${API_BASE}/api/user`, {
          headers: {
            Accept: 'application/json',
            'X-User-Id': storedUserId,
          },
        });
        if (!res.ok) throw new Error('取得點數失敗');

        // 後端如果回傳新的 X-User-Id，更新本地
        const newUserId = res.headers.get('X-User-Id');
        if (newUserId) localStorage.setItem('X-User-Id', newUserId);

        const json = await res.json();
        if (alive && json?.statusCode === 200) {
          setUserPoints(Number(json.contents?.points ?? 0));
        }
      } catch (err) {
        console.error('[App] 載入使用者點數失敗：', err);
      }
    })();
    return () => { alive = false; };
  }, []);

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

  const addUserLantern = (lantern: Omit<UserLantern, 'id' | 'timestamp' | 'position'>) => {
    const newLantern: UserLantern = {
      ...lantern,
      id: Date.now().toString(),
      timestamp: Date.now(),
      position: {
        x: Math.random() * 80 + 10, // 10-90% to avoid edges
        y: 110, // Start from bottom (off-screen)
      }
    };
    setUserLanterns(prev => [...prev, newLantern]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#1a1d3a] to-[#2d1b69] relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full star-twinkle-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
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
            onAddLantern={addUserLantern}
          />
        )}
        {currentPage === 'task-center' && (
          <TaskCenter onNavigate={navigateTo} onAddPoints={addPoints} />
        )}
        {currentPage === 'wish-wall' && (
          <WishWall onNavigate={navigateTo} userLanterns={userLanterns} />
        )}
      </div>
    </div>
  );
}