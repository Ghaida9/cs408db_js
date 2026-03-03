import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trophy, Zap, Star, RotateCcw, BarChart3, Share2 } from "lucide-react";
import { toast } from "sonner";

function getCompletionMessage(score: number) {
  if (score >= 90) return { title: "Outstanding!", message: "You've demonstrated mastery of Database Systems!", emoji: "🏆" };
  if (score >= 80) return { title: "Excellent Work!", message: "You have a strong understanding of the concepts.", emoji: "🎯" };
  if (score >= 70) return { title: "Well Done!", message: "Solid progress! Review the feedback to strengthen your knowledge.", emoji: "✨" };
  if (score >= 60) return { title: "Good Effort!", message: "You're on the right track. Keep studying!", emoji: "📚" };
  return { title: "Keep Learning!", message: "Every expert was once a beginner. Review and try again!", emoji: "🌱" };
}

export default function GameResults() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ sessionId: string }>();
  const sessionId = parseInt(params.sessionId ?? "0");

  const { data, isLoading } = trpc.quiz.getGameResults.useQuery(
    { sessionId },
    { enabled: !!sessionId && isAuthenticated }
  );

  const startGameMutation = trpc.quiz.startGame.useMutation();

  const handlePlayAgain = async () => {
    try {
      const result = await startGameMutation.mutateAsync();
      navigate(`/quiz?session=${result.sessionId}`);
    } catch (e) {
      toast.error("Failed to start new game.");
    }
  };

  const handleShare = () => {
    const score = data?.session?.totalScore ?? 0;
    const text = `I just scored ${score}% on the DB Systems Quiz! Can you beat me? 🗄️`;
    if (navigator.share) {
      navigator.share({ title: "DB Systems Quiz", text, url: window.location.origin });
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.origin}`);
      toast.success("Score copied to clipboard!");
    }
  };

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const session = data?.session;
  const answers = data?.answers ?? [];
  const progress = data?.progress;
  const badges = data?.badges ?? [];

  const totalScore = session?.totalScore ?? 0;
  const { title, message, emoji } = getCompletionMessage(totalScore);

  const stageScores = [
    { label: "Easy", score: session?.easyScore ?? 0, color: "text-green-400" },
    { label: "Medium", score: session?.mediumScore ?? 0, color: "text-yellow-400" },
    { label: "Hard", score: session?.hardScore ?? 0, color: "text-red-400" },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto px-4 py-6">
      {/* Completion header */}
      <div className="text-center mb-6 animate-slide-up">
        <div className="text-6xl mb-3">{emoji}</div>
        <h1 className="text-2xl font-bold gradient-text mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      {/* Overall score */}
      <Card className="border-border mb-4 animate-slide-up">
        <CardContent className="p-4 text-center">
          <div className="text-5xl font-bold mb-1" style={{
            color: totalScore >= 70 ? "oklch(0.7 0.18 145)" : totalScore >= 50 ? "oklch(0.75 0.18 55)" : "oklch(0.65 0.22 25)"
          }}>
            {totalScore}%
          </div>
          <p className="text-sm text-muted-foreground">Overall Score</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">{session?.xpEarned ?? 0} XP earned</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage breakdown */}
      <Card className="border-border mb-4">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stage Breakdown</p>
          <div className="space-y-2">
            {stageScores.map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-14">{stage.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${stage.score}%`,
                      background: stage.score >= 70 ? "oklch(0.7 0.18 145)" : stage.score >= 50 ? "oklch(0.75 0.18 55)" : "oklch(0.65 0.22 25)"
                    }}
                  />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${stage.color}`}>{stage.score}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress summary */}
      {progress && (
        <Card className="border-border mb-4">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Stats</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold">{progress.level}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
              <div>
                <p className="text-xl font-bold">{progress.totalXp}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
              <div>
                <p className="text-xl font-bold">{progress.gamesCompleted}</p>
                <p className="text-xs text-muted-foreground">Games</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges earned */}
      {badges.length > 0 && (
        <Card className="border-yellow-400/20 bg-yellow-400/5 mb-4">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-3">Badges Earned</p>
            <div className="flex gap-3 flex-wrap justify-center">
              {badges.slice(0, 6).map((badge) => (
                <div key={badge.id} className="flex flex-col items-center gap-1">
                  <span className="text-3xl animate-badge-pop">{badge.iconEmoji}</span>
                  <span className="text-xs text-center">{badge.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <Button
          className="w-full h-12 font-semibold shadow-lg shadow-primary/25"
          onClick={handlePlayAgain}
          disabled={startGameMutation.isPending}
        >
          {startGameMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Starting...</>
          ) : (
            <><RotateCcw className="w-4 h-4 mr-2" /> Play Again</>
          )}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11" onClick={() => navigate("/progress")}>
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Progress
          </Button>
          <Button variant="outline" className="h-11" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </Button>
        </div>
        <Button variant="ghost" className="w-full" onClick={() => navigate("/leaderboard")}>
          <Trophy className="w-4 h-4 mr-2" />
          View Leaderboard
        </Button>
      </div>
    </div>
  );
}
