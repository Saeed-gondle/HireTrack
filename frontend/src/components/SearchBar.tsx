import { HiOutlineSearch } from "react-icons/hi";

function SearchBar() {
    return (
        <div className="flex items-center gap-2 border-1 border-gray-200 rounded-md p-2 w-1/2">
            <HiOutlineSearch className="w-5 h-5 text-gray-500" />
            <input
                type="text"
                placeholder="Search"
                className="flex-1 bg-transparent border-none outline-none p-1"
            />
        </div>
    )
}

export default SearchBar
