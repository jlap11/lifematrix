import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreCircle } from './ScoreCircle';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendUp, 
  TrendDown, 
  Calendar,
  Plus
} from '@phosphor-icons/react';
import { FactorRecord } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FactorCardProps {
  factorKey: string;
  factorLabel: string;
  data?: FactorRecord;
  onEdit?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function FactorCard({ 
  factorKey, 
  factorLabel, 
  data, 
  onEdit,
  onViewDetails,
  className 
}: FactorCardProps) {
  const score = data?.score || 0;
  const trend = data?.trend || 'stable';
  const objectives = data?.objectives || [];
  const habits = data?.habits || [];
  const hasData = Boolean(data && data.score > 0);

  const activeObjectives = objectives.filter(obj => obj.status === 'in_progress');
  const completedObjectives = objectives.filter(obj => obj.status === 'completed');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={cn(
        'relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50',
        'hover:bg-card/70 transition-all duration-300',
        hasData ? 'border-l-4 border-l-accent' : ''
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                {factorLabel}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {trend !== 'stable' && (
                  <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                    {trend === 'up' ? (
                      <TrendUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendDown className="w-3 h-3 mr-1" />
                    )}
                    {trend === 'up' ? 'Mejorando' : 'Descendente'}
                  </Badge>
                )}
                {data?.variancePct !== undefined && data.variancePct !== 0 && (
                  <span className="text-xs text-muted-foreground">
                    {data.variancePct > 0 ? '+' : ''}{data.variancePct}%
                  </span>
                )}
              </div>
            </div>
            <ScoreCircle score={score} trend={trend} size="sm" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {hasData ? (
            <>
              {/* Summary */}
              {data.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {data.summary}
                </p>
              )}

              {/* Objectives Progress */}
              {activeObjectives.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="w-4 h-4" />
                    <span>Objetivos ({activeObjectives.length})</span>
                  </div>
                  {activeObjectives.slice(0, 2).map((objective) => (
                    <div key={objective.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="line-clamp-1">{objective.title}</span>
                        <span>{objective.progressPct}%</span>
                      </div>
                      <Progress value={objective.progressPct} className="h-1" />
                    </div>
                  ))}
                  {activeObjectives.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{activeObjectives.length - 2} más
                    </p>
                  )}
                </div>
              )}

              {/* Habits */}
              {habits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    <span>Hábitos ({habits.length})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {habits.slice(0, 2).map((habit) => (
                      <div key={habit.id} className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="line-clamp-1">{habit.name}</span>
                          <span className="text-muted-foreground">{habit.adherencePct}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Racha:</span>
                          <span className="font-medium">{habit.streak}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="flex-1 text-xs"
                >
                  Editar mes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewDetails}
                  className="text-xs"
                >
                  Ver detalles
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Sin datos para este mes
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-xs"
              >
                Registrar mes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}