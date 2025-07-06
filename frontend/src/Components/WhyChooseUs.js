import {
  FaRegCalendarCheck,
  FaDoorClosed,
  FaBuilding,
  FaTools,
  FaHome,
  FaComments,
} from "react-icons/fa";

const features = [
  {
    icon: <FaRegCalendarCheck className="text-blue-500 text-3xl" />,
    title: "Building Planning",
    description:
      "Building planning is the method of setting or arranging various components or units of a building in a systematic manner to form a meaningful...",
  },
  {
    icon: <FaDoorClosed className="text-blue-500 text-3xl" />,
    title: "Interior Space",
    description:
      "An enclosed portion of a public and commercial building including exterior hallway, connecting structure, portico, or mechanical system used...",
  },
  {
    icon: <FaBuilding className="text-blue-500 text-3xl" />,
    title: "Small Offices",
    description:
      "A small business that is often run out of small office spaces, homes, or even virtually.",
  },
  {
    icon: <FaTools className="text-blue-500 text-3xl" />,
    title: "Renovating Space",
    description:
      "The key to renovating your house on budget yet beautifully is primarily to the space you have and renovate your home effectively.",
  },
  {
    icon: <FaHome className="text-blue-500 text-3xl" />,
    title: "Real Estates",
    description:
      "Real estate is the land along with any permanent improvements attached to the land, whether natural or manmade.",
  },
  {
    icon: <FaComments className="text-blue-500 text-3xl" />,
    title: "Free Consultation",
    description:
      "Book free consultation before choosing a flat. Choosing the right flat for yourself is equally important when we have different choices.",
  },
];

export default function WhyChooseUs() {
  return (
    <>
      <section className="py-12 bg-white text-center">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide">
            Every Space Count
          </h2>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-8">
            Why Choose Us
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="p-4 flex flex-col items-center">
                <div>{feature.icon}</div>
                <h3 className="text-2xl font-semibold mt-4">{feature.title}</h3>
                <p className="text-xl text-gray-600 mt-2">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
