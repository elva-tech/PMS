import { useState, useEffect } from "react";

const useScrollTrigger = (ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      //   ([entry]) => {
      //     if (entry.isIntersecting) {
      //       setIsVisible(true);
      //       observer.unobserve(entry.target);
      //     }
      //   },
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref]);

  return isVisible;
};

export default useScrollTrigger;
