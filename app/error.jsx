'use client';

export default function Error({ error, reset }) {
  return (
    <div className="text-center p-10">
      <h2 className="text-red-600 text-2xl font-bold mb-4">Something went wrong 😢</h2>
      <p className="text-gray-700 mb-6">{error?.message || 'Unknown error occurred'}</p>
      <button
        onClick={() => reset()}
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded"
      >
        Try Again
      </button>
    </div>
  );
}
