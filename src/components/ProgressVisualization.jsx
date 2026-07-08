import React from "react";
import { ProgressRing } from "./ui/charts";
import { cn } from "../lib/utils";
import { Star, Trophy, Target, Zap, Lock, CheckCircle } from "lucide-react";

// Skill Tree Node
export const SkillNode = ({ 
  title, 
  description, 
  icon: Icon, 
  completed, 
  locked, 
  progress,
  onClick,
  connections = []
}) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Connection lines */}
      {connections.map((conn, idx) => (
        <div
          key={idx}
          className={cn(
            "absolute w-1 h-16 -top-16",
            conn.completed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
          )}
          style={{ 
            transform: conn.side === "left" ? "rotate(-30deg)" : 
                      conn.side === "right" ? "rotate(30deg)" : "none",
            transformOrigin: "bottom"
          }}
        />
      ))}
      
      {/* Node */}
      <button
        onClick={onClick}
        disabled={locked}
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center transition-all",
          completed && "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
          !completed && !locked && "bg-blue-500 text-white shadow-lg shadow-blue-500/30",
          locked && "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
        )}
      >
        {completed ? (
          <CheckCircle className="w-8 h-8" />
        ) : locked ? (
          <Lock className="w-6 h-6" />
        ) : (
          <Icon className="w-8 h-8" />
        )}
        
        {/* Progress ring for in-progress nodes */}
        {!completed && !locked && progress > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="38"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="3"
            />
            <circle
              cx="40"
              cy="40"
              r="38"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeDasharray={`${progress * 2.4} 240`}
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      
      {/* Label */}
      <div className="mt-3 text-center">
        <p className={cn(
          "font-medium text-sm",
          completed && "text-emerald-600 dark:text-emerald-400",
          !completed && !locked && "text-blue-600 dark:text-blue-400",
          locked && "text-slate-400"
        )}>
          {title}
        </p>
        <p className="text-xs text-slate-500 max-w-[120px]">{description}</p>
      </div>
    </div>
  );
};

// Skill Tree
export const SkillTree = ({ skills }) => {
  return (
    <div className="py-8 overflow-x-auto">
      <div className="flex flex-col items-center gap-16 min-w-[600px]">
        {/* Level 1 - Root */}
        <div className="flex justify-center">
          <SkillNode {...skills[0]} />
        </div>
        
        {/* Level 2 */}
        <div className="flex justify-center gap-32">
          {skills.slice(1, 3).map((skill, idx) => (
            <SkillNode 
              key={idx} 
              {...skill} 
              connections={[{ completed: skills[0].completed }]}
            />
          ))}
        </div>
        
        {/* Level 3 */}
        <div className="flex justify-center gap-16">
          {skills.slice(3).map((skill, idx) => (
            <SkillNode 
              key={idx} 
              {...skill} 
              connections={[{ 
                completed: skills[Math.floor(idx / 2) + 1]?.completed,
                side: idx % 2 === 0 ? "left" : "right"
              }]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Learning Path Progress
export const LearningPathProgress = ({ 
  title, 
  description, 
  currentStep, 
  totalSteps, 
  steps 
}) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <ProgressRing progress={progress} size={80} strokeWidth={8} color="#10b981">
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {Math.round(progress)}%
          </span>
        </ProgressRing>
      </div>
      
      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div 
            key={idx}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg transition-colors",
              step.completed && "bg-emerald-50 dark:bg-emerald-900/20",
              idx === currentStep && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
              idx > currentStep && "opacity-50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step.completed && "bg-emerald-500 text-white",
              idx === currentStep && "bg-blue-500 text-white",
              idx > currentStep && "bg-slate-200 dark:bg-slate-700 text-slate-500"
            )}>
              {step.completed ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                idx + 1
              )}
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                step.completed && "text-emerald-900 dark:text-emerald-300",
                idx === currentStep && "text-blue-900 dark:text-blue-300",
                idx > currentStep && "text-slate-500"
              )}>
                {step.title}
              </p>
              <p className="text-sm text-slate-500">{step.description}</p>
            </div>
            {step.points && (
              <Badge variant="outline" className="text-amber-600">
                +{step.points} pts
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Achievement Progress Card
export const AchievementProgress = ({ 
  icon: Icon, 
  title, 
  description, 
  current, 
  target, 
  color = "blue" 
}) => {
  const progress = Math.min((current / target) * 100, 100);
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          colorClasses[color].replace("bg-", "bg-").replace("500", "100"),
          "dark:bg-opacity-20"
        )}>
          <Icon className={cn("w-6 h-6", colorClasses[color].replace("bg-", "text-"))} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-sm text-slate-500 mb-3">{description}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Progress</span>
              <span className="font-medium">{current} / {target}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", colorClasses[color])}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Streak Calendar
export const StreakCalendar = ({ data, streak, longestStreak }) => {
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Activity Streak
          </h3>
          <p className="text-sm text-slate-500">Keep learning every day!</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-amber-500">{streak}</p>
          <p className="text-sm text-slate-500">day streak</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex gap-2">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  "w-8 h-8 rounded-md transition-all",
                  day.active && "bg-emerald-500",
                  !day.active && day.date && "bg-slate-100 dark:bg-slate-700",
                  !day.date && "bg-transparent"
                )}
                title={day.date ? `${day.date}: ${day.active ? "Active" : "Inactive"}` : ""}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>Longest streak: {longestStreak} days</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded" /> Active
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded" /> Inactive
          </span>
        </div>
      </div>
    </div>
  );
};

// Badge with Progress
export const BadgeProgress = ({ 
  icon, 
  name, 
  description, 
  earned, 
  progress,
  rarity = "common" 
}) => {
  const rarityColors = {
    common: "border-slate-300 bg-slate-50",
    rare: "border-blue-300 bg-blue-50",
    epic: "border-purple-300 bg-purple-50",
    legendary: "border-amber-300 bg-amber-50",
  };

  return (
    <div className={cn(
      "relative p-4 rounded-xl border-2 transition-all",
      earned ? rarityColors[rarity] : "border-slate-200 bg-slate-50 opacity-60",
      "dark:bg-opacity-10"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center text-3xl",
          earned ? "bg-white dark:bg-slate-800 shadow-lg" : "bg-slate-200 dark:bg-slate-700"
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className={cn(
            "font-semibold",
            earned ? "text-slate-900 dark:text-white" : "text-slate-500"
          )}>
            {name}
          </h4>
          <p className="text-sm text-slate-500">{description}</p>
          
          {!earned && progress !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {earned && (
          <div className="absolute top-2 right-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
        )}
      </div>
    </div>
  );
};

import { Badge } from "./ui/badge";
