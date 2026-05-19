import React, { useMemo, useState } from "react";

const InterestedBuyerForm = ({
  plots = [],
  onSubmit,
  isSubmitting = false,
  submitDisabled = false,
  submitLabel = "Save buyer",
  initialValues,
}) => {
  const [form, setForm] = useState(
    initialValues || {
      fullName: "",
      email: "",
      phone: "",
      plotid: "",
      description: "",
    }
  );

  const selectedPlot = useMemo(
    () => plots.find((plot) => String(plot._id) === String(form.plotid)),
    [form.plotid, plots]
  );

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSubmit) return;
    await onSubmit({
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim().replace(/\D/g, ""),
      description: form.description.trim(),
      selectedPlot,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3"
    >
      <input
        className="border rounded-md px-3 py-2 text-sm"
        placeholder="Full name"
        value={form.fullName}
        onChange={(e) => handleChange("fullName", e.target.value)}
      />
      <input
        className="border rounded-md px-3 py-2 text-sm"
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
      />
      <input
        className="border rounded-md px-3 py-2 text-sm"
        placeholder="10-digit phone"
        inputMode="numeric"
        maxLength={10}
        value={form.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
      />
      <select
        className="border rounded-md px-3 py-2 text-sm"
        value={form.plotid}
        onChange={(e) => handleChange("plotid", e.target.value)}
      >
        <option value="">Select plot *</option>
        {plots.map((plot) => (
          <option key={plot._id} value={plot._id}>
            Plot #{plot.plotnumber}
          </option>
        ))}
      </select>
      <input
        className="border rounded-md px-3 py-2 text-sm md:col-span-2"
        placeholder="Short description / interest note (optional)"
        value={form.description}
        onChange={(e) => handleChange("description", e.target.value)}
      />
      <div className="md:col-span-2 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || submitDisabled}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default InterestedBuyerForm;
