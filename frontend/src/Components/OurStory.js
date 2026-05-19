import React from "react";
import { FaAward } from "react-icons/fa";
import ourteam from "../Images/ourteam1.jpg";
const OurStory = () => {
  return (
    <>
      <div className="max-w-3xl mx-auto text-center px-4 pb-12 pt-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Building Dreams, Creating Homes
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          For over two decades, we've been more than just real estate
          agents—we've been your neighbors, your advocates, and your partners in
          finding the perfect place to call home.
        </p>
      </div>
      <section className="px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              From Humble Beginnings to Market Leaders
            </h2>
            <p className="text-gray-600 mb-4">
              Founded in 2001 by Abhishek, our agency started with a simple
              mission: to make the home buying and selling process as seamless
              and stress-free as possible. What began as a small family business
              has grown into one of the region's most trusted real estate firms.
            </p>
            <p className="text-gray-600 mb-6">
              We believe that every client deserves personalized attention,
              expert guidance, and unwavering support throughout their real
              estate journey. Our deep local knowledge, combined with
              cutting-edge technology and marketing strategies, ensures that our
              clients always have the competitive edge.
            </p>
          </div>

          {/* Image + Award Badge */}
          <div className="flex-1 relative">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img
                src={ourteam}
                alt="Our Team"
                className="w-full object-cover h-80 sm:h-96"
              />
            </div>
            <div className="absolute bottom-[-1.5rem] left-4 bg-white shadow-md rounded-lg p-4 flex items-center gap-3 w-fit">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-full text-lg">
                <FaAward />
              </div>
              <div>
                <p className="text-sm font-semibold">Award Winning</p>
                <p className="text-xs text-gray-500">Top Agency 2023</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default OurStory;
