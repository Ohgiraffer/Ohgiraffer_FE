// 바이트 단위 파일 크기를 "238 KB", "1.2 MB" 같은 표시용 문자열로 변환
export function formatFileSize(bytes: number): string {
   if (bytes <= 0) return '0 KB';

   const units = ['B', 'KB', 'MB', 'GB'];
   const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
   const value = bytes / 1024 ** exponent;
   const precision = exponent === 0 || value >= 10 ? 0 : 1;

   return `${value.toFixed(precision)} ${units[exponent]}`;
}
