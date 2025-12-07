"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { GeneratedAnswer } from "@/types";
import { cn, getConfidenceColor } from "@/lib/utils";

interface QACardProps {
  answer: GeneratedAnswer;
  onAccept?: (answer: string) => void;
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

export function QACard({
  answer,
  onAccept,
  onRegenerate,
  isGenerating = false,
}: QACardProps) {
  const [copied, setCopied] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState(answer.answer);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      {/* Question */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded bg-electric/20 flex items-center justify-center">
            <span className="text-xs font-bold text-electric-bright">Q</span>
          </span>
          <span className="text-xs text-silver">Question</span>
        </div>
        <p className="text-snow font-medium">{answer.question}</p>
      </div>

      {/* Answer */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-mint/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-mint-bright" />
            </span>
            <span className="text-xs text-silver">AI Generated Answer</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium",
                getConfidenceColor(answer.confidence)
              )}
            >
              {Math.round(answer.confidence * 100)}% confidence
            </span>
          </div>
        </div>

        {isGenerating ? (
          <div className="flex items-center gap-3 p-4 bg-slate/30 rounded-lg">
            <div className="spinner" />
            <span className="text-sm text-silver">Generating answer...</span>
          </div>
        ) : (
          <textarea
            value={editedAnswer}
            onChange={(e) => setEditedAnswer(e.target.value)}
            className="w-full min-h-[120px] p-4 bg-slate/30 border border-graphite rounded-lg text-cloud text-sm focus:outline-none focus:border-electric resize-none transition-colors"
          />
        )}
      </div>

      {/* Suggestions */}
      {answer.suggestions && answer.suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-silver mb-2">Suggestions to improve:</p>
          <div className="flex flex-wrap gap-2">
            {answer.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="px-3 py-1.5 bg-slate/50 hover:bg-slate border border-graphite rounded-lg text-xs text-cloud hover:text-snow transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-graphite">
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="btn-ghost flex items-center gap-1.5 text-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            Regenerate
          </button>
          <button
            onClick={handleCopy}
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            {copied ? (
              <Check className="w-4 h-4 text-mint" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-silver hover:text-coral hover:bg-coral/10 transition-all">
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-silver hover:text-mint hover:bg-mint/10 transition-all">
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAccept?.(editedAnswer)}
            className="btn-primary flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

