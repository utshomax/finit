import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export const metadata = {
  title: "Finit API Docs",
  description: "Interactive API documentation for the Finit personal finance API",
};

export default async function ApiDocPage() {
  const spec = await getApiDocs();
  return (
    <section className="container mx-auto py-8 px-4">
      <ReactSwagger spec={spec} />
    </section>
  );
}
