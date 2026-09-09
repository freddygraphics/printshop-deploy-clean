import HubProductConfigurator from "@/components/hub/HubProductConfigurator";

export const dynamic = "force-dynamic";

export default async function HubProductPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#fbfbfb] p-6">
      <div className="mx-auto mb-6 max-w-[1400px]">
        <div className="text-sm text-gray-500">Products / Hub / {id}</div>
      </div>

      <HubProductConfigurator productId={id} />
    </div>
  );
}
