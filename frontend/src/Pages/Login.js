import React, { useState, useRef, useEffect } from "react";
import sjdlogo1 from "../Images/sjd-logo1.png";
import { User, Lock, Eye, EyeOff, X } from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
const Login = ({ isLoginOpen, setIsLoginOpen }) => {
  const { login, user, error, loading } = useAuth();
  const navigate = useNavigate();
  const [showpassword, setShowPassword] = useState(false);
  const [inactiveModal, setInactiveModal] = useState({
    open: false,
    message: "",
  });
  const modalRef = useRef();

  const togglePassword = () => setShowPassword(!showpassword);

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setIsLoginOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validationSchema = yup.object().shape({
    email: yup.string().required("Username is required"),
    password: yup.string().required("Password is required"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center p-4">
      {inactiveModal.open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inactive-account-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 p-1"
              onClick={() => setInactiveModal({ open: false, message: "" })}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3
              id="inactive-account-title"
              className="text-lg font-semibold text-gray-900 pr-8"
            >
              Account inactive
            </h3>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              {inactiveModal.message}
            </p>
            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-blue-600 text-white py-2.5 text-sm font-medium hover:bg-blue-700"
              onClick={() => setInactiveModal({ open: false, message: "" })}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div
        ref={modalRef}
        className="relative flex flex-col items-center justify-center w-full max-w-md bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/50"
      >
        <div className="flex items-center space-x-2">
          <img src={sjdlogo1} alt="SJD Logo" className="h-8" />
          <h1 className="text-lg font-bold text-white">Abhi Developers</h1>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-4">Login</h2>
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const loginResult = await login(values.email, values.password);
              if (!loginResult.ok && loginResult.code === "ACCOUNT_INACTIVE") {
                setInactiveModal({
                  open: true,
                  message:
                    loginResult.message ||
                    "Your account is inactive. Please contact the administrator.",
                });
              }
              if (loginResult.ok) {
                let stored = null;
                try {
                  stored = JSON.parse(localStorage.getItem("user") || "null");
                } catch {
                  stored = null;
                }
                if (
                  stored?.user?.role === "user" &&
                  stored?.user?.type === "user"
                ) {
                  try {
                    const res = await axiosInstance.get("/api/v1/projects");
                    const projects = res?.data?.data?.projects || [];
                    const firstId = projects[0]?._id;
                    if (firstId) {
                      navigate(`/project/${firstId}/documents`);
                      return;
                    }
                  } catch (err) {
                    console.error(err);
                  }
                  navigate("/project");
                  return;
                }
                navigate("/project");
              }
            } catch (err) {
              console.error("Login error:", err);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({
            errors,
            values,
            isValid,
            setFieldTouched,
            setFieldValue,
            isSubmitting,
            setSubmitting,
          }) => (
            <Form className="w-full mt-6">
              <div className="relative mb-6 w-full border-b-2 border-white">
                <span className="absolute top-2 left-3 text-gray-700">
                  <User size={20} />
                </span>
                <Field
                  type="text"
                  name="email"
                  className="w-full pl-10 bg-white bg-opacity-10 text-gray-800 placeholder-white py-2 px-3 rounded mb-2 focus:outline-none focus:ring-2 focus:to-blue-700"
                  placeholder="Username"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-black text-xs"
                />
              </div>

              <div className="relative mb-6 w-full border-b-2 border-white">
                <span className="absolute top-2 left-3 text-gray-700">
                  <Lock size={20} />
                </span>
                <Field
                  name="password"
                  type={showpassword ? "text" : "password"}
                  className="w-full pl-10 bg-white bg-opacity-10 text-gray-800 placeholder-white py-2 px-3 rounded mb-2 focus:outline-none focus:ring-2 focus:to-blue-700"
                  placeholder="Password"
                  onBlur={(e) => {
                    setFieldTouched("password", true);
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    togglePassword();
                  }}
                  className="absolute top-2 right-3 text-gray-700 cursor-pointer"
                >
                  {showpassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-black text-xs"
                />
              </div>

              <button
                className="w-full rounded-full bg-white py-2 font-semibold text-gray-800 transition hover:bg-gray-300"
                type="submit"
                disabled={!isValid || isSubmitting || loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;
