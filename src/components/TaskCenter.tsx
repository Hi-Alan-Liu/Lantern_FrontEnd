import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { ArrowLeft, Play, CheckCircle, Plus } from 'lucide-react';

const API_BASE = 'https://lantern-api.zeabur.app';

interface TaskCenterProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
  onAddPoints: (points: number) => void;
}

/** ---- 前端 Task 型別（本頁僅處理 video 類） ---- */
interface Task {
  id: string;
  type: 'video';
  title: string;
  description: string;
  points: number;
  completed: boolean;
  youtubeUrl: string;
}

/** ---- 後端 Envelope / Payload ---- */
interface ApiEnvelope<T> {
  statusCode: number;
  message?: string;
  contents: T;
}
interface TaskCardResponse {
  id: string;            // 任務 ID（字串或數字皆可能，統一轉字串）
  type: string;          // content | video | prompt | custom ...
  title: string;
  description: string;
  content?: string;      // 有些後端會把連結放 content
  points: number;
  linkUrl?: string;      // 影片 / 外部連結
  completed: boolean;
}
interface TaskListPayload {
  totalCount: number;
  dataList: TaskCardResponse[];
}

/** ---- 通用 fetch，帶 X-User-Id ---- */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');

  const userId = localStorage.getItem('X-User-Id');
  if (userId) headers.set('X-User-Id', userId);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  // 後端若回傳新的使用者識別，更新 localStorage
  const newUserId = res.headers.get('X-User-Id');
  if (newUserId) localStorage.setItem('X-User-Id', newUserId);

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${msg}`);
  }
  return res.json();
}

/** ---- 取任務清單（只轉成前端 video 任務） ---- */
function toYouTubeEmbed(url?: string): string | null {
  if (!url) return null;
  // 已是 embed 直接回傳
  if (/youtube\.com\/embed\/[A-Za-z0-9_-]+/.test(url)) return url;

  // 轉換 youtu.be / watch?v=
  const watchMatch = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  return null; // 無法辨識就丟回 null（將被過濾）
}

async function getUserTasks(): Promise<Task[]> {
  // 如果後端支援分頁全撈，建議帶上參數
  const json = await apiFetch<ApiEnvelope<TaskListPayload>>('/api/user/tasks');
  if (json.statusCode !== 200) throw new Error(json.message || 'getUserTasks error');

  const tasks = json.contents.dataList.map((r): Task | null => {
    // 嘗試抓 youtube 連結：linkUrl 優先，其次 content
    const rawUrl = r.linkUrl || r.content || '';
    let embed = toYouTubeEmbed(rawUrl);

    // 不是影片也先顯示（embed 可能為 null）
    return {
      id: String(r.id),
      type: 'video',             // 先一律當作 video 任務顯示（或你也可加型別分支）
      title: r.title,
      description: r.description,
      points: r.points,
      completed: r.completed,
      youtubeUrl: embed || '',   // 沒解析到就留空字串
    };
  }).filter(Boolean) as Task[];

  return tasks;
}

/** ---- 完成任務（POST /api/user/tasks），回傳獲得點數 ---- */
async function completeTaskApi(id: string, content?: string): Promise<number> {
  const payload = { id: Number(id), content: content ?? '' };
  const json = await apiFetch<ApiEnvelope<number>>('/api/user/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (json.statusCode !== 200) throw new Error(json.message || 'completeTask error');
  return json.contents; // points
}

export function TaskCenter({ onNavigate, onAddPoints }: TaskCenterProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 計時用：打開 dialog 後 10 秒自動完成
  const [videoStartTime, setVideoStartTime] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false); // 避免重複觸發

  // 初始載入
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getUserTasks();
        if (!alive) return;
        setTasks(list);
        setErr(null);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? '載入任務失敗');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 點擊任務：開啟 dialog + 若未完成，開始計時
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
    if (!task.completed) setVideoStartTime(Date.now());
  };

  // 關閉 dialog：重置
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      setSelectedTask(null);
      setVideoStartTime(null);
      setCompleting(false);
    }
  };

  // 完成任務：呼叫 API、加點、更新狀態、refresh
  const completeTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed || completing) return;

    try {
      setCompleting(true);
      const points = await completeTaskApi(taskId);
      onAddPoints(points);

      // 立刻在列表標示完成
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, completed: true } : t)));

      // 再向後端拿一次，確保狀態一致
      const fresh = await getUserTasks();
      setTasks(fresh);
    } catch (e: any) {
      console.error(e);
      // 失敗也要允許重試
      setCompleting(false);
    }
  };

  // 自動完成：開啟 10 秒後觸發一次
  useEffect(() => {
    if (!videoStartTime || !selectedTask || selectedTask.completed) return;

    const timer = setTimeout(() => {
      completeTask(selectedTask.id);
      setVideoStartTime(null);
    }, 10_000);

    return () => clearTimeout(timer);
  }, [videoStartTime, selectedTask]);

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
          觀看反毒教育影片，學習正向知識，獲得點數購買特殊天燈
        </p>
      </div>

      {/* Loading / Error */}
      {loading && <div className="text-center text-muted-foreground py-16">載入任務中…</div>}
      {err && !loading && <div className="text-center text-destructive py-8">{err}</div>}

      {/* Task List */}
      {!loading && !err && (
        <div className="max-w-4xl mx-auto w-full">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">目前沒有影片任務</div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={task.id}>
                    <div
                      className="flex items-center justify-between py-4 px-4 rounded-lg transition-all duration-300 cursor-pointer hover:bg-muted/30"
                      onClick={() => handleTaskClick(task)}
                    >
                      {/* Left */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            task.completed ? 'bg-green-500/20' : 'bg-primary/20'
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Play className="w-5 h-5 text-primary" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-semibold truncate ${
                              task.completed ? 'text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {task.title}
                          </h3>
                          <p
                            className={`text-sm truncate ${
                              task.completed ? 'text-muted-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            task.completed ? 'bg-green-500/20 text-green-400' : 'bg-accent/20 text-accent'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{task.points} 點數</span>
                          {task.completed && <CheckCircle className="w-3 h-3 ml-1" />}
                        </div>
                      </div>
                    </div>

                    {index < tasks.length - 1 && <div className="h-px bg-border/30 mx-4" />}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Info Card */}
          <Card className="mt-8 p-6 bg-card/30 backdrop-blur-sm border-border/30">
            <div className="text-center">
              <h3 className="mb-4">如何獲得更多點數？</h3>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/20 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium mb-1">觀看反毒教育影片</p>
                <p className="text-muted-foreground mb-2">學習反毒知識，培養正向人生觀</p>
                <Badge className="bg-accent/20 text-accent">依任務點數為主</Badge>
              </div>
              <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 提示：點擊任務名稱或描述觀看影片，觀看 10 秒後自動獲得點數；已完成任務可重複觀看
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* YouTube Video Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-7xl w-[92vw] max-h-[92vh] p-0 bg-gradient-to-br from-card/95 via-card/90 to-secondary/20 backdrop-blur-xl border-border/30 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 px-8 py-8 border-b border-border/20">
            <div className="relative z-10">
              <DialogTitle className="text-3xl mb-3 bg-gradient-to-r from-foreground via-accent/80 to-primary/90 bg-clip-text text-transparent leading-tight">
                {selectedTask?.title}
              </DialogTitle>
              <p className="text-lg text-muted-foreground/90 leading-relaxed max-w-4xl">
                {selectedTask?.description}
              </p>
            </div>
          </div>

          {/* Video */}
          <div className="p-8">
            {selectedTask?.youtubeUrl && (
              <div className="relative">
                <div className="relative aspect-video w-full bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 p-1 rounded-2xl">
                    <div className="w-full h-full bg-background/10 rounded-xl overflow-hidden">
                      <iframe
                        src={selectedTask.youtubeUrl}
                        title={selectedTask.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-accent/30 rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-accent/30 rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-accent/30 rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-accent/30 rounded-br-lg"></div>
                </div>

                {/* Completed State */}
                {selectedTask?.completed && (
                  <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-400 font-medium">已完成 - 可重複觀看</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
