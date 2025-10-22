import React, { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LanternFlow } from './components/LanternFlow';
import { TaskCenter } from './components/TaskCenter';
import { WishWall } from './components/WishWall';
import { PointsDisplay } from './components/PointsDisplay';

type Page = 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall';

export interface UserLantern {
  id: string;
  userId: string;
  style: string;
  category: string;
  content: string;
  timestamp: number;
  position: {
    x: number;
    y: number;
  };
  likes: number;
  likedBy: string[];
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [userPoints, setUserPoints] = useState(0);
  const [userId, setUserId] = useState<string>('');
  const [userLanterns, setUserLanterns] = useState<UserLantern[]>([]);
  const API_BASE = 'https://lantern-api.zeabur.app';

  // === 初始化使用者資訊與點數 ===
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
        if (!res.ok) throw new Error('取得使用者點數失敗');

        const newUserId = res.headers.get('X-User-Id');
        if (newUserId) {
          localStorage.setItem('X-User-Id', newUserId);
          setUserId(newUserId);
        } else {
          setUserId(storedUserId);
        }

        const json = await res.json();
        if (alive && json?.statusCode === 200) {
          setUserPoints(Number(json.contents?.points ?? 0));
        }
      } catch (err) {
        console.error('[App] 載入使用者資料失敗：', err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // === 導頁 ===
  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  // === 點數操作 ===
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

  // === 新增天燈 ===
  const addUserLantern = (lantern: Omit<UserLantern, 'id' | 'userId' | 'timestamp' | 'position' | 'likes' | 'likedBy'>) => {
    const newLantern: UserLantern = {
      ...lantern,
      id: Date.now().toString(),
      userId,
      timestamp: Date.now(),
      position: {
        x: Math.random() * 80 + 10,
        y: 110,
      },
      likes: 0,
      likedBy: [],
    };
    setUserLanterns(prev => [...prev, newLantern]);
  };

  // === 按讚功能 ===
  const likeLantern = (lanternId: string) => {
    setUserLanterns(prev =>
      prev.map(lantern => {
        if (lantern.id === lanternId && !lantern.likedBy.includes(userId)) {
          return {
            ...lantern,
            likes: lantern.likes + 1,
            likedBy: [...lantern.likedBy, userId],
          };
        }
        return lantern;
      }),
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#1a1d3a] to-[#2d1b69] relative overflow-hidden">
      {/* 背景星空 */}
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

      {/* 全域點數顯示 */}
      <PointsDisplay 
        points={userPoints} 
        onGetMorePoints={() => navigateTo('task-center')} 
      />

      {/* 主畫面區塊 */}
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
          <WishWall
            onNavigate={navigateTo}
            userLanterns={userLanterns}
            userId={userId}
            onLikeLantern={likeLantern}
          />
        )}
      </div>
    </div>
  );
}