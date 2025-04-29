'use client';

import Script from 'next/script';

// 这个组件使用Next.js的Script组件来解决水合(hydration)不匹配问题
// 它会在页面加载时立即执行清理操作，而不是等待React组件生命周期
export function HydrationFix() {
  return (
    <Script id="hydration-fix" strategy="beforeInteractive">
      {`
      (function() {
        // 这段脚本会在DOM准备好时执行，在React水合之前
        function fixHydrationIssues() {
          if (typeof document !== 'undefined') {
            // 移除html标签上的"tongyi-design-pc"类名
            document.documentElement.classList.remove('tongyi-design-pc');
            
            // 如果html标签上有空的className，也移除它
            if (document.documentElement.getAttribute('class') === '') {
              document.documentElement.removeAttribute('class');
            }
            
            // 移除body标签上的inject_video_svd属性
            if (document.body.hasAttribute('inject_video_svd')) {
              document.body.removeAttribute('inject_video_svd');
            }
          }
        }

        // 立即执行一次
        fixHydrationIssues();

        // 确保在DOM内容加载后也执行一次，以防止脚本执行时DOM尚未完全加载
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', fixHydrationIssues);
        }
      })();
      `}
    </Script>
  );
}