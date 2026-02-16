import React from 'react';
import { cn } from '@/lib/utils';
import type { CallRecord } from '@/types';
import { Phone, Clock, AlertTriangle, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface CallHistoryProps {
  calls: CallRecord[];
}

const riskColors = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-danger/10 text-danger border-danger/30',
};

const riskIcons = {
  low: Check,
  medium: AlertTriangle,
  high: X,
};

export const CallHistory: React.FC<CallHistoryProps> = ({ calls }) => {
  if (calls.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Phone className="h-10 w-10 text-primary/50" />
          </div>
          <h3 className="text-xl font-bold">No Call History Yet</h3>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Your monitored calls will appear here. Start monitoring a call to see the analysis results and risk assessment.
          </p>
        </div>

        {/* Example Preview */}
        <div className="rounded-2xl border-2 border-border bg-card/50 p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>What you'll see here</span>
          </h4>
          <div className="space-y-3">
            {/* Example Low Risk */}
            <div className="flex items-center gap-4 rounded-xl border-2 border-success/30 bg-success/5 p-4 opacity-60">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-success">LOW Risk Call</p>
                <p className="text-sm text-muted-foreground">Date & Time</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-success">15%</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            {/* Example High Risk */}
            <div className="flex items-center gap-4 rounded-xl border-2 border-danger/30 bg-danger/5 p-4 opacity-60">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/20">
                <X className="h-6 w-6 text-danger" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-danger">HIGH Risk Call</p>
                <p className="text-sm text-muted-foreground">Date & Time</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-danger">85%</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-center text-muted-foreground italic">
            These are example previews. Your actual call history will appear above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Clock className="h-6 w-6" />
        Recent Calls
      </h3>

      <div className="space-y-3">
        {calls.map((call) => {
          const RiskIcon = riskIcons[call.riskLevel];
          return (
            <div
              key={call.id}
              className={cn(
                'flex items-center gap-4 rounded-xl border-2 p-4 transition-all hover:shadow-md',
                riskColors[call.riskLevel]
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  call.riskLevel === 'low' && 'bg-success/20',
                  call.riskLevel === 'medium' && 'bg-warning/20',
                  call.riskLevel === 'high' && 'bg-danger/20'
                )}
              >
                <RiskIcon className="h-6 w-6" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  {call.riskLevel.toUpperCase()} Risk Call
                </p>
                <p className="text-sm opacity-80">
                  {format(call.date, 'MMM d, yyyy • h:mm a')}
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold">{call.riskScore}%</p>
                <p className="text-xs opacity-80">
                  {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')} min
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
