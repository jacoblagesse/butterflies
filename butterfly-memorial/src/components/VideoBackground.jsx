import React, { useEffect, useState } from "react";

// Lazy-loaded background loaders - only loads when requested
const BACKGROUND_LOADERS = {
  flowers: () => import("../assets/backgrounds/background__homepage.png"),
  mountain: () => import("../assets/backgrounds/background_mountain__HD.mp4"),
  tropical: () => import("../assets/backgrounds/background_tropical__HD.mp4"),
  lake: () => import("../assets/backgrounds/background_lake__HD.mp4"),
};

export default function VideoBackground({ backgroundKey, className = "", style = {} }) {
  const [currentKey, setCurrentKey] = useState(backgroundKey);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade out current background
    setIsVisible(false);

    // Wait for fade-out to complete, then load new background
    const fadeOutTimer = setTimeout(() => {
      const loader = BACKGROUND_LOADERS[backgroundKey] || BACKGROUND_LOADERS.flowers;

      loader()
        .then((module) => {
          setBackgroundUrl(module.default);
          setCurrentKey(backgroundKey);
          // Trigger fade-in after a brief delay to ensure content is loaded
          setTimeout(() => setIsVisible(true), 50);
        })
        .catch((err) => {
          console.error("Failed to load background:", err);
          // Fallback to flowers background
          BACKGROUND_LOADERS.flowers().then((module) => {
            setBackgroundUrl(module.default);
            setCurrentKey("flowers");
            setTimeout(() => setIsVisible(true), 50);
          });
        });
    }, 300); // Wait for fade-out animation

    return () => clearTimeout(fadeOutTimer);
  }, [backgroundKey]);

  const isVideo = currentKey !== "flowers" && backgroundUrl;
  const isPNG = currentKey === "flowers" && backgroundUrl;

  return (
    <>
      {/* Video background for mountain/tropical/lake */}
      {isVideo && (
        <video
          key={currentKey}
          autoPlay
          loop
          muted
          playsInline
          className={className}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: -1,
            opacity: isVisible ? 1 : 0,
            transition: "opacity 400ms ease-in-out",
            ...style,
          }}
        >
          <source src={backgroundUrl} type="video/mp4" />
        </video>
      )}

      {/* PNG background for flowers */}
      {isPNG && (
        <div
          key={currentKey}
          className={className}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: -1,
            opacity: isVisible ? 1 : 0,
            transition: "opacity 400ms ease-in-out",
            ...style,
          }}
        />
      )}
    </>
  );
}
