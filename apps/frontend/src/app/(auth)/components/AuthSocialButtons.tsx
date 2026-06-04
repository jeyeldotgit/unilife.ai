import Image from "next/image";

export const AuthSocialButtons = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-xl py-3 transition-colors duration-150 active:scale-95 hover:bg-[#f3f4f5]"
        style={{ border: "1px solid #c2c6d6" }}
      >
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_-azRmoVT3gRyjiztAgZk127s1GZm3AX1pkIxM3RP6bUwwouOyxCrPJgwhAH6uSgxr5q85F7EsrfzJRR6yioxC2PFSWZjvb0KQlcSov4UihSngnR7oolpI2GYIF5a_dWpF-Qhju5HxUfWqZPCc_wiSWhZZKyI4rDaM86F--3Q3eFaYjSnJ3aQbnOxvnBmKUOvPLHG-WZpA5lP8V3OMciSwaveq6trBn8DXqQmVowL6R0UoSJQkG1vbiwPjkq8Ox-tAcOMJ8-7MSQ"
          alt="Google"
          className="h-5 w-5"
          width={20}
          height={20}
        />
        <span className="text-xs font-medium text-[#191c1d]">Google</span>
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-xl py-3 transition-colors duration-150 active:scale-95 hover:bg-[#f3f4f5]"
        style={{ border: "1px solid #c2c6d6" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          school
        </span>
        <span className="text-xs font-medium text-[#191c1d]">Edu ID</span>
      </button>
    </div>
  );
};
