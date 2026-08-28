const isProduction = process.env.NODE_ENV === 'production';

interface LogEntry {
  level: string;
  timestamp: string;
  message: string;
  context?: string;
  [key: string]: any;
}

function formatLog(level: string, message: string, meta?: Record<string, any>): string {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...meta,
  };

  if (isProduction) {
    return JSON.stringify(entry);
  }

  const prefix = `[${level.toUpperCase()}] ${entry.timestamp} -`;
  return `${prefix} ${message}`;
}

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(formatLog('info', message, meta));
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(formatLog('warn', message, meta));
  },
  error: (message: string, error?: unknown, meta?: Record<string, any>) => {
    const errorMeta: Record<string, any> = { ...meta };
    if (error instanceof Error) {
      errorMeta.errorName = error.name;
      errorMeta.errorMessage = error.message;
      if (!isProduction) {
        errorMeta.stack = error.stack;
      }
    }
    console.error(formatLog('error', message, errorMeta));
  },
  aiFallback: (message: string, meta?: Record<string, any>) => {
    console.warn(formatLog('warn', message, { context: 'AI_FALLBACK', ...meta }));
  },
};
