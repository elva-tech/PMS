import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import house1 from "../Images/house1.png";
import axiosInstance from "../utils/axiosInstance";

const ContactSection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Yup validation schema
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validationSchema = Yup.object({
    fullName: Yup.string()
      .trim()
      .min(5, "Full Name must be at least 5 characters")
      .max(25, "Full Name must be at most 25 characters")
      .required("Full Name is required"),
    email: Yup.string()
      .trim()
      .matches(emailRegex, "Invalid email address format")
      .required("Email is required"),
    phone: Yup.string()
      .trim()
      .matches(/^[0-9]{1,10}$/, "Phone number must be 1-10 digits")
      .required("Phone number is required"),
    description: Yup.string()
      .trim()
      .min(5, "Description must be at least 5 characters")
      .max(100, "Description must be at most 100 characters")
      .required("Description is required"),
    interested: Yup.number().oneOf([1], "Invalid interest value"),
  });

  const initialValues = {
    fullName: "",
    email: "",
    phone: "",
    description: "",
    interested: 1,
  };

  const handleSubmit = async (values, { resetForm }) => {
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      description: values.description.trim(),
      interested: 1,
    };
    try {
      await axiosInstance.post("/api/v1/contact", payload);
      setSuccess("Thank you for your interest! We will contact you soon.");
      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, isValid }) => (
            <Form className="space-y-4">
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
              <div>
                <Field
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  className="w-full p-3 border rounded-md"
                />
                <ErrorMessage
                  name="fullName"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <Field
                  type="email"
                  name="email"
                  placeholder="Email address"
                  className="w-full p-3 border rounded-md"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <Field
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  className="w-full p-3 border rounded-md"
                />
                <ErrorMessage
                  name="phone"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <Field
                  as="textarea"
                  name="description"
                  placeholder="Description"
                  className="w-full p-3 border rounded-md"
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <Field type="hidden" name="interested" value={1} />
              <button
                type="submit"
                disabled={loading || isSubmitting || !isValid}
                className={`${
                  loading || isSubmitting || !isValid
                    ? "bg-gray-400"
                    : "bg-blue-600"
                } text-white px-6 py-3 rounded-md w-full md:w-auto flex items-center justify-center`}
              >
                {loading || isSubmitting ? "Sending..." : "Request Information"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <img src={house1} alt="Contact Agent" className="w-full md:w-4/5" />
      </div>
    </div>
  );
};

export default ContactSection;
