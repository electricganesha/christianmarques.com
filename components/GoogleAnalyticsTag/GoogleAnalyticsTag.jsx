import { useEffect } from "react";

const GoogleAnalyticsTag = () => {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  useEffect(() => {
    if (!gaId || typeof window === "undefined") return;

    const loadGA = () => {
      if (window._gaLoaded) return;
      window._gaLoaded = true;

      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag("js", new Date());
      gtag("config", gaId);

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
    };

    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(loadGA, { timeout: 3500 });
      return () => {
        if (window.cancelIdleCallback) window.cancelIdleCallback(handle);
      };
    } else {
      const timer = setTimeout(loadGA, 2000);
      return () => clearTimeout(timer);
    }
  }, [gaId]);

  return null;
};

export default GoogleAnalyticsTag;
