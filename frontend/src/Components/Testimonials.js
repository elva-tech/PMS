import React from "react";

export default function TestimonialBaseSimpleElevated() {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      location: "Bangalore, Karnataka",
      text: "Found my dream home through this platform. The process was smooth and the agents were extremely helpful throughout.",
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      location: "Chennai, Tamil Nadu",
      text: "Exceptional service! The team went above and beyond to help me find the perfect property for my family.",
    },
    {
      id: 3,
      name: "Priya Patel",
      location: "Mumbai, Maharashtra",
      text: "Very professional and transparent process. Highly recommend their services to anyone looking for property.",
    },
    {
      id: 4,
      name: "Michael Roberts",
      location: "Hyderabad, Telangana",
      text: "The best real estate experience I've had. Their attention to detail and customer service is outstanding.",
    },
    {
      id: 5,
      name: "Anitha Reddy",
      location: "Mysore, Karnataka",
      text: "Quick response time and excellent property options. Made my house hunting journey much easier.",
    },
    {
      id: 6,
      name: "David Wilson",
      location: "Delhi, NCR",
      text: "Transparent pricing and professional approach. Would definitely use their services again.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="overflow-hidden bg-white rounded shadow-2xl text-slate-500"
        >
          <div className="relative p-6">
            <figure className="relative z-10">
              <blockquote className="p-6 text-lg leading-relaxed">
                <p>{testimonial.text}</p>
              </blockquote>
              <figcaption className="flex items-center gap-4 p-6 pt-2 text-sm text-black">
                <div className="flex flex-col gap-1">
                  <span className="font-bold uppercase">
                    {testimonial.name}
                  </span>
                  <cite className="not-italic">{testimonial.location}</cite>
                </div>
              </figcaption>
            </figure>
            <svg
              aria-hidden="true"
              className="absolute z-0 h-16 left-6 top-6"
              viewBox="0 0 17 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.79187 3.83333C2.66179 3.83333 2.53696 3.85316 2.41271 3.87125C2.45296 3.73591 2.49437 3.59825 2.56087 3.47458C2.62737 3.29491 2.73121 3.13916 2.83446 2.98225C2.92079 2.8125 3.07304 2.69758 3.18504 2.55233C3.30229 2.41116 3.46212 2.31725 3.58871 2.2C3.71296 2.0775 3.87571 2.01625 4.00521 1.92991C4.14054 1.85233 4.25837 1.76658 4.38437 1.72575L4.69879 1.59625L4.97529 1.48133L4.69237 0.35083L4.34412 0.43483C4.23271 0.46283 4.09679 0.495496 3.94221 0.53458C3.78412 0.563746 3.61554 0.643663 3.42771 0.71658C3.24221 0.799413 3.02754 0.855413 2.82804 0.988413C2.62737 1.11558 2.39579 1.22175 2.19162 1.39208C1.99387 1.56766 1.75529 1.71991 1.57912 1.94333C1.38662 2.15216 1.19646 2.3715 1.04887 2.62116C0.877957 2.85916 0.761873 3.1205 0.639373 3.37891C0.52854 3.63733 0.43929 3.90158 0.366373 4.15825C0.228123 4.67275 0.16629 5.16158 0.142373 5.57983C0.12254 5.99866 0.134207 6.34691 0.158707 6.59891C0.167457 6.71791 0.18379 6.83341 0.195457 6.91333L0.21004 7.01133L0.225207 7.00783C0.328959 7.49248 0.567801 7.93786 0.914102 8.29243C1.2604 8.64701 1.70001 8.89631 2.18208 9.01148C2.66415 9.12665 3.16897 9.10299 3.63815 8.94323C4.10733 8.78348 4.52169 8.49416 4.83331 8.10874C5.14493 7.72333 5.34107 7.25757 5.39903 6.76534C5.457 6.27311 5.37443 5.77452 5.16087 5.32726C4.94731 4.88 4.61149 4.50233 4.19225 4.23796C3.77302 3.97358 3.28751 3.8333 2.79187 3.83333V3.83333Z"
                className="fill-blue-400"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
