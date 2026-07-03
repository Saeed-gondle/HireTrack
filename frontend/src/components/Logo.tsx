import Link from "next/link";
import { HiBriefcase } from "react-icons/hi2";
function Logo() {
  return (
    <div className=" text-2xl ">
      <Link href="/" className="flex items-center gap-2 font-bold mb-6">
        <span>
          <HiBriefcase />
        </span>{" "}
        HireTrack
      </Link>
    </div>
  );
}

export default Logo;
