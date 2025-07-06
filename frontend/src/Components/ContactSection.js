import React, { useState } from "react";
import house1 from "../Images/house1.png";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-gray-100 p-10 flex flex-col md:flex-row items-center">
      <div className="md:w-1/2 p-6">
        <h3 className="text-xl md:text-3xl font-bold mb-4">
          Ready to buy a home with us?
        </h3>
        <p className="text-gray-600 mb-4">
          Schedule a consultation with our agent
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full p-3 border rounded-md"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            className="w-full p-3 border rounded-md"
          />
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full p-3 border rounded-md"
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full p-3 border rounded-md"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-md w-full md:w-auto"
          >
            Request Information
          </button>
        </form>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <img src={house1} alt="Contact Agent" className="w-full md:w-4/5" />
      </div>
    </div>
  );
};

export default ContactSection;
