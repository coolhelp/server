"use client";

import { Clock, DollarSign, Users, MapPin, Star, ChevronRight } from "lucide-react";
import { FreelancerProject } from "@/types";
import { cn, formatCurrency, formatRelativeTime, truncateText, getStatusColor } from "@/lib/utils";

interface ProjectCardProps {
  project: FreelancerProject;
  onClick?: () => void;
  delay?: number;
}

export function ProjectCard({ project, onClick, delay = 0 }: ProjectCardProps) {
  const unansweredQuestions = project.questions.filter((q) => !q.answer).length;

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer group opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("badge", getStatusColor(project.status))}>
              {project.status}
            </span>
            <span className="badge bg-slate/50 text-silver border border-graphite">
              {project.type}
            </span>
          </div>
          <h3 className="font-semibold text-snow group-hover:text-electric-bright transition-colors">
            {truncateText(project.title, 60)}
          </h3>
        </div>
        <ChevronRight className="w-5 h-5 text-silver group-hover:text-electric transition-colors transform group-hover:translate-x-1 duration-200" />
      </div>

      <p className="text-sm text-silver mb-4 line-clamp-2">
        {truncateText(project.description, 150)}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.skills.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="px-2 py-0.5 bg-slate/50 rounded text-xs text-cloud"
          >
            {skill}
          </span>
        ))}
        {project.skills.length > 4 && (
          <span className="px-2 py-0.5 bg-slate/50 rounded text-xs text-silver">
            +{project.skills.length - 4}
          </span>
        )}
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between pt-4 border-t border-graphite">
        <div className="flex items-center gap-4 text-xs text-silver">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {formatCurrency(project.budget.min)} - {formatCurrency(project.budget.max)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {project.bidCount} bids
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatRelativeTime(project.postedAt)}
          </span>
        </div>

        {unansweredQuestions > 0 && (
          <span className="badge badge-amber">
            {unansweredQuestions} Q&A pending
          </span>
        )}
      </div>

      {/* Client info */}
      {(project.clientCountry || project.clientRating) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-graphite text-xs text-silver">
          {project.clientCountry && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {project.clientCountry}
            </span>
          )}
          {project.clientRating && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber" />
              {project.clientRating.toFixed(1)}
              {project.clientReviews && (
                <span className="text-steel">({project.clientReviews})</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

