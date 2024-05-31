function formatRetryTime(seconds: number): string[] {
  if (isNaN(seconds) || seconds < 0) {
    return [];
  }
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const result = [];
  if (days > 0) {
    result.push(`${days}天`);
  }
  if (hours > 0) {
    result.push(`${hours}小时`);
  }
  if (minutes > 0) {
    result.push(`${minutes}分钟`);
  }
  if (remainingSeconds > 0) {
    result.push(`${remainingSeconds}秒`);
  }
  return result;
}
export { formatRetryTime };
