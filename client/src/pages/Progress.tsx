import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Lock, Trophy, Zap, Target, Flame, BookOpen, Star } from "lucide-react";

const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };
const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-400",
  rare: "text-cyan-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};
const RARITY_BG: Record<string, string> = {
  common: "bg-slate-400/10 border-slate-400/20",
  rare: "bg-cyan-400/10 border-cyan-400/20",
  epic: "bg-purple-400/10 border-purple-400/20",
  legendary: "bg-yellow-400/10 border-yellow-400/20",
};

export default function Progress() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.progress.getMyProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const progress = data?.progress;
  const earnedBadges = data?.earnedBadges ?? [];
  const lockedBadges = data?.lockedBadges ?? [];
  const levelInfo = data?.levelInfo;
  const xpPercent = levelInfo
    ? Math.min(100, Math.round((levelInfo.xpProgress / levelInfo.xpNeeded) * 100))
    : 0;

  const sortedEarned = [...earnedBadges].sort(
    (a, b) => (RARITY_ORDER[b.rarity as keyof typeof RARITY_ORDER] ?? 0) - (RARITY_ORDER[a.rarity as keyof typeof RARITY_ORDER] ?? 0)
  );
  const sortedLocked = [...lockedBadges].sort(
    (a, b) => (RARITY_ORDER[a.rarity as keyof typeof RARITY_ORDER] ?? 0) - (RARITY_ORDER[b.rarity as keyof typeof RARITY_ORDER] ?? 0)
  );

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold gradient-text">My Progress</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Level card */}
          <Card className="border-border bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">Level {levelInfo?.level ?? 1}</span>
                    <span className="text-2xl">
                      {(levelInfo?.level ?? 1) >= 10 ? "👑" : (levelInfo?.level ?? 1) >= 5 ? "🏅" : "⭐"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {levelInfo?.totalXp ?? 0} XP total
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Next level</p>
                  <p className="text-sm font-semibold text-primary">
                    {levelInfo?.xpNeeded ? levelInfo.xpNeeded - levelInfo.xpProgress : 0} XP to go
                  </p>
                </div>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">{xpPercent}%</p>
            </CardContent>
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <BookOpen className="w-5 h-5" />, value: progress?.questionsCompleted ?? 0, label: "Questions Answered", color: "text-cyan-400" },
              { icon: <Target className="w-5 h-5" />, value: progress?.gamesCompleted ?? 0, label: "Games Completed", color: "text-purple-400" },
              { icon: <Flame className="w-5 h-5" />, value: progress?.currentStreak ?? 0, label: "Current Streak", color: "text-orange-400" },
              { icon: <Star className="w-5 h-5" />, value: progress?.longestStreak ?? 0, label: "Best Streak", color: "text-yellow-400" },
              { icon: <Zap className="w-5 h-5" />, value: `${progress?.averageScore ?? 0}%`, label: "Avg Score", color: "text-green-400" },
              { icon: <Trophy className="w-5 h-5" />, value: progress?.perfectScores ?? 0, label: "Perfect Scores", color: "text-yellow-400" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-3 flex items-center gap-3">
                  <span className={stat.color}>{stat.icon}</span>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Earned badges */}
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Earned Badges ({earnedBadges.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {sortedEarned.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete your first quiz to earn badges!
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {sortedEarned.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${RARITY_BG[badge.rarity]}`}
                    >
                      <span className="text-2xl">{badge.iconEmoji}</span>
                      <span className="text-xs font-medium text-center leading-tight">{badge.name}</span>
                      <span className={`text-xs capitalize ${RARITY_COLORS[badge.rarity]}`}>{badge.rarity}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Locked badges */}
          {sortedLocked.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Locked Badges ({lockedBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {sortedLocked.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border bg-muted/30 opacity-60"
                      title={badge.description}
                    >
                      <div className="relative">
                        <span className="text-2xl grayscale">{badge.iconEmoji}</span>
                        <Lock className="w-3 h-3 text-muted-foreground absolute -bottom-0.5 -right-0.5" />
                      </div>
                      <span className="text-xs font-medium text-center leading-tight text-muted-foreground">{badge.name}</span>
                      <span className={`text-xs capitalize ${RARITY_COLORS[badge.rarity]} opacity-60`}>{badge.rarity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Play again button */}
          <Button className="w-full h-12 font-semibold" onClick={() => navigate("/")}>
            <Zap className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      )}
    </div>
  );
}
