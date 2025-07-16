import React, { useState } from "react";
import house1 from "../Images/house1.png";
import axiosInstance from "../utils/axiosInstance";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.post("/api/v1/contact", formData);
      setSuccess("Thank you for your interest! We will contact you soon.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        description: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full p-3 border rounded-md"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            className="w-full p-3 border rounded-md"
            required
          />
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full p-3 border rounded-md"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full p-3 border rounded-md"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "bg-blue-400" : "bg-blue-600"
            } text-white px-6 py-3 rounded-md w-full md:w-auto flex items-center justify-center`}
          >
            {loading ? "Sending..." : "Request Information"}
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
