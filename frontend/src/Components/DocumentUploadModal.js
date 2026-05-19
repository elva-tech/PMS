import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

const ALL_PLOTS_VALUE = "__ALL_PLOTS__";

const DOC_TYPES = [
  { value: "sketch", label: "Sketch" },
  { value: "form_2", label: "Form 2" },
  { value: "form_1", label: "Form 1" },
  { value: "form_11", label: "Form 11" },
  { value: "sale_deed", label: "Sale deed" },
  { value: "property_tax_receipts", label: "Property tax paid receipts" },
  { value: "other", label: "Other document" },
];

const UploadDocument = ({
  setDocumentUploadModal,
  sendFiles,
  plots = [],
  isAdmin = false,
}) => {
  const [files, setFiles] = useState([]);
  const [selectedPlotKey, setSelectedPlotKey] = useState("");
  const [searchPlot, setSearchPlot] = useState("");
  const [documentType, setDocumentType] = useState("sketch");
  const [otherLabel, setOtherLabel] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    if (!selectedPlotKey) {
      setSelectedPlotKey(
        plots.length ? ALL_PLOTS_VALUE : ""
      );
    }
  }, [isAdmin, plots.length, selectedPlotKey]);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
  };

  const handleSendFiles = () => {
    if (!isAdmin) return;
    const allPlots = selectedPlotKey === ALL_PLOTS_VALUE;
    const plotId =
      allPlots || !selectedPlotKey ? "" : selectedPlotKey;
    if (!allPlots && !plotId) return;
    if (documentType === "other" && !otherLabel.trim()) return;

    sendFiles(files, {
      allPlots,
      plotid: plotId,
      documentType,
      otherLabel: documentType === "other" ? otherLabel.trim() : "",
      remarks: remarks.trim(),
    });
  };

  const filteredPlots = plots.filter((plot) => {
    const term = searchPlot.trim().toLowerCase();
    if (!term) return true;
    return (
      String(plot.plotnumber || "").includes(term) ||
      String(plot.plotdirection || "").toLowerCase().includes(term) ||
      String(plot.plotsize || "").includes(term)
    );
  });

  const plotChoiceValid =
    selectedPlotKey === ALL_PLOTS_VALUE ||
    (Boolean(selectedPlotKey) &&
      plots.some((plot) => String(plot._id) === String(selectedPlotKey)));

  const canSubmit =
    files.length > 0 &&
    plots.length > 0 &&
    plotChoiceValid &&
    (documentType !== "other" || otherLabel.trim().length > 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 min-h-screen px-4 py-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-100 px-5 py-4 bg-gradient-to-r from-slate-50 to-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upload document</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Link to plot(s); type helps buyers find files quickly.
            </p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 rounded-lg p-2 hover:bg-gray-100 transition"
            onClick={() => setDocumentUploadModal(false)}
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div
            className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center bg-gradient-to-b from-blue-50/80 to-white cursor-pointer transition hover:border-blue-400"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <i className="fas fa-file-alt text-3xl text-blue-500 mb-3" />
            <p className="text-gray-600 text-sm">Drag and drop files here or</p>
            <label className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block text-sm font-medium shadow-sm transition">
              Browse files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3">
              <p className="text-gray-800 text-sm font-medium mb-2">Selected files</p>
              <ul className="text-xs text-gray-600 space-y-1 max-h-28 overflow-y-auto">
                {files.map((file, index) => (
                  <li key={index} className="truncate font-mono">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isAdmin && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Plot scope
                </label>
                <input
                  type="text"
                  value={searchPlot}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchPlot(val);
                    const exact = plots.find(
                      (plot) => String(plot.plotnumber) === val.trim()
                    );
                    if (exact) setSelectedPlotKey(String(exact._id));
                  }}
                  placeholder="Filter by plot number…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  value={selectedPlotKey}
                  onChange={(e) => setSelectedPlotKey(e.target.value)}
                >
                  <option value={ALL_PLOTS_VALUE}>All plots (copy to each plot)</option>
                  {filteredPlots.map((p) => (
                    <option key={p._id} value={p._id}>
                      Plot #{p.plotnumber} — {p.plotdirection || "—"}
                    </option>
                  ))}
                </select>
                {plots.length === 0 && (
                  <p className="text-xs text-amber-700 mt-2">
                    Add plots before uploading documents.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Document type
                </label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {documentType === "other" && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1.5">
                    Custom name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherLabel}
                    onChange={(e) => setOtherLabel(e.target.value)}
                    placeholder="e.g. NOC, encumbrance certificate…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Remarks <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  placeholder="Internal note…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end items-center gap-2 border-t border-gray-100 px-5 py-4 bg-gray-50/80 rounded-b-xl">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-white transition"
            type="button"
            onClick={() => setDocumentUploadModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed shadow-sm transition"
            onClick={handleSendFiles}
            disabled={!isAdmin || !canSubmit}
          >
            <Upload size={18} />
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;
