import React, { useState } from "react";
import { X } from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useCreateUser, useUpdateUser } from "../hooks/useUserHooks";

export default function AddUserModal({
  isOpen,
  onClose,
  onSave,
  userToEdit = null,
}) {
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const isEditMode = !!userToEdit;

  const initialValues = {
    name: userToEdit?.username || "",
    email: userToEdit?.useremail || "",
    password: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object({
    name: Yup.string().min(6).max(15).required("Name is required"),
    email: Yup.string()
      .required("Email is required")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email format"
      ),
    password: isEditMode
      ? Yup.string()
          .min(8, "Password must be at least 8 characters long")
          .matches(
            /[a-z]/,
            "Password must contain at least one lowercase letter"
          )
          .matches(
            /[A-Z]/,
            "Password must contain at least one uppercase letter"
          )
          .matches(/\d/, "Password must contain at least one number")
          .matches(
            /[@$!%*?&]/,
            "Password must contain at least one special character (@, $, !, %, *, ?, &)"
          )
      : Yup.string()
          .required("Password is required")
          .min(8, "Password must be at least 8 characters long")
          .matches(
            /[a-z]/,
            "Password must contain at least one lowercase letter"
          )
          .matches(
            /[A-Z]/,
            "Password must contain at least one uppercase letter"
          )
          .matches(/\d/, "Password must contain at least one number")
          .matches(
            /[@$!%*?&]/,
            "Password must contain at least one special character (@, $, !, %, *, ?, &)"
          ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .when("password", {
        is: (val) => val && val.length > 0,
        then: (schema) => schema.required("Confirm Password is required"),
        otherwise: (schema) => schema,
      }),
  });

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const userData = {
        username: values.name,
        useremail: values.email,
      };

      if (isEditMode) {
        if (values.password && values.password.trim()) {
          userData.userpassword = values.password;
        }
      } else {
        userData.userpassword = values.password;
      }

      if (isEditMode) {
        await updateUserMutation.mutateAsync({
          id: userToEdit.userid,
          userData,
        });
      } else {
        await createUserMutation.mutateAsync(userData);
      }

      resetForm();
      onClose();
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h2 className="text-lg font-semibold">
            {isEditMode ? "Edit User" : "Add New User"}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-xl"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          validateOnChange={true}
          validateOnBlur={true}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ resetForm, values, errors, isSubmitting }) => (
            <Form className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  User Name
                </label>
                <Field
                  type="text"
                  name="name"
                  placeholder="Enter user name"
                  // onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  User Email ID
                </label>
                <Field
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  // onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password{" "}
                  {isEditMode && "(Leave blank to keep current password)"}
                </label>
                <Field
                  type="password"
                  name="password"
                  placeholder={
                    isEditMode
                      ? "Enter new password (optional)"
                      : "Enter password"
                  }
                  // onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {(!isEditMode || values.password) && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confirm Password
                  </label>
                  <Field
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    // onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    createUserMutation.isPending ||
                    updateUserMutation.isPending
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ||
                  createUserMutation.isPending ||
                  updateUserMutation.isPending
                    ? isEditMode
                      ? "Updating..."
                      : "Adding..."
                    : isEditMode
                    ? "Update User"
                    : "Add User"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={
                    isSubmitting ||
                    createUserMutation.isPending ||
                    updateUserMutation.isPending
                  }
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
