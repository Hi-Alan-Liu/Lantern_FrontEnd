import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Image, Play, MessageCircle, CheckCircle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'https://lantern-api.zeabur.app';

interface TaskCenterProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
  onAddPoints: (points: number) => void;
}

type FrontTaskType = 'image' | 'video' | 'question';

interface Task {
  id: string;
  type: FrontTaskType;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  content?: string;
  linkUrl?: string;
}

// 後端回傳格式
interface ApiEnvelope<T> {
  statusCode: number;
  message?: string;
  contents: T;
}

interface TaskCardResponse {
  id: string;
  type: string; // content | video | prompt | custom ...
  title: string;
  description: string;
  content?: string;
  points: number;
  linkUrl?: string;
  completed: boolean;
}

interface TaskListPayload {
  totalCount: number;
  dataList: TaskCardResponse[];
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');

  const userId = localStorage.getItem('X-User-Id');
  if (userId) headers.set('X-User-Id', userId);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  // 回傳有新的 X-User-Id 就更新
  const newUserId = res.headers.get('X-User-Id');
  if (newUserId) localStorage.setItem('X-User-Id', newUserId);

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${msg}`);
  }
  return res.json();
}

async function getUserTasks(): Promise<Task[]> {
  const json = await apiFetch<ApiEnvelope<TaskListPayload>>('/api/user/tasks');
  if (json.statusCode !== 200) throw new Error(json.message || 'getUserTasks error');

  return json.contents.dataList.map((r): Task => ({
    id: r.id,
    type: r.type as FrontTaskType,
    title: r.title,
    description: r.description,
    content: r.content,
    points: r.points,
    linkUrl: r.linkUrl,
    completed: r.completed,
  }));
}

async function completeTaskApi(id: string, content?: string): Promise<number> {
  const payload = {
    id: Number(id),
    content: content || ""
  };
  const json = await apiFetch<ApiEnvelope<number>>(`/api/user/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (json.statusCode !== 200) throw new Error(json.message || 'completeTask error');
  return json.contents;
}

export function TaskCenter({ onNavigate, onAddPoints }: TaskCenterProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [answer, setAnswer] = useState('');
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getUserTasks();
        if (alive) {
          setTasks(list);
          setErr(null);
        }
      } catch (e: any) {
        if (alive) setErr(e?.message ?? '載入失敗');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const completeTask = async (taskId: string, content?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    try {
      const points = await completeTaskApi(taskId, content);
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, completed: true } : t)));
      onAddPoints(task.points);
      setEarnedPoints(task.points);
      setShowPointsAnimation(true);
      setTimeout(() => {
        setShowPointsAnimation(false);
        setSelectedTask(null);
        setAnswer('');
      }, 1600);

      const fresh = await getUserTasks();
      setTasks(fresh);
    } catch (e: any) {
      alert(e?.message ?? '完成任務失敗');
    }
  };

  const getTaskIcon = (type: FrontTaskType) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Play;
      case 'question': return MessageCircle;
      default: return Image;
    }
  };

  const selectedIcon = useMemo(
    () => (selectedTask ? getTaskIcon(selectedTask.type) : null),
    [selectedTask]
  );

  if (selectedTask) {
    const IconComp = selectedIcon!;
    return (
      <div className="min-h-screen flex flex-col px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedTask(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回任務列表
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl mx-auto">
            <Card className="p-8 bg-card/50 backdrop-blur-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center">
                  <IconComp className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-xl mb-2">{selectedTask.title}</h2>
                <Badge variant="secondary" className="mb-4">
                  +{selectedTask.points} 點數
                </Badge>
              </div>

              {selectedTask.type === 'question' ? (
                <div>
                  <div className="bg-muted/50 p-6 rounded-lg mb-6">
                    <p className="text-center text-lg">{selectedTask.content}</p>
                  </div>
                  <div className="mb-6">
                    <textarea
                      placeholder="在這裡寫下你的回答..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-full min-h-24 p-4 bg-input-background border border-border/50 rounded-lg resize-none focus:border-accent focus:outline-none"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {answer.length}/200
                    </p>
                  </div>
                  <Button
                    onClick={() => completeTask(selectedTask.id, selectedTask.content)}
                    className="w-full"
                    disabled={!answer.trim() || selectedTask.completed}
                  >
                    {selectedTask.completed ? '已完成' : '提交回答'}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="bg-muted/50 p-6 rounded-lg mb-6">
                    <p className="text-center">{selectedTask.content}</p>
                    {selectedTask.type === 'video' && (
                      <div className="mt-4 text-center">
                        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                          <Play className="w-16 h-16 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">影片內容展示區域</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => completeTask(selectedTask.id)}
                    className="w-full"
                    disabled={selectedTask.completed}
                  >
                    {selectedTask.completed ? '已完成' : '完成學習'}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Points Animation */}
        {showPointsAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-accent text-accent-foreground px-8 py-4 rounded-full shadow-lg">
              <p className="text-lg font-medium">獲得 +{earnedPoints} 點數！</p>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => onNavigate('landing')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首頁
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl mb-4">點數任務中心</h1>
        <p className="text-muted-foreground">
          完成任務獲得點數，用於購買特殊天燈樣式
        </p>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center text-muted-foreground py-16">載入任務中…</div>
      )}
      {err && !loading && (
        <div className="text-center text-destructive py-8">{err}</div>
      )}

      {/* Task List */}
      {!loading && !err && (
        <div className="max-w-4xl mx-auto w-full">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => {
              const Icon = getTaskIcon(task.type);
              return (
                <Card
                  key={task.id}
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    task.completed
                      ? 'bg-accent/10 border-accent/50'
                      : 'bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/50'
                  }`}
                  onClick={() => !task.completed && setSelectedTask(task)}
                >
                  <div className="text-center">
                    <div
                      className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        task.completed ? 'bg-accent/20' : 'bg-primary/20'
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle className="w-6 h-6 text-accent" />
                      ) : (
                        <Icon className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <Badge variant="outline" className="mb-2 text-xs">
                      {task.type === 'image'
                        ? '圖文學習'
                        : task.type === 'video'
                        ? '影片觀看'
                        : '內在提問'}
                    </Badge>

                    <h3 className="mb-2">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4 text-accent" />
                      <span className="text-accent font-medium">{task.points} 點數</span>
                    </div>

                    {task.completed && (
                      <p className="text-xs text-accent mt-2">已完成</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Info Card */}
          <Card className="mt-8 p-6 bg-card/30 backdrop-blur-sm border-border/30">
            <div className="text-center">
              <h3 className="mb-2">如何獲得更多點數？</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <Image className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p>觀看心理衛教圖文</p>
                  <p className="text-accent">+1 點數</p>
                </div>
                <div>
                  <Play className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p>觀看正向思維短片</p>
                  <p className="text-accent">+2 點數</p>
                </div>
                <div>
                  <MessageCircle className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p>完成內在提問任務</p>
                  <p className="text-accent">+1 點數</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Points Animation */}
      {showPointsAnimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -50 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div className="bg-accent text-accent-foreground px-8 py-4 rounded-full shadow-lg">
            <p className="text-lg font-medium">獲得 +{earnedPoints} 點數！</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
