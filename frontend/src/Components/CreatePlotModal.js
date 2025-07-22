import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { HousePlus } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useProject } from "../Context/ProjectContext";
import { useParams } from "react-router-dom";
import { useCreatePlot, useUpdatePlot } from "../hooks/usePlotHooks";

const validationSchema = Yup.object({
  plotsize: Yup.string().required("Plot size is required"),
  plotprice: Yup.string().required("Plot price is required"),
  plotdirection: Yup.string().required("Plot direction is required"),
  status: Yup.string()
    .oneOf(["Available", "Sold", "Reserved"], "Invalid status")
    .required("Status is required"),
  plotno: Yup.string().required("Plot number is required"),
});

export default function CreatePlot({
  setAddProjectModal,
  editPlotData = null,
}) {
  const createPlotMutation = useCreatePlot();
  const updatePlotMutation = useUpdatePlot();
  const isEditMode = !!editPlotData;
  const { id } = useParams();
  const handleSubmit = async (values) => {
    if (isEditMode) {
      const payload = {
        projectId: editPlotData.projectId,
        plotId: editPlotData.plotId,
        plotData: {
          plotnumber: values.plotno,
          plotsize: values.plotsize,
          plotprice: values.plotprice,
          plotdirection: values.plotdirection,
          plotstatus: values.status,
        },
      };
      const response = await updatePlotMutation.mutateAsync(payload);
      return response.data;
    } else {
      const payload = {
        projectId: id,
        plotData: {
          plotnumber: values.plotno,
          plotsize: values.plotsize,
          plotprice: values.plotprice,
          plotdirection: values.plotdirection,
          plotstatus: values.status,
        },
      };
      const response = await createPlotMutation.mutateAsync(payload);
      return response.data;
    }
  };

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
            plotsize: editPlotData?.plotData?.plotsize || "",
            plotprice: editPlotData?.plotData?.plotprice || "",
            plotdirection: editPlotData?.plotData?.plotdirection || "",
            status: editPlotData?.plotData?.plotstatus || "",
            plotno: editPlotData?.plotData?.plotnumber || "",
          }}
          validationSchema={validationSchema}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              console.log("Submitting values:", values);
              const response = await handleSubmit(values);
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
                  Plot Direction
                </label>
                <Field
                  as="select"
                  name="plotdirection"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                >
                  <option value="">Select Direction</option>
                  <option value="NORTH">North</option>
                  <option value="SOUTH">South</option>
                  <option value="EAST">East</option>
                  <option value="WEST">West</option>
                  <option value="NORTH EAST">North East</option>
                  <option value="NORTH WEST">North West</option>
                  <option value="SOUTH EAST">South East</option>
                  <option value="SOUTH WEST">South West</option>
                </Field>
                <ErrorMessage
                  name="plotdirection"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
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
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                  <option value="Reserved">Reserved</option>
                </Field>
                <ErrorMessage
                  name="status"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div className="flex justify-end gap-2 flex-wrap mt-6">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md text-xs"
                  disabled={
                    createPlotMutation.isLoading || updatePlotMutation.isLoading
                  }
                >
                  {isEditMode
                    ? updatePlotMutation.isLoading
                      ? "Updating..."
                      : "Update"
                    : createPlotMutation.isLoading
                    ? "Creating..."
                    : "Create"}
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
