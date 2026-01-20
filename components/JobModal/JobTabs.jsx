import JobDetailsTab from "./tabs/JobDetailsTab";
import JobFilesTab from "./tabs/JobFilesTab";

const TABS = [
  { key: "details", label: "Details" },
  { key: "files", label: "Files" },
];

export default function JobTabs({ job, activeTab, setActiveTab }) {
  return (
    <>
      {/* TAB BAR */}
      <div className="flex gap-6 px-6 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 text-sm font-medium border-b-2 transition
              ${
                activeTab === tab.key
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-black"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="p-6 overflow-y-auto flex-1">
        {activeTab === "details" && <JobDetailsTab job={job} />}
        {activeTab === "files" && <JobFilesTab job={job} />}
      </div>
    </>
  );
}
