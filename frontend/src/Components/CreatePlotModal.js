import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { HousePlus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCreatePlot, useUpdatePlot, usePlotPriceEstimate } from "../hooks/usePlotHooks";
import { useToast } from "../Context/ToastContext";
import { PLOT_TYPES, APPROVAL_STATUSES } from "../constants/plotFeatures";

const parseInr = (value) => {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};

const formatInr = (value) => {
  const n = parseInr(value);
  if (!n) return "";
  return n.toLocaleString("en-IN");
};

const validationSchema = Yup.object({
  plotsize: Yup.number()
    .typeError("Plot size must be a number")
    .positive("Plot size must be greater than 0")
    .required("Plot size is required"),
  plotprice: Yup.string()
    .required("Plot price is required")
    .test("positive", "Plot price must be greater than 0", (v) => parseInr(v) > 0),
  plotdirection: Yup.string().required("Plot direction is required"),
  plotType: Yup.string()
    .oneOf(PLOT_TYPES.map((t) => t.value), "Select a plot type")
    .required("Plot type is required"),
  roadWidthFt: Yup.number()
    .typeError("Road width must be a number")
    .min(1, "Road width must be at least 1 ft")
    .max(200, "Road width seems too large")
    .required("Road width is required"),
  approvalStatus: Yup.string()
    .oneOf(APPROVAL_STATUSES.map((a) => a.value), "Select approval status")
    .required("Approval status is required"),
  status: Yup.string()
    .oneOf(["Available", "Sold", "Reserved"], "Invalid status")
    .required("Status is required"),
  plotno: Yup.number()
    .typeError("Plot number must be a number")
    .required("Plot number is required"),
});

const buildPlotPayload = (values) => ({
  plotnumber: Number(values.plotno),
  plotsize: Number(values.plotsize),
  plotprice: parseInr(values.plotprice),
  plotdirection: values.plotdirection,
  plotType: values.plotType,
  roadWidthFt: Number(values.roadWidthFt),
  approvalStatus: values.approvalStatus,
  plotstatus: values.status,
});

