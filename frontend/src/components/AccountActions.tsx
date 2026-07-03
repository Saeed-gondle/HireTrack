import { HiMiniBell, HiMiniQuestionMarkCircle } from "react-icons/hi2";

function AccountActions() {
    return (
        <div className="flex items-center gap-2">
            <button className="btn relative rounded-full">
                <HiMiniBell className="w-6 h-6" />
                <span className="absolute top-0 right-0 bg-red-500 rounded-full px-2 py-1 text-xs text-white">5</span>
            </button>
            <button className="btn relative rounded-full">
                <HiMiniQuestionMarkCircle className="w-6 h-6" />
            </button>
        </div>
    )
}

export default AccountActions
