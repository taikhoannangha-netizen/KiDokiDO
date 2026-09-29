import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Star, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Clock, 
  Flame, 
  HelpCircle, 
  ArrowRight,
  RefreshCw,
  Zap,
  Activity
} from 'lucide-react';
import { UserProfile, ActiveTab, StudentActivityItem } from '../types';
import { subscribeStudentActivities } from '../lib/firebaseSync';
import { audioService } from '../utils/audio';

interface RecentActivityFeedProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  maxItems?: number;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  user,
  setActiveTab,
  maxItems = 8,
}) => {
  const [activities, setActivities] = useState<StudentActivityItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'lessons' | 'stars'>('all');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  const studentId = user.id || user.username || user.name || 'default';

  useEffect(() => {
    // Realtime subscription via Firebase synchronization service
    const unsubscribe = subscribeStudentActivities(studentId, (liveActivities) => {
      setActivities(liveActivities);
      setIsLiveConnected(true);
    });

    return () => {
      unsubscribe();
    };
  }, [studentId]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let result = activities;
    if (filterType === 'lessons') {
      result = activities.filter((a) => a.type === 'lesson_completed');
    } else if (filterType === 'stars') {
      result = activities.filter((a) => a.type === 'star_awarded' || (a.starsEarned && a.starsEarned > 0));
    }
    return result.slice(0, maxItems);
  }, [activities, filterType, maxItems]);

  // Aggregate stats
  const totalStarsAwarded = useMemo(() => {
    return activities.reduce((sum, a) => sum + (a.starsEarned || 0), 0);
  }, [activities]);

  const totalLessonsCompleted = useMemo(() => {
    return activities.filter((a) => a.type === 'lesson_completed').length;
  }, [activities]);

  const formatRelativeTime = (timestampMs?: number, fallbackStr?: string) => {
    if (!timestampMs) return fallbackStr || 'Gần đây';
    const diffSeconds = Math.floor((Date.now() - timestampMs) / 1000);
    if (diffSeconds < 60) return 'Vừa xong';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffSeconds / 86400)} ngày trước`;
  };

  return (
    <section 
      aria-label="Nhật ký hoạt động học tập gần đây"
      className="bg-white border-2 border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 font-sans select-none"
    >
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md">
            <Activity size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Hoạt Động Gần Đây</span>
              <span className="text-xs font-semibold text-slate-400 font-mono">(Recent Activity)</span>
            </h3>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Đồng bộ Firebase thời gian thực</span>
              </span>
              <span>•</span>
              <span>Học sinh: <strong className="text-slate-800">{user.name}</strong></span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              setFilterType('all');
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-indigo-700 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({activities.length})
          </button>

          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              setFilterType('lessons');
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              filterType === 'lessons'
                ? 'bg-white text-indigo-700 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📚 Bài học</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              setFilterType('stars');
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              filterType === 'stars'
                ? 'bg-white text-amber-600 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⭐ Sao thưởng</span>
          </button>
        </div>
      </div>

      {/* 2. Mini KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-2xs">
            📚
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 leading-tight">Bài hoàn thành</p>
            <p className="text-sm font-black text-emerald-900">{user.completedLessonsCount || totalLessonsCompleted} bài học</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-sm font-black shrink-0 shadow-2xs">
            ⭐
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 leading-tight">Tổng sao tích lũy</p>
            <p className="text-sm font-black text-amber-800">{user.stars} Sao vàng</p>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-2.5 items-center gap-3 col-span-2 sm:col-span-1 hidden sm:flex">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-2xs">
            🔥
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 leading-tight">Chuỗi học tập</p>
            <p className="text-sm font-black text-indigo-900">{user.streakDays || 1} ngày liên tục</p>
          </div>
        </div>
      </div>

      {/* 3. Feed List */}
      {filteredActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
            🌱
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">
              {filterType === 'lessons' 
                ? 'Chưa có bài học nào hoàn thành gần đây'
                : filterType === 'stars'
                ? 'Chưa có lượt thưởng sao nào gần đây'
                : 'Chưa có hoạt động gần đây'}
            </h4>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mt-1">
              Hãy bắt đầu một bài học hoặc hoàn thành thử thách đố vui để nhận sao vàng và lưu tiến trình học tập lên Firebase!
            </p>
          </div>
          {setActiveTab && (
            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                setActiveTab('grade-1');
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition cursor-pointer active:scale-95"
            >
              <span>Vào học ngay</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredActivities.map((act) => {
            const isStar = act.type === 'star_awarded' || (act.starsEarned && act.starsEarned > 0);
            const isLesson = act.type === 'lesson_completed';

            let borderStyle = 'border-slate-100 bg-white hover:border-slate-200';
            let iconBg = 'bg-slate-100 text-slate-700';

            if (isStar) {
              borderStyle = 'border-amber-200/80 bg-gradient-to-r from-amber-50/60 to-white hover:border-amber-300';
              iconBg = 'bg-amber-100 text-amber-800 border border-amber-200';
            } else if (isLesson) {
              borderStyle = 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/60 to-white hover:border-emerald-300';
              iconBg = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            }

            return (
              <div
                key={act.id}
                className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 shadow-2xs transition-all hover:shadow-xs ${borderStyle}`}
              >
                {/* Left icon & content */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-2xs ${iconBg}`}>
                    {act.icon || (isStar ? '⭐' : isLesson ? '📚' : '🎯')}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                        {act.title}
                      </h4>

                      {isLesson && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                          ✓ Hoàn thành bài
                        </span>
                      )}

                      {act.grade && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                          Lớp {act.grade}
                        </span>
                      )}
                    </div>

                    {act.subtitle && (
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {act.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side: Star Pill & Timestamp */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {act.starsEarned !== undefined && act.starsEarned > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-2.5 py-0.5 text-xs font-black shadow-xs">
                      <span>+{act.starsEarned}</span>
                      <Star size={12} className="fill-slate-950 text-slate-950" />
                    </span>
                  ) : act.badge ? (
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold">
                      {act.badge}
                    </span>
                  ) : null}

                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Clock size={10} />
                    <span>{formatRelativeTime(act.timestampMs, act.timestamp)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
