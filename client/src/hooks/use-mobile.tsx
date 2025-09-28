import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Handler optimisé avec throttling pour éviter les re-rendus excessifs
    let timeoutId: NodeJS.Timeout;
    const onChange = React.useCallback(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
        setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
      }, 50); // 50ms de throttling
    }, []);
    
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    return () => {
      mql.removeEventListener("change", onChange);
      clearTimeout(timeoutId);
    };
  }, []);

  return !!isMobile;
}
