import { getSession } from "@/lib/session";
import { VideoStudio } from "@/components/video-studio";

export default async function GenerateVideoPage() {
  const session = await getSession();
  return <VideoStudio loggedIn={Boolean(session.userId)} />;
}
