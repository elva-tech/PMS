import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { HousePlus, Edit } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { useCreateProject, useUpdateProject } from "../hooks/useProjectHooks";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  location: Yup.string().required("Location is required"),
  status: Yup.string()
    .oneOf(["Not Started", "In Progress", "Completed"], "Invalid status")
    .required("Status is required"),
  description: Yup.string()
    .required("Description is required")
    .max(200, "Description cannot exceed 200 characters"),
  projectManager: Yup.string().required("Project Manager is required"),
  contactNumber: Yup.string()
    .required("Contact Number is required")
    .transform((v) => (v == null ? "" : String(v).replace(/\D/g, "")))
    .length(10, "Enter exactly 10 digits (Indian mobile)")
    .matches(/^[6-9]\d{9}$/, "Use a valid 10-digit mobile starting with 6–9"),
  coordinates: Yup.object({
    latitude: Yup.number()
      .typeError("Latitude must be a number")
      .required("Latitude is required"),
    longitude: Yup.number()
      .typeError("Longitude must be a number")
      .required("Longitude is required"),
  }),
  startDate: Yup.string().required("Start Date is required"),
  endDate: Yup.string().required("End Date is required"),
});

export default function CreateProject({
  setAddProjectModal,
  projectToEdit = null,
}) {
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const isEditMode = !!projectToEdit;
  console.log("Project to edit:", projectToEdit);
  const handleSubmit = async (values) => {
    if (isEditMode) {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("location", values.location);
      formData.append("status", values.status);
      formData.append("description", values.description);
      formData.append("projectManager", values.projectManager);
      formData.append(
        "contactNumber",
        String(values.contactNumber).replace(/\D/g, "")
      );
      formData.append(
        "coordinates",
        JSON.stringify({
          latitude: values.coordinates.latitude,
          longitude: values.coordinates.longitude,
        })
      );
      formData.append("startDate", values.startDate);
      formData.append("endDate", values.endDate);
      if (values.brochureFiles?.length > 0) {
        const b = values.brochureFiles[0];
        if (b) formData.append("brochure", b);
      }
      if (values.attachments?.length > 0) {
        const imageFile = values.attachments[0];
        if (imageFile) formData.append("image", imageFile);
      }

      const projectId = projectToEdit._id || projectToEdit.id;

      return await updateProjectMutation.mutateAsync({
        id: projectId,
        data: formData,
      });
    } else {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("location", values.location);
      formData.append("status", values.status);
      formData.append("description", values.description);
      formData.append("projectManager", values.projectManager);
      formData.append("contactNumber", values.contactNumber);
      formData.append(
        "coordinates",
        JSON.stringify({
          latitude: values.coordinates.latitude,
          longitude: values.coordinates.longitude,
        })
      );
      formData.append("startDate", values.startDate);
      formData.append("endDate", values.endDate);

      if (values.brochureFiles && values.brochureFiles.length > 0) {
        const b = values.brochureFiles[0];
        if (b) formData.append("brochure", b);
      }
      if (values.attachments && values.attachments.length > 0) {
        const imageFile = values.attachments[0];
        if (imageFile) {
          formData.append("image", imageFile);
        }
      }
      return await createProjectMutation.mutateAsync(formData);
    }
  };

  return (
    <div className="fixed flex inset-0 items-center justify-center min-h-screen bg-black bg-opacity-50 p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center mb-4">
          {isEditMode ? (
            <Edit className="text-black text-2xl mr-3" size={30} />
          ) : (
            <HousePlus className="text-black text-2xl mr-3" size={30} />
          )}
          <div>
            <h2 className="text-xl font-semibold text-left">
              {isEditMode ? "Edit Project" : "Create Project"}
            </h2>
            <p className="text-gray-500">
              {isEditMode
                ? "Update project details by editing the form below."
                : "Create a new layout by filling out the form below."}
            </p>
          </div>
        </div>

        <Formik
          initialValues={{
            name: projectToEdit?.name || "",
            location: projectToEdit?.location || "",
            status: projectToEdit?.status || "",
            description: projectToEdit?.description || "",
            projectManager: projectToEdit?.projectManager || "",
            contactNumber:
              projectToEdit?.contactNumber != null
                ? String(projectToEdit.contactNumber)
                : "",
            coordinates: {
              latitude: projectToEdit?.coordinates?.latitude || "",
              longitude: projectToEdit?.coordinates?.longitude || "",
            },
            startDate: projectToEdit?.startDate || "",
            endDate: projectToEdit?.endDate || "",
            attachments: [],
            brochureFiles: [],
          }}
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              const response = await handleSubmit(values);
              resetForm();
              setAddProjectModal(false);
            } catch (error) {
              console.error(
                isEditMode
                  ? "Error updating project:"
                  : "Error creating project:",
                error
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ resetForm }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Name
                </label>
                <Field
                  type="text"
                  name="name"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  placeholder="Enter name"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 text-left text-xs">
                    Location
                  </label>
                  <Field
                    type="text"
                    name="location"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                    placeholder="Enter Location"
                  />
                  <ErrorMessage
                    name="location"
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
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </Field>
                  <ErrorMessage
                    name="status"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-left text-xs">
                  1. Logo / brochure (png, jpg, jpeg, pdf)
                </label>
                <p className="text-[10px] text-gray-500 text-left mb-0.5">
                  Saved on the project (header card).
                </p>
                <Field name="brochureFiles">
                  {({ form }) => (
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={(event) => {
                        const files = event.currentTarget.files;
                        if (!files?.length) {
                          form.setFieldValue("brochureFiles", []);
                          form.setFieldError("brochureFiles", "");
                          return;
                        }
                        const file = files[0];
                        const ok =
                          file.type === "image/png" ||
                          file.type === "image/jpeg" ||
                          file.type === "image/jpg" ||
                          file.type === "application/pdf";
                        if (!ok) {
                          form.setFieldError(
                            "brochureFiles",
                            "Use png, jpg, jpeg, or pdf."
                          );
                          return;
                        }
                        form.setFieldValue("brochureFiles", [file]);
                        form.setFieldError("brochureFiles", "");
                      }}
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs file:text-xs file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="brochureFiles"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-left text-xs">
                  2. Layout site map image (png, jpg, jpeg)
                </label>
                <p className="text-[10px] text-gray-500 text-left mb-0.5">
                  Site map under the title on the plots page.
                </p>
                <Field name="attachments">
                  {({ form }) => (
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(event) => {
                        const files = event.currentTarget.files;
                        const validFiles = [];
                        let error = "";

                        if (files && files.length > 0) {
                          const file = files[0];
                          if (
                            file.type === "image/png" ||
                            file.type === "image/jpeg" ||
                            file.type === "image/jpg"
                          ) {
                            validFiles.push(file);
                          } else {
                            error =
                              "Use png, jpg, or jpeg for the layout image.";
                          }
                        }

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

              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Project Manager
                </label>
                <Field
                  type="text"
                  name="projectManager"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  placeholder="Enter Project Manager Name"
                />
                <ErrorMessage
                  name="projectManager"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Contact Number
                </label>
                <Field
                  type="text"
                  name="contactNumber"
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  placeholder="10-digit mobile (starts with 6–9)"
                />
                <ErrorMessage
                  name="contactNumber"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 text-left text-xs">
                    Latitude
                  </label>
                  <Field
                    type="text"
                    name="coordinates.latitude"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                    placeholder="Latitude"
                  />
                  <ErrorMessage
                    name="coordinates.latitude"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700 text-left text-xs">
                    Longitude
                  </label>
                  <Field
                    type="text"
                    name="coordinates.longitude"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                    placeholder="Longitude"
                  />
                  <ErrorMessage
                    name="coordinates.longitude"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 text-left text-xs">
                    Start Date
                  </label>
                  <Field
                    type="date"
                    name="startDate"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  />
                  <ErrorMessage
                    name="startDate"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700 text-left text-xs">
                    End Date
                  </label>
                  <Field
                    type="date"
                    name="endDate"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  />
                  <ErrorMessage
                    name="endDate"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Description
                </label>
                <Field
                  as="textarea"
                  name="description"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  placeholder="Describe your project here!"
                  rows="4"
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 text-xs text-left"
                />
              </div>

              <div className="flex justify-end gap-2 flex-wrap mt-6">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md text-xs"
                  disabled={
                    createProjectMutation.isPending ||
                    updateProjectMutation.isPending
                  }
                >
                  {isEditMode
                    ? updateProjectMutation.isPending
                      ? "Updating..."
                      : "Update"
                    : createProjectMutation.isPending
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
