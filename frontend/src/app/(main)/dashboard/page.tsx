import { auth } from "@/lib/auth";

async function page() {
  const session = await auth();
  console.log("Session data:", session);
  return <div>Dashboard Page</div>;
}

export default page;
