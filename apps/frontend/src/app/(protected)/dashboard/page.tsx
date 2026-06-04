import { logout } from "@/app/(auth)/logout/actions";

export default function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>
        Welcome to your dashboard! Here you can manage your account and view
        your activity.
      </p>

      <form action={logout}>
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
