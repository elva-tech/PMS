import React, { useState } from "react";
import sjdlogo1 from "../Images/sjd-logo1.png";
import { User, Lock, Eye, EyeOff, X } from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
const Login = ({ isLoginOpen, setIsLoginOpen }) => {
  const { login, user, error, loading } = useAuth();
  const navigate = useNavigate();
  const [showpassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword(!showpassword);

  const validationSchema = yup.object().shape({
    email: yup.string().required("Username is required"),
    password: yup.string().required("Password is required"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center p-4">
      <div className="relative flex flex-col items-center justify-center w-full max-w-md bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/50">
        <div className="flex items-center space-x-2">
          <button
            className="absolute top-2 right-2 text-gray-600"
            onClick={() => setIsLoginOpen(false)}
          >
            <X size={28} />
          </button>
          <img src={sjdlogo1} alt="SJD Logo" className="h-8" />
          <h1 className="text-lg font-bold text-white">Abhi Developers</h1>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-4">Login</h2>
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            await login(values.email, values.password);
            setSubmitting(false);
            if (localStorage.getItem("user")) {
              // navigate("/main");
              navigate("/project");
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
