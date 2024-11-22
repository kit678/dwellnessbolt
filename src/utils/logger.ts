export function logWithDetails(message: string) {
  const stack = new Error().stack;
  if (stack) {
    const stackLines = stack.split('\n');
    const callerLine = stackLines[2]; // Adjust index based on your environment
    const match = callerLine.match(/at (.+) \((.+):(\d+):(\d+)\)/);
    if (match) {
      const [, functionName, filePath, lineNumber] = match;
      console.log(`[${filePath}:${lineNumber}] ${functionName}: ${message}`);
    } else {
      console.log(message);
    }
  } else {
    console.log(message);
  }
} 