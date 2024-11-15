export const runtime = "edge";

import ConfigForm from "@/app/config/config-form";

export default async function ConfigPage({
  params,
}: {
  params: { configId: string };
}) {
  const { configId } = await params;

  return (
    <div className="container max-w-2xl py-8">
      <ConfigForm configId={configId} />
    </div>
  );
}
