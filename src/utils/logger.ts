export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  component?: string;
}

const defaultConfig: LogConfig = {
  enabled: true,
  level: LogLevel.INFO
};

let logConfig: LogConfig = { ...defaultConfig };

export function configureLogger(config: Partial<LogConfig>) {
  logConfig = { ...logConfig, ...config };
}

function shouldLog(level: LogLevel): boolean {
  if (!logConfig.enabled) return false;
  const levels = Object.values(LogLevel);
  return levels.indexOf(level) >= levels.indexOf(logConfig.level);
}

function formatMessage(level: LogLevel, message: string, component?: string): string {
  const timestamp = new Date().toISOString();
  const componentStr = component ? `[${component}]` : '';
  return `${timestamp} ${level} ${componentStr} ${message}`;
}

function getCallerInfo() {
  const stack = new Error().stack;
  if (stack) {
    const stackLines = stack.split('\n');
    const callerLine = stackLines[3]; // Skip Error, getCallerInfo, and log function
    const match = callerLine?.match(/at (.+) \((.+):(\d+):(\d+)\)/);
    if (match) {
      const [, functionName, filePath, lineNumber] = match;
      return `${filePath}:${lineNumber} ${functionName}`;
    }
  }
  return '';
}

export function log(
  level: LogLevel,
  message: string,
  component?: string,
  error?: Error
) {
  if (!shouldLog(level)) return;

  const callerInfo = getCallerInfo();
  const formattedMessage = formatMessage(level, message, component || callerInfo);

  // Store log in localStorage
  const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
  logs.push(formattedMessage);
  localStorage.setItem('appLogs', JSON.stringify(logs));

  switch (level) {
    case LogLevel.ERROR:
      console.error(formattedMessage, error || '');
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage);
      break;
    case LogLevel.DEBUG:
      console.debug(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

export const logger = {
  debug: (message: string, component?: string) => log(LogLevel.DEBUG, message, component),
  info: (message: string, component?: string) => log(LogLevel.INFO, message, component),
  warn: (message: string, component?: string) => log(LogLevel.WARN, message, component),
  error: (message: string, error?: Error, component?: string) => 
    log(LogLevel.ERROR, message, component, error)
};
