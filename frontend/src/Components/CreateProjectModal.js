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
  description: Yup.string().required("Description is required"),
});

export default function CreateProject({
  setAddProjectModal,
  projectToEdit = null,
}) {
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const isEditMode = !!projectToEdit;

  const handleSubmit = async (values) => {
    if (isEditMode) {
      const payload = {
        name: values.name,
        location: values.location,
        status: values.status,
        description: values.description,
      };

      const projectId = projectToEdit._id || projectToEdit.id;

      return await updateProjectMutation.mutateAsync({
        id: projectId,
        data: payload,
      });
    } else {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("location", values.location);
      formData.append("status", values.status);
      formData.append("description", values.description);

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
            attachments: [],
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
                  Attachments (png, jpg, jpeg)
                </label>
                <Field name="attachments">
                  {({ field, form }) => (
                    <input
                      type="file"
                      accept="image/png, image/jpg, image/jpeg"
                      multiple={false}
                      onChange={(event) => {
                        const files = event.currentTarget.files;
                        const validFiles = [];
                        let error = "";

                        if (files && files.length > 0) {
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            if (
                              file.type === "image/png" ||
                              file.type === "image/jpg" ||
                              file.type === "image/jpeg"
                            ) {
                              validFiles.push(file);
                            } else {
                              error = `"${file.name}" is not a supported image file. Only .png, .jpg, .jpeg allowed.`;
                            }
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
