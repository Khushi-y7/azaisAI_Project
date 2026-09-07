import { getSession } from "@/lib/session";
import { ImageStudio } from "@/components/image-studio";

export default async function GenerateImagePage() {
  const session = await getSession();
  return <ImageStudio loggedIn={Boolean(session.userId)} />;
}
