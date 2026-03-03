import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Trophy, Zap, BookOpen, LogOut, Star, Target, Flame, Brain } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      window.location.reload();
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="h-11"
      />
      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="h-11"
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
      />
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <Button
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Please wait..." : mode === "login" ? "Sign In to Play" : "Create Account"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {mode === "login" ? "No account? " : "Have an account? "}
        <button className="text-primary underline" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Register" : "Sign In"}
        </button>
      </p>
    </div>
  );
}
function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">DB Systems Quiz</h1>
          <p className="text-muted-foreground text-center mt-2 text-sm leading-relaxed">
            Master Database Systems with AI-powered evaluation and gamified learning
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: <Zap className="w-5 h-5" />, label: "AI Grading", color: "text-yellow-400" },
            { icon: <Trophy className="w-5 h-5" />, label: "Badges", color: "text-purple-400" },
            { icon: <Star className="w-5 h-5" />, label: "Leaderboard", color: "text-cyan-400" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border">
              <span className={f.color}>{f.icon}</span>
              <span className="text-xs text-muted-foreground font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Login form */}
        <LoginForm />

        <p className="text-center text-xs text-muted-foreground mt-3">
          Progress is saved to your account
        </p>

        {/* AI Model badge */}
        <div className="flex items-center justify-center gap-2 mt-4 px-3 py-2 rounded-xl bg-card border border-border">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Llama 3.1 8B Instruct
            </a>
            {" "}via HuggingFace
          </span>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: progressData, isLoading: progressLoading } = trpc.progress.getMyProgress.useQuery();
  const startGameMutation = trpc.quiz.startGame.useMutation();

  const handleStartGame = async () => {
    try {
      const result = await startGameMutation.mutateAsync();
      if (result.isResumed) {
        toast.info("Resuming your previous game...");
      }
      navigate(`/quiz?session=${result.sessionId}`);
    } catch (e) {
      toast.error("Failed to start game. Please try again.");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
  };

  const progress = progressData?.progress;
  const levelInfo = progressData?.levelInfo;
  const earnedBadges = progressData?.earnedBadges ?? [];

  const xpPercent = levelInfo
    ? Math.min(100, Math.round((levelInfo.xpProgress / levelInfo.xpNeeded) * 100))
    : 0;

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm gradient-text">DB Systems Quiz</h1>
            <p className="text-xs text-muted-foreground">{user?.name || user?.email || "Player"}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Level & XP Card */}
      {progressLoading ? (
        <Card className="mb-4 border-border">
          <CardContent className="p-4 flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-4 border-border bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">Level {levelInfo?.level ?? 1}</span>
                  <Badge variant="secondary" className="text-xs">
                    {levelInfo?.totalXp ?? 0} XP
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {levelInfo?.xpProgress ?? 0} / {levelInfo?.xpNeeded ?? 100} XP to next level
                </p>
              </div>
              <div className="text-3xl">
                {(levelInfo?.level ?? 1) >= 10 ? "👑" : (levelInfo?.level ?? 1) >= 5 ? "🏅" : "⭐"}
              </div>
            </div>
            {/* XP Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: <BookOpen className="w-4 h-4" />, value: progress?.questionsCompleted ?? 0, label: "Questions", color: "text-cyan-400" },
          { icon: <Target className="w-4 h-4" />, value: progress?.gamesCompleted ?? 0, label: "Games", color: "text-purple-400" },
          { icon: <Flame className="w-4 h-4" />, value: progress?.currentStreak ?? 0, label: "Streak", color: "text-orange-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-3 flex flex-col items-center">
              <span className={stat.color}>{stat.icon}</span>
              <span className="text-xl font-bold mt-1">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Start Game Button */}
      <Button
        className="w-full h-14 text-lg font-bold mb-4 shadow-lg shadow-primary/25"
        onClick={handleStartGame}
        disabled={startGameMutation.isPending}
      >
        {startGameMutation.isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Starting...</>
        ) : (
          <><Zap className="w-5 h-5 mr-2" /> Start Quiz</>
        )}
      </Button>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button variant="outline" className="h-12 flex gap-2" onClick={() => navigate("/progress")}>
          <Trophy className="w-4 h-4 text-yellow-400" />
          My Progress
        </Button>
        <Button variant="outline" className="h-12 flex gap-2" onClick={() => navigate("/leaderboard")}>
          <Star className="w-4 h-4 text-cyan-400" />
          Leaderboard
        </Button>
      </div>

      {/* Recent badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Badges</h3>
          <div className="flex gap-2 flex-wrap">
            {earnedBadges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border min-w-[60px]"
                title={badge.description}
              >
                <span className="text-2xl">{badge.iconEmoji}</span>
                <span className="text-xs text-muted-foreground text-center leading-tight">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {earnedBadges.length === 0 && !progressLoading && (
        <Card className="border-dashed border-border">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Complete your first quiz to earn badges!</p>
          </CardContent>
        </Card>
      )}

      {/* AI Model footer badge */}
      <div className="flex items-center justify-center gap-2 mt-6 px-3 py-2 rounded-xl bg-card border border-border">
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">
          AI grading by{" "}
          <a
            href="https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Llama 3.1 8B Instruct
          </a>
          {" "}(Cerebras · HuggingFace)
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}
