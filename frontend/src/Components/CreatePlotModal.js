import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { HousePlus } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useProject } from "../Context/ProjectContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

const validationSchema = Yup.object({
  name: Yup.string().required("Project name is required"),
  plotsize: Yup.string().required("Plot size is required"),
  plotprice: Yup.string().required("Plot price is required"),
  status: Yup.string().required("Status is required"),
  plotno: Yup.string().required("Plot number is required"),
  status: Yup.string()
    .oneOf(["AVAILABLE", "NOT_AVAILABLE"], "Invalid status")
    .required("Status is required"),
});

export const useCreatePlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPlot) =>
      axiosInstance.post("/plat/management/plot", newPlot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plots"] });
    },
  });
};
export default function CreatePlot({ setAddProjectModal }) {
  const { user } = useAuth();
  const { mutateAsync, isPending, error } = useCreatePlot();

  const createPlot = async (values) => {
    const payload = {
      landProjectId: values.name,
      plotNumber: values.plotno,
      size: values.plotsize,
      price: values.plotprice,
      status: values.status,
    };
    const response = await mutateAsync(payload);

    return response.data;
  };
  const { projectId, setProjectId, plotId, setPlotId } = useProject();

  return (
    <div className="fixed flex inset-0 items-center justify-center min-h-screen bg-black bg-opacity-50  p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <HousePlus className=" text-black text-2xl mr-3" size={30} />
          <div>
            <h2 className="text-xl font-semibold text-left">Create Plot</h2>
            <p className="text-gray-500">
              Create a new plot by filling out the form below.
            </p>
          </div>
        </div>

        <Formik
          initialValues={{
            name: "",
            plotsize: "",
            plotprice: "",
            status: "",
            plotno: "",
          }}
          validationSchema={validationSchema}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              const response = await createPlot(values);
              console.log("Project created successfully:", response);
              resetForm();
              setAddProjectModal(false);
            } catch (error) {
              console.error("Error creating project:", error);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ resetForm }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Project ID
                </label>
                <Field
                  type="text"
                  name="name"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  placeholder="Enter Project Name"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Plot Number
                </label>
                <Field
                  type="text"
                  name="plotno"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  placeholder="Enter Plot Number"
                />
                <ErrorMessage
                  name="plotno"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 text-left text-xs">
                    Plot Size
                  </label>
                  <Field
                    type="text"
                    name="plotsize"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                    placeholder="Enter Plot Size"
                  />
                  <ErrorMessage
                    name="plotsize"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>

                <div className="w-1/2">
                  <label className="block text-gray-700 text-left text-xs">
                    Plot Price
                  </label>
                  <Field
                    type="text"
                    name="plotprice"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                    placeholder="Enter Plot Price"
                  />
                  <ErrorMessage
                    name="plotprice"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Status
                </label>
                <Field
                  as="select"
                  name="status"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                >
                  <option value="">Select Status</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="NOT_AVAILABLE">Not Available</option>
                </Field>
                <ErrorMessage
                  name="status"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Attachments (png, jpg, jpeg)
                </label>
                <Field name="attachments">
                  {({ field, form }) => (
                    <input
                      type="file"
                      accept="image/png, image/jpg, image/jpeg"
                      multiple
                      onChange={(event) => {
                        const files = event.currentTarget.files;
                        const validFiles = [];
                        let error = "";
                        for (let i = 0; i < files.length; i++) {
                          const file = files[i];

                          if (
                            file.type === "image/png" ||
                            file.type === "image/jpg" ||
                            file.type === "image/jpeg"
                          ) {
                            validFiles.push(file);
                          } else {
                            // form.setFieldError(
                            //   "attachments",
                            //   `${file.name} is not a valid file type`
                            // );
                            error = `"${files.name}" is not a supported image file. Only .png, .jpg, .jpeg allowed.`;
                          }
                        }
                        // form.setFieldValue("attachments", validFiles);
                        if (error) {
                          form.setFieldError("attachments", error);
                        } else {
                          form.setFieldValue("attachments", validFiles);
                          form.setFieldError("attachments", "");
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs file:text-xs file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="attachments"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div className="flex justify-end gap-2 flex-wrap mt-6">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md text-xs"
                >
                  Create
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-xs"
                  onClick={() => {
                    resetForm();
                    setAddProjectModal(false);
                  }}
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
