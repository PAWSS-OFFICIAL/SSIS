import React from "react";

// Simple Progress Ring Component
export const ProgressRing = ({ 
  progress, 
  size = 120, 
  strokeWidth = 10, 
  color = "#3b82f6",
  bgColor = "#e2e8f0",
  children 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// Bar Chart Component
export const BarChart = ({ data, maxValue, height = 200, barColor = "#3b82f6" }) => {
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full relative" style={{ height: "80%" }}>
              <div
                className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: barColor,
                  opacity: 0.8 + (idx % 3) * 0.1
                }}
              />
            </div>
            <span className="text-xs text-slate-500 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Line Chart Component
export const LineChart = ({ data, height = 200, color = "#3b82f6", fillColor = "rgba(59, 130, 246, 0.1)" }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,100 ${points} 100,100`;

  return (
    <div className="w-full relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <polygon points={fillPoints} fill={fillColor} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((item, idx) => {
          const x = (idx / (data.length - 1)) * 100;
          const y = 100 - ((item.value - minValue) / range) * 100;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        {data.map((item, idx) => (
          <span key={idx} className={idx % 2 === 0 ? "" : "hidden sm:inline"}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// Pie Chart Component
export const PieChart = ({ data, size = 200 }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let currentAngle = 0;

  return (
    <div className="flex items-center gap-8">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((item, idx) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          const endAngle = currentAngle;

          const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
          const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
          const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
          const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);

          const largeArc = angle > 180 ? 1 : 0;

          return (
            <path
              key={idx}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-slate-800" />
      </svg>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
            <span className="text-sm font-medium">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stats Card with Mini Chart
export const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = "neutral",
  icon: Icon,
  chartData,
  color = "blue"
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              changeType === "positive" ? "text-emerald-600" : 
              changeType === "negative" ? "text-red-600" : "text-slate-500"
            }`}>
              {changeType === "positive" && "↑ "}
              {changeType === "negative" && "↓ "}
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {chartData && (
        <div className="mt-4 h-16">
          <LineChart data={chartData} height={64} color={
            color === "blue" ? "#3b82f6" :
            color === "green" ? "#10b981" :
            color === "amber" ? "#f59e0b" :
            color === "red" ? "#ef4444" : "#8b5cf6"
          } />
        </div>
      )}
    </div>
  );
};

// Heatmap Component (for attendance)
export const Heatmap = ({ data, month }) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-slate-500">
        <span>{month}</span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded" /> Present</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /> Absent</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 rounded" /> No Class</span>
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => (
          <div key={day} className="text-xs text-center text-slate-500 py-1">{day}</div>
        ))}
        {data.map((item, idx) => (
          <div
            key={idx}
            className={`aspect-square rounded-md ${
              item.status === "present" ? "bg-emerald-500" :
              item.status === "absent" ? "bg-red-500" :
              item.status === "late" ? "bg-amber-500" :
              "bg-slate-100 dark:bg-slate-700"
            }`}
            title={`${item.date}: ${item.status}`}
          />
        ))}
      </div>
    </div>
  );
};
