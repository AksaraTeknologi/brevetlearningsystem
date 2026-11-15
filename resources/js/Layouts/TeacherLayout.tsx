import StaffShell from "@/Components/app-shell/StaffShell";
import teacherItems from "@/lib/teacher-items";
import { PropsWithChildren } from "react";

export default function TeacherLayout({ children }: PropsWithChildren) {
    return (
        <StaffShell
            roleLabel="Pengajar"
            menu={teacherItems()}
            dashboardRoute="teacher.dashboard"
            dashboardPaths={["/teacher", "/teacher/dashboard"]}
        >
            {children}
        </StaffShell>
    );
}
