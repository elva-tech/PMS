import { useState, useEffect } from "react";

const useScrollTrigger = (ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
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
      },
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref]);

  return isVisible;
};

export default useScrollTrigger;
