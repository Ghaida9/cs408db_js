import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Database, ArrowLeft, Send, Lightbulb, ChevronRight,
  Trophy, Zap, Star, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

type Stage = "easy" | "medium" | "hard";

const STAGE_LABELS: Record<Stage, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const STAGE_COLORS: Record<Stage, string> = {
  easy: "stage-easy",
  medium: "stage-medium",
  hard: "stage-hard",
};

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 90 ? "text-green-400" :
    score >= 70 ? "text-yellow-400" :
    score >= 50 ? "text-orange-400" :
    "text-red-400";
  const bg =
    score >= 90 ? "bg-green-400/10 border-green-400/30" :
    score >= 70 ? "bg-yellow-400/10 border-yellow-400/30" :
    score >= 50 ? "bg-orange-400/10 border-orange-400/30" :
    "bg-red-400/10 border-red-400/30";

  return (
    <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center ${bg}`}>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  );
}

function XPBadge({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 animate-badge-pop">
      <Zap className="w-3.5 h-3.5 text-yellow-400" />
      <span className="text-sm font-bold text-yellow-400">+{xp} XP</span>
    </div>
  );
}

interface FeedbackScreenProps {
  evaluation: { score: number; feedback: string; hint?: string; isCorrect: boolean };
  xpEarned: number;
  newBadges: Array<{ id: number; name: string; iconEmoji: string; rarity: string }>;
  leveledUp: boolean;
  newLevel: number;
  isStageComplete: boolean;
  isGameComplete: boolean;
  nextStage: Stage;
  sessionId: number;
  currentStage: Stage;
  questionIndex: number;
  totalQuestionsInStage: number;
  onNext: () => void;
}

function FeedbackScreen({
  evaluation, xpEarned, newBadges, leveledUp, newLevel,
  isStageComplete, isGameComplete, nextStage, sessionId,
  currentStage, questionIndex, totalQuestionsInStage, onNext
}: FeedbackScreenProps) {
  const [, navigate] = useLocation();

  return (
    <div className="animate-slide-up space-y-4">
      {/* Score */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <ScoreCircle score={evaluation.score} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {evaluation.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : evaluation.score >= 50 ? (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="font-semibold text-sm">
                  {evaluation.score >= 90 ? "Excellent!" :
                   evaluation.score >= 70 ? "Good Work!" :
                   evaluation.score >= 50 ? "Partial Credit" :
                   "Needs Review"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{evaluation.feedback}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP earned */}
      <div className="flex items-center justify-center gap-3">
        <XPBadge xp={xpEarned} />
        {leveledUp && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-400/10 border border-purple-400/30 animate-badge-pop">
            <Star className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-sm font-bold text-purple-400">Level {newLevel}!</span>
          </div>
        )}
      </div>

      {/* New badges */}
      {newBadges.length > 0 && (
        <Card className="border-yellow-400/30 bg-yellow-400/5">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-yellow-400 mb-3 text-center">New Badge Unlocked!</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {newBadges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center gap-1 animate-badge-pop">
                  <span className="text-3xl">{badge.iconEmoji}</span>
                  <span className="text-xs font-medium text-foreground">{badge.name}</span>
                  <span className={`text-xs rarity-${badge.rarity}`}>{badge.rarity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hint */}
      {evaluation.hint && (
        <Card className="border-blue-400/30 bg-blue-400/5">
          <CardContent className="p-3 flex gap-2">
            <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300 leading-relaxed">{evaluation.hint}</p>
          </CardContent>
        </Card>
      )}

      {/* Stage complete banner */}
      {isStageComplete && !isGameComplete && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-bold text-primary mb-1">
              {STAGE_LABELS[currentStage]} Stage Complete!
            </p>
            <p className="text-xs text-muted-foreground">
              Next: <span className={`font-semibold ${nextStage === "medium" ? "text-yellow-400" : "text-red-400"}`}>
                {STAGE_LABELS[nextStage]} Stage
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action button */}
      {isGameComplete ? (
        <Button
          className="w-full h-12 font-semibold"
          onClick={() => navigate(`/results/${sessionId}`)}
        >
          <Trophy className="w-4 h-4 mr-2" />
          View Final Results
        </Button>
      ) : (
        <Button className="w-full h-12 font-semibold" onClick={onNext}>
          {isStageComplete ? `Start ${STAGE_LABELS[nextStage]} Stage` : "Next Question"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}

export default function Quiz() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionIdParam = params.get("session");
  const sessionId = sessionIdParam ? parseInt(sessionIdParam) : null;

  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedbackData, setFeedbackData] = useState<null | {
    evaluation: { score: number; feedback: string; hint?: string; isCorrect: boolean };
    xpEarned: number;
    newBadges: Array<{ id: number; name: string; iconEmoji: string; rarity: string }>;
    leveledUp: boolean;
    newLevel: number;
    isStageComplete: boolean;
    isGameComplete: boolean;
    nextStage: Stage;
    currentStage: Stage;
    questionIndex: number;
    totalQuestionsInStage: number;
  }>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: questionData, isLoading: questionLoading, refetch } = trpc.quiz.getCurrentQuestion.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId && isAuthenticated }
  );

  const hintQuery = trpc.quiz.getHint.useQuery(
    { questionId: questionData?.question?.id ?? 0 },
    { enabled: showHint && !!questionData?.question?.id }
  );

  const submitMutation = trpc.quiz.submitAnswer.useMutation();

  const handleSubmit = async () => {
    if (!answer.trim() || !sessionId || !questionData?.question) return;

    try {
      const result = await submitMutation.mutateAsync({
        sessionId,
        questionId: questionData.question.id,
        answer: answer.trim(),
      });

      setFeedbackData({
        evaluation: result.evaluation,
        xpEarned: result.xpEarned,
        newBadges: result.newBadges,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
        isStageComplete: result.isStageComplete,
        isGameComplete: result.isGameComplete,
        nextStage: result.nextStage as Stage,
        currentStage: result.currentStage as Stage,
        questionIndex: result.questionIndex,
        totalQuestionsInStage: result.totalQuestionsInStage,
      });
    } catch (e) {
      toast.error("Failed to submit answer. Please try again.");
    }
  };

  const handleNext = () => {
    setFeedbackData(null);
    setAnswer("");
    setShowHint(false);
    refetch();
    textareaRef.current?.focus();
  };

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

  if (!sessionId) {
    navigate("/");
    return null;
  }

  const question = questionData?.question;
  const session = questionData?.session;
  const totalInStage = questionData?.totalQuestionsInStage ?? 7;
  const currentStage = (session?.currentStage ?? "easy") as Stage;
  const questionIndex = session?.currentQuestionIndex ?? 0;
  const progressPercent = Math.round(((questionIndex) / totalInStage) * 100);

  // Overall game progress (3 stages)
  const stageMultiplier = currentStage === "easy" ? 0 : currentStage === "medium" ? 1 : 2;
  const overallProgress = Math.round(((stageMultiplier * totalInStage + questionIndex) / (3 * totalInStage)) * 100);

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[currentStage]}`}>
              {STAGE_LABELS[currentStage]} Stage
            </span>
            <span className="text-xs text-muted-foreground">
              Q{questionIndex + 1}/{totalInStage}
            </span>
          </div>
          {/* Overall progress bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        <Database className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Stage progress dots */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {(["easy", "medium", "hard"] as Stage[]).map((stage) => (
          <div key={stage} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full transition-all ${
              stage === currentStage ? "w-6 bg-primary" :
              (stage === "medium" && currentStage === "hard") || stage === "easy" && currentStage !== "easy"
                ? "bg-primary/60" : "bg-muted"
            }`} />
          </div>
        ))}
      </div>

      {questionLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading question...</p>
          </div>
        </div>
      ) : feedbackData ? (
        <FeedbackScreen
          {...feedbackData}
          sessionId={sessionId}
          onNext={handleNext}
        />
      ) : question ? (
        <div className="flex-1 space-y-4 animate-slide-up">
          {/* Category badge */}
          {question.category && (
            <Badge variant="secondary" className="text-xs">
              {question.category}
            </Badge>
          )}

          {/* Question */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-base font-medium leading-relaxed text-foreground">
                {question.questionText}
              </p>
            </CardContent>
          </Card>

          {/* Answer input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Your Answer (1-2 words)
            </label>
            <Textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="resize-none min-h-[80px] bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{answer.length}/200</span>
              <span className="text-xs text-muted-foreground">Press Enter to submit</span>
            </div>
          </div>

          {/* Hint */}
          {showHint && hintQuery.data && (
            <Card className="border-blue-400/30 bg-blue-400/5 animate-slide-up">
              <CardContent className="p-3 flex gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300 leading-relaxed">{hintQuery.data.hint}</p>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => setShowHint(true)}
              disabled={showHint}
            >
              <Lightbulb className="w-4 h-4 mr-1.5" />
              Hint
            </Button>
            <Button
              className="flex-2 h-11 px-6 font-semibold shadow-lg shadow-primary/25"
              onClick={handleSubmit}
              disabled={!answer.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Evaluating...</>
              ) : (
                <><Send className="w-4 h-4 mr-1.5" /> Submit</>
              )}
            </Button>
          </div>

          {/* AI evaluation note */}
          <p className="text-center text-xs text-muted-foreground">
            Answers are evaluated by AI — synonyms and minor typos accepted
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">No question available</p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        </div>
      )}
    </div>
  );
}
