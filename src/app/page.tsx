import { readSonderData } from "@/lib/admin";
import { SonderExperience } from "@/components/SonderExperience";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await readSonderData();

  return <SonderExperience cities={data.cities} data={data} />;
}
