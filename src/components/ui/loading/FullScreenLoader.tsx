const dots = [
   { color: '#6A2424', delay: '0s' },
   { color: '#2E4A3D', delay: '0.4s' },
   { color: '#8FA888', delay: '0.8s' },
   { color: '#E8B84B', delay: '1.2s' },
];

// 라우트 전환/초기 로딩 시 전체 화면 오버레이로 사용
export default function FullScreenLoader() {
   return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
         <div className="flex items-center gap-[11px]">
            {dots.map((dot) => (
               <span
                  key={dot.color}
                  className="dot-glow h-[13px] w-[13px] rounded-full"
                  style={
                     { backgroundColor: dot.color, '--dot-delay': dot.delay } as React.CSSProperties
                  }
               />
            ))}
         </div>
         <p className="text-base font-semibold text-brand-green">CampFlow</p>
         <p className="text-[12.5px] text-muted-foreground">불러오는 중</p>
      </div>
   );
}
