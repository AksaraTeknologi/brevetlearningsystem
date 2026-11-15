import StaffShell from "@/Components/app-shell/StaffShell";
import adminItems from "@/lib/admin-items";
import { PropsWithChildren } from "react";

export default function AdminLayout({ children }: PropsWithChildren) {
    return (
        <StaffShell
            roleLabel="Admin"
            menu={adminItems()}
            dashboardRoute="admin.dashboard"
            dashboardPaths={["/admin", "/admin/dashboard"]}
        >
            {children}
        </StaffShell>
    );
}