export default function CreatePlot({
  setAddProjectModal,
  onClose,
  editPlotData = null,
  plotToEdit = null,
  projectId: projectIdProp = null,
}) {
  const { addToast } = useToast();
  const createPlotMutation = useCreatePlot();
  const updatePlotMutation = useUpdatePlot();
  const priceEstimateMutation = usePlotPriceEstimate();
  const { id: routeProjectId } = useParams();
  const effectiveProjectId = projectIdProp || routeProjectId;
  const [lastEstimate, setLastEstimate] = useState(null);

  const resolvedEditData =
    editPlotData ||
    (plotToEdit && effectiveProjectId
      ? {
          projectId: effectiveProjectId,
          plotId: plotToEdit._id,
          plotData: plotToEdit,
        }
      : null);

  const isEditMode = !!resolvedEditData;

  const closeModal = () => {
    if (typeof onClose === "function") onClose();
    if (typeof setAddProjectModal === "function") setAddProjectModal(false);
  };

  const handleSubmit = async (values) => {
    const plotData = buildPlotPayload(values);
    if (isEditMode) {
      await updatePlotMutation.mutateAsync({
        projectId: resolvedEditData.projectId,
        plotId: resolvedEditData.plotId,
        plotData,
      });
      addToast("success", "Plot Updated", "Plot updated successfully.");
      return;
    }
    await createPlotMutation.mutateAsync({
      projectId: effectiveProjectId,
      plotData,
    });
    addToast("success", "Plot Created", "Plot created successfully.");
  };

  const handleAiSuggest = async (values, setFieldValue) => {
    if (!effectiveProjectId) {
      addToast("error", "Missing project", "Open a project before estimating price.");
      return;
    }
    if (!values.plotdirection) {
      addToast("error", "Direction required", "Select plot direction before AI estimate.");
      return;
    }
    try {
      const current = parseInr(values.plotprice);
      const estimate = await priceEstimateMutation.mutateAsync({
        projectId: effectiveProjectId,
        params: {
          plotsize: Number(values.plotsize),
          plotType: values.plotType,
          roadWidthFt: Number(values.roadWidthFt),
          approvalStatus: values.approvalStatus,
          plotdirection: values.plotdirection,
          ...(current > 0 ? { currentPrice: current } : {}),
        },
      });
      setLastEstimate(estimate);
      if (estimate?.suggestedPrice != null) {
        const suggested = Number(estimate.suggestedPrice);
        const bigGap =
          current > 0 &&
          suggested > 0 &&
          (suggested < current * 0.5 || suggested > current * 2);

        if (!bigGap) {
          setFieldValue("plotprice", formatInr(suggested));
        }

        const projectN =
          estimate.projectPlotCount ?? estimate.sampleSize ?? 0;
        addToast(
          bigGap ? "warning" : "success",
          "AI price estimate",
          bigGap
            ? `You entered ₹${formatInr(current)}; AI suggests ₹${formatInr(suggested)}. Your price was not changed.`
            : `Suggested ₹${formatInr(suggested)} (${estimate.confidence} confidence, ${projectN} plots in this project).`
        );
      }
    } catch (err) {
      addToast(
        "error",
        "Estimate failed",
        err?.response?.data?.message || err.message || "Could not estimate price."
      );
    }
  };

  return (
    <div className="fixed flex inset-0 items-center justify-center min-h-screen bg-black bg-opacity-50 p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <HousePlus className="text-black text-2xl mr-3" size={30} />
          <div>
            <h2 className="text-xl font-semibold text-left">
              {isEditMode ? "Update plot" : "Create plot"}
            </h2>
            <p className="text-gray-500 text-sm">
              {isEditMode && resolvedEditData?.plotData?.createdAt ? (
                <>
                  Created:{" "}
                  {String(resolvedEditData.plotData.createdAt).split(",")[0]}
                </>
              ) : (
                <>
                  Select plot direction, then use AI. Prices use Indian number
                  format (e.g. 70,00,000).
                </>
              )}
            </p>
          </div>
        </div>

        <Formik
          key={isEditMode ? resolvedEditData.plotId : "create"}
          enableReinitialize
          initialValues={{
            plotsize: resolvedEditData?.plotData?.plotsize ?? "",
            plotprice: resolvedEditData?.plotData?.plotprice
              ? formatInr(resolvedEditData.plotData.plotprice)
              : "",
            plotdirection: resolvedEditData?.plotData?.plotdirection ?? "",
            plotType: resolvedEditData?.plotData?.plotType ?? "middle",
            roadWidthFt: resolvedEditData?.plotData?.roadWidthFt ?? "",
            approvalStatus:
              resolvedEditData?.plotData?.approvalStatus ?? "unapproved",
            status: resolvedEditData?.plotData?.plotstatus ?? "Available",
            plotno: resolvedEditData?.plotData?.plotnumber ?? "",
          }}
          validationSchema={validationSchema}
          validateOnChange
          validateOnBlur
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              await handleSubmit(values);
              resetForm();
              closeModal();
            } catch (err) {
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Something went wrong. Please try again.";
              addToast(
                "error",
                isEditMode ? "Update failed" : "Creation failed",
                msg
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-gray-700 text-left text-xs">
                  Plot number
                </label>
                <Field
                  type="number"
                  name="plotno"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                  placeholder="e.g. 101"
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
                    Plot size (sq.ft)
                  </label>
                  <Field
                    type="number"
                    name="plotsize"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                    placeholder="e.g. 1200"
                  />
                  <ErrorMessage
                    name="plotsize"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700 text-left text-xs">
                    Plot price (₹)
                  </label>
                  <Field name="plotprice">
                    {({ field, form }) => (
                      <input
                        type="text"
                        inputMode="numeric"
                        name={field.name}
                        className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                        placeholder="e.g. 70,00,000"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, "");
                          form.setFieldValue(
                            "plotprice",
                            digits ? formatInr(Number(digits)) : ""
                          );
                        }}
                      />
                    )}
                  </Field>
                  <ErrorMessage
                    name="plotprice"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 space-y-3">
                <p className="text-xs font-semibold text-blue-900 text-left">
                  AI pricing attributes
                </p>

                <div>
                  <label className="block text-gray-700 text-left text-xs">
                    Plot type
                  </label>
                  <Field
                    as="select"
                    name="plotType"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs bg-white"
                  >
                    {PLOT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="plotType"
                    component="div"
                    className="text-red-500 text-xs text-left"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-gray-700 text-left text-xs">
                      Road width (ft)
                    </label>
                    <Field
                      type="number"
                      name="roadWidthFt"
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs"
                      placeholder="e.g. 30"
                    />
                    <ErrorMessage
                      name="roadWidthFt"
                      component="div"
                      className="text-red-500 text-xs text-left"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-gray-700 text-left text-xs">
                      Approval status
                    </label>
                    <Field
                      as="select"
                      name="approvalStatus"
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs bg-white"
                    >
                      {APPROVAL_STATUSES.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="approvalStatus"
                      component="div"
                      className="text-red-500 text-xs text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-left text-xs">
                    Plot direction <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="plotdirection"
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-xs bg-white"
                  >
                    <option value="">Select direction (required for AI)</option>
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

                <button
                  type="button"
                  onClick={() => handleAiSuggest(values, setFieldValue)}
                  disabled={
                    priceEstimateMutation.isPending ||
                    !values.plotsize ||
                    !values.plotdirection ||
                    !values.plotType ||
                    !values.roadWidthFt ||
                    !values.approvalStatus
                  }
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {priceEstimateMutation.isPending
                    ? "Estimating…"
                    : "Suggest price with AI"}
                </button>

                {lastEstimate?.suggestedPrice != null && (
                  <div className="text-xs text-gray-600 text-left space-y-1 rounded-md border border-gray-200 bg-gray-50 p-2">
                    <p>
                      <span className="font-medium text-gray-800">Suggested:</span> ₹
                      {Number(lastEstimate.suggestedPrice).toLocaleString("en-IN")}
                      {lastEstimate.priceRange && (
                        <>
                          {" "}
                          (range ₹
                          {Number(lastEstimate.priceRange.low).toLocaleString("en-IN")} – ₹
                          {Number(lastEstimate.priceRange.high).toLocaleString("en-IN")})
                        </>
                      )}
                    </p>
                    <p>
                      ₹
                      {Number(lastEstimate.suggestedPricePerSqft).toLocaleString("en-IN")}
                      /sq.ft · {lastEstimate.confidence} confidence ·{" "}
                      {lastEstimate.projectPlotCount ?? lastEstimate.sampleSize ?? 0}{" "}
                      plots in this project
                    </p>
                    {lastEstimate.priceAssessment && (
                      <p
                        className={
                          lastEstimate.priceAssessment.verdict === "reasonable"
                            ? "text-green-700"
                            : "text-amber-700"
                        }
                      >
                        Your price: ₹
                        {Number(lastEstimate.priceAssessment.currentPrice).toLocaleString(
                          "en-IN"
                        )}{" "}
                        — {lastEstimate.priceAssessment.label}
                      </p>
                    )}
                    {Array.isArray(lastEstimate.reasoning) &&
                      lastEstimate.reasoning.length > 0 && (
                        <ul className="list-disc pl-4 space-y-0.5">
                          {lastEstimate.reasoning.map((r, i) => (
                            <li key={i}>
                              {r.factor}
                              {r.impactPct != null &&
                                ` (${r.direction === "decrease" ? "−" : "+"}${r.impactPct}%)`}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                )}
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
                  className="px-4 py-2 bg-black text-white rounded-md text-xs disabled:opacity-50"
                  disabled={
                    isSubmitting ||
                    createPlotMutation.isPending ||
                    updatePlotMutation.isPending
                  }
                >
                  {isEditMode
                    ? updatePlotMutation.isPending
                      ? "Updating…"
                      : "Update"
                    : createPlotMutation.isPending
                    ? "Creating…"
                    : "Create"}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-xs"
                  onClick={closeModal}
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
