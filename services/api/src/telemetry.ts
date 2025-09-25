export interface TelemetryEvent {
  type:
    | 'level_start'
    | 'level_finish'
    | 'level_fail'
    | 'level_complete'
    | 'hint_used'
    | 'run'
    | 'complete'
    | 'hint'
    | 'custom';
  payload: Record<string, unknown>;
  timestamp: number;
}

export class TelemetryBuffer {
  private events: TelemetryEvent[] = [];

  record(event: TelemetryEvent): void {
    this.events.push(event);
  }

  query(): TelemetryEvent[] {
    return [...this.events];
  }

  flush(): void {
    this.events = [];
  }
}
