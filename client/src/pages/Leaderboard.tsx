import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trophy, Medal, Zap, BookOpen } from "lucide-react";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: entries, isLoading } = trpc.leaderboard.getTop.useQuery();
  const { data: myRank } = trpc.leaderboard.getMyRank.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold gradient-text">Leaderboard</h1>
          {myRank?.rank && (
            <p className="text-xs text-muted-foreground">
              Your rank: #{myRank.rank} of {myRank.total} players
            </p>
          )}
        </div>
        <Trophy className="w-5 h-5 text-yellow-400" />
      </div>

      {/* Top 3 podium */}
      {!isLoading && entries && entries.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6 px-2">
          {/* 2nd place */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-12 h-12 rounded-full bg-slate-400/20 border-2 border-slate-400/40 flex items-center justify-center text-lg font-bold">
              {entries[1]?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <p className="text-xs font-medium text-center truncate w-full">{entries[1]?.name ?? "?"}</p>
            <p className="text-xs text-muted-foreground">{entries[1]?.totalXp ?? 0} XP</p>
            <div className="w-full h-12 bg-slate-400/20 rounded-t-lg flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-14 h-14 rounded-full bg-yellow-400/20 border-2 border-yellow-400/40 flex items-center justify-center text-xl font-bold">
              {entries[0]?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <p className="text-xs font-medium text-center truncate w-full">{entries[0]?.name ?? "?"}</p>
            <p className="text-xs text-yellow-400 font-semibold">{entries[0]?.totalXp ?? 0} XP</p>
            <div className="w-full h-16 bg-yellow-400/20 rounded-t-lg flex items-center justify-center">
              <span className="text-2xl">🥇</span>
            </div>
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-12 h-12 rounded-full bg-orange-400/20 border-2 border-orange-400/40 flex items-center justify-center text-lg font-bold">
              {entries[2]?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <p className="text-xs font-medium text-center truncate w-full">{entries[2]?.name ?? "?"}</p>
            <p className="text-xs text-muted-foreground">{entries[2]?.totalXp ?? 0} XP</p>
            <div className="w-full h-8 bg-orange-400/20 rounded-t-lg flex items-center justify-center">
              <span className="text-2xl">🥉</span>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-2">
          {entries.slice(3).map((entry) => {
            const isMe = user && entry.userId === (user as any).id;
            return (
              <Card
                key={entry.userId}
                className={`border-border transition-all ${isMe ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <RankIcon rank={entry.rank} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                        {entry.name}
                        {isMe && <span className="text-xs text-primary ml-1">(you)</span>}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">Lv.{entry.level}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-yellow-400">
                        <Zap className="w-3 h-3" />{entry.totalXp} XP
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="w-3 h-3" />{entry.questionsCompleted} Q
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-border">
          <CardContent className="p-8 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No players yet. Be the first!</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <Button className="w-full h-12 font-semibold" onClick={() => navigate("/")}>
          Play to Climb the Ranks
        </Button>
      </div>
    </div>
  );
}
