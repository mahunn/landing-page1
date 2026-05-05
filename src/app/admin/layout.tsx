import Link from "next/link";

export default async function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-slate-500">Henley</p>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link className="text-slate-600 hover:text-slate-900" href="/">
              View Site
            </Link>
            <form action="/admin/logout" method="post">
              <button className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-page py-6">{children}</main>
    </div>
  );
}
