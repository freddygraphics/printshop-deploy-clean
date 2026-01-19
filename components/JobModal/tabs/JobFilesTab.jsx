import JobFileUpload from "@/components/JobFileUpload";

export default function JobFilesTab({ job }) {
  return (
    <div>
      <JobFileUpload jobId={job.id} />
    </div>
  );
}
