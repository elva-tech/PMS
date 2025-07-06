import React, { useRef } from "react";
import CountUp from "react-countup";
import useScrollTrigger from "../hooks/useScrollTrigger";
import {
  FaHouseDamage,
  FaMapMarkedAlt,
  FaUsers,
  FaRegClock,
  FaHome,
  FaUserTie,
} from "react-icons/fa";
import { LuHousePlus } from "react-icons/lu";
const StatsSection = () => {
  const statsRef = useRef(null);
  const isVisible = useScrollTrigger(statsRef);

  const stats = [
    { title: "Homes Sold:", end: 2025, duration: 2, icon: <FaHome /> },
    {
      title: "States:",
      end: 21,
      duration: 5,
      suffix: "+",
      icon: <FaMapMarkedAlt />,
    },
    {
      title: "Happy Families:",
      end: 3000,
      duration: 2,
      suffix: "+",
      icon: <FaUsers />,
    },
    { title: "Years Experience:", end: 15, duration: 2, icon: <FaRegClock /> },
    { title: "Homes to Buy:", end: 896, duration: 2, icon: <LuHousePlus /> },
    {
      title: "Agents:",
      end: 56,
      duration: 5,
      suffix: "+",
      icon: <FaUserTie />,
    },
  ];

  return (
    <div className="bg-white">
      <div className="border-t border-gray-300"></div>
      <div
        ref={statsRef}
        className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center py-8"
      >
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className={`transition-all duration-1000 flex flex-col items-center justify-center ${
              index > 0 ? `delay-${index * 200}` : ""
            }`}
          >
            <div className="text-4xl text-blue-600  flex items-center justify-center h-16">
              {stat.icon}
            </div>
            <h2 className="text-xl font-semibold mb-2">{stat.title}</h2>
            <p className="text-4xl font-bold">
              {isVisible && (
                <CountUp
                  key={isVisible}
                  end={stat.end}
                  duration={stat.duration}
                  suffix={stat.suffix || ""}
                />
              )}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-300"></div>
    </div>
  );
};

export default StatsSection;
