import React from "react";
import LoadingSpinner from "../Components/LoadingSpinner";
import sjdlogo1 from "../Images/sjd-logo1.png";
import { HousePlus, Edit } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useCreateProject, useUpdateProject } from "../hooks/useProjectHooks";
import { useProject } from "../hooks/useProjectHooks";
import { useToast } from "../Context/ToastContext";

export default function CreateProjectPage({ projectToEdit = null }) {
  const { addToast } = useToast();
  console.log("Project to edit:", projectToEdit);
  const navigate = useNavigate();
  const amenitiesList = [
    "Clubhouse",
    "Swimming Pool",
    "Gymnasium",
    "Children’s Play Area",
    "Jogging Track",
    "Landscaped Gardens",
    "24/7 Security",
    "Power Backup",
    "Indoor Games",
    "Multipurpose Hall",
    "Parking",
    "Visitor Parking",
    "Lift",
    "Fire Safety",
    "Basketball Court",
    "Tennis Court",
    "Amphitheater",
    "Mini-theater",
    "Wi-Fi",
    "Convenience Store",
    "ATM",
    "Pet Park",
    "Spa",
    "Library",
    "Co-working Space",
  ];
  const { id } = useParams();
  const { data: projectData } = useProject(id);

  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

    const matchWithTime = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4}),/);
    if (matchWithTime) {
      return `${matchWithTime[1]}/${matchWithTime[2]}/${matchWithTime[3]}`;
    }

    const match = dateStr.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (match) {
      return `${match[1]}/${match[2]}/${match[3]}`;
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return "";
  };

  const currentProject = React.useMemo(() => {
    if (projectToEdit) return projectToEdit;
    if (!id || !projectData) return null;
    const list = Array.isArray(projectData) ? projectData : projectData.project;
    return list;
  }, [id, projectToEdit, projectData]);

  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[0-2])[\/]\d{4}$/;

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
    contactNumber: Yup.string().required("Contact Number is required"),
    coordinates: Yup.object({
      latitude: Yup.number()
        .typeError("Latitude must be a number")
        .required("Latitude is required"),
      longitude: Yup.number()
        .typeError("Longitude must be a number")
        .required("Longitude is required"),
    }),
    startDate: Yup.string()
      .required("Start Date is required")
      .matches(dateRegex, "Start Date must be in dd/mm/yyyy format"),
    endDate: Yup.string()
      .required("End Date is required")
      .matches(dateRegex, "End Date must be in dd/mm/yyyy format"),
  });

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const isEditMode = !!currentProject;

  // Helper to convert dd/mm/yyyy to yyyy-mm-dd
  const ddmmyyyyToYyyymmdd = (dateStr) => {
    if (!dateStr) return "";
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return dateStr;
  };

  const handleSubmit = async (values) => {
    // Convert to yyyy-mm-dd for backend
    const formattedStartDate = ddmmyyyyToYyyymmdd(values.startDate);
    const formattedEndDate = ddmmyyyyToYyyymmdd(values.endDate);
    if (isEditMode) {
      const payload = {
        name: values.name,
        location: values.location,
        status: values.status,
        description: values.description,
        projectManager: values.projectManager,
        contactNumber: values.contactNumber,
        coordinates: {
          latitude: values.coordinates.latitude,
          longitude: values.coordinates.longitude,
        },
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        amenities: values.amenities,
      };
      const projectId = id;
      await updateProjectMutation.mutateAsync({
        id: projectId,
        data: payload,
      });
      addToast("success", "Project Updated", "Project updated successfully!");
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
      formData.append("startDate", formattedStartDate);
      formData.append("endDate", formattedEndDate);
      values.amenities.forEach((amenity) => {
        formData.append("amenities[]", amenity);
      });
      if (values.attachments && values.attachments.length > 0) {
        const imageFile = values.attachments[0];
        if (imageFile) {
          formData.append("image", imageFile);
        }
      }
      await createProjectMutation.mutateAsync(formData);
      addToast("success", "Project Created", "Project created successfully!");
    }
  };
  const loading =
    createProjectMutation.isPending || updateProjectMutation.isPending;
  return (
    <>
      <div className="pb-10">
        <nav className="bg-blue-700 border-b border-white shadow-md fixed top-0 left-0 w-full z-10">
          <div className="container mx-auto flex justify-between items-center p-4">
            <div className="flex items-center space-x-2">
              <img src={sjdlogo1} alt="SJD Logo" className="h-8" />
              <h1 className="text-lg font-bold text-white">Abhi Developers</h1>
            </div>
          </div>
        </nav>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-blue-700 to-white p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-b mt-10">
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
                    ? "Edit the project details below."
                    : "Create a new layout by filling out the form below."}
                </p>
              </div>
            </div>
            <Formik
              initialValues={{
                name: currentProject?.name || "",
                location: currentProject?.location || "",
                status: currentProject?.status || "",
                description: currentProject?.description || "",
                projectManager: currentProject?.projectManager || "",
                contactNumber: currentProject?.contactNumber || "",
                coordinates: {
                  latitude: currentProject?.coordinates?.latitude || "",
                  longitude: currentProject?.coordinates?.longitude || "",
                },
                startDate: formatDateToDDMMYYYY(currentProject?.startDate),
                endDate: formatDateToDDMMYYYY(currentProject?.endDate),
                attachments: [],
                amenities: currentProject?.amenities || [],
              }}
              validationSchema={validationSchema}
              validateOnChange={true}
              validateOnBlur={true}
              enableReinitialize={true}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                try {
                  const emptyFields = [];

                  Object.keys(values).forEach((key) => {
                    if (key === "coordinates") {
                      if (
                        !values.coordinates.latitude ||
                        !values.coordinates.longitude
                      ) {
                        emptyFields.push(key);
                      }
                    } else if (!values[key] && key !== "attachments") {
                      emptyFields.push(key);
                    }
                  });

                  if (emptyFields.length > 0) {
                    addToast(
                      "warning",
                      "Incomplete Form",
                      "Please fill in all required fields"
                    );
                    return;
                  }
                  await handleSubmit(values);
                  resetForm();
                  setTimeout(() => navigate("/project"), 1200);
                } catch (error) {
                  addToast(
                    "error",
                    isEditMode ? "Update Failed" : "Creation Failed",
                    error?.message || "Something went wrong."
                  );
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
              {({
                resetForm,
                isSubmitting,
                isValid,
                values,
                setFieldValue,
              }) => (
                <Form className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                  {/* Name */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold">Name</label>
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

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold">
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

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold">
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

                  {/* Project Manager */}
                  <div>
                    <label className="block text-sm font-semibold">
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

                  {/* Contact Number */}
                  <div>
                    <label className="block text-sm font-semibold">
                      Contact Number
                    </label>
                    <Field
                      type="text"
                      name="contactNumber"
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                      placeholder="Enter Contact Number"
                    />
                    <ErrorMessage
                      name="contactNumber"
                      component="div"
                      className="text-red-500 text-xs text-left"
                    />
                  </div>

                  {/* Latitude & Longitude */}
                  <div>
                    <label className="block text-sm font-semibold">
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
                  <div>
                    <label className="block text-sm font-semibold">
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

                  {/* Start & End Date */}
                  <div>
                    <label className="block text-sm font-semibold">
                      Start Date
                    </label>
                    <Field
                      type="text"
                      name="startDate"
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                      placeholder="dd/mm/yyyy"
                    />
                    <ErrorMessage
                      name="startDate"
                      component="div"
                      className="text-red-500 text-xs text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold">
                      End Date
                    </label>
                    <Field
                      type="text"
                      name="endDate"
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                      placeholder="dd/mm/yyyy"
                    />
                    <ErrorMessage
                      name="endDate"
                      component="div"
                      className="text-red-500 text-xs text-left"
                    />
                  </div>

                  {/* Attachments */}
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
                      Broucher (png, jpg, jpeg, pdf)
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

                  {/* Description */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold">
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
                  {/* Amenities Selection */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Select Amenities
                    </label>

                    {/* Custom Multi-select Dropdown */}
                    <div className="border rounded-lg p-2 w-full max-h-48 overflow-y-auto">
                      {amenitiesList.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const alreadySelected =
                              values.amenities.includes(item);
                            if (alreadySelected) {
                              setFieldValue(
                                "amenities",
                                values.amenities.filter((a) => a !== item)
                              );
                            } else {
                              setFieldValue("amenities", [
                                ...values.amenities,
                                item,
                              ]);
                            }
                          }}
                          className={`cursor-pointer px-3 py-2 rounded-md mb-1 ${
                            values.amenities.includes(item)
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-black hover:bg-gray-200"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    {/* Selected Amenities as Chips */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {values.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="flex items-center bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() =>
                              setFieldValue(
                                "amenities",
                                values.amenities.filter((a) => a !== amenity)
                              )
                            }
                            className="ml-2 text-gray-500 hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-4">
                    <button
                      type="button"
                      className="w-full sm:w-auto px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                      onClick={() => {
                        resetForm();
                        navigate("/project");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="w-full sm:w-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      disabled={
                        createProjectMutation.isPending ||
                        updateProjectMutation.isPending
                      }
                      onClick={() => {
                        const emptyFields = [];

                        Object.keys(values).forEach((key) => {
                          if (key === "coordinates") {
                            if (
                              !values.coordinates.latitude ||
                              !values.coordinates.longitude
                            ) {
                              emptyFields.push(key);
                            }
                          } else if (!values[key] && key !== "attachments") {
                            emptyFields.push(key);
                          }
                        });

                        if (emptyFields.length > 0) {
                          addToast(
                            "warning",
                            "Incomplete Form",
                            "Please fill in all required fields"
                          );
                          return;
                        }
                        document.querySelector("form").requestSubmit();
                      }}
                    >
                      {isEditMode
                        ? updateProjectMutation.isPending
                          ? "Updating..."
                          : "Update"
                        : createProjectMutation.isPending
                        ? "Creating..."
                        : "Create"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>
    </>
  );
}
