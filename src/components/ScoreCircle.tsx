import { motion } from 'framer-motion';
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  className?: string;
}

export function ScoreCircle({ 
  score, 
  trend = 'stable', 
  size = 'md', 
  showTrend = true,
  className 
}: ScoreCircleProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'stroke-green-500';
    if (score >= 50) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted-foreground/20"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className={getScoreColor(score)}
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      
      <div className="flex flex-col items-center justify-center">
        <motion.span 
          className={cn('font-bold tabular-nums', textSizes[size])}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {Math.round(score)}
        </motion.span>
        {showTrend && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            {getTrendIcon()}
          </motion.div>
        )}
      </div>
    </div>
  );
}