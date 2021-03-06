export enum EventType {
  TaskScheduled = 'task_scheduled',
  TaskQueued = 'task_queued',
  TaskUpdated = 'task_updated',
  TaskProgressUpdated = 'task_progress_updated',
  TaskStalled = 'task_stalled',
  TaskProcessing = 'task_processing',
  TaskSuccess = 'task_success',
  TaskComplete = 'task_complete',
  TaskError = 'task_error',
  TaskFail = 'task_fail',
  WorkerStarted = 'worker_started',
  WorkerPaused = 'worker_paused',
  WorkerShutdown = 'worker_shutdown',
}
