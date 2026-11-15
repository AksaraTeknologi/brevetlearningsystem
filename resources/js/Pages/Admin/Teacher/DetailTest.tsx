import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ReferenceLinksDisplay } from "@/Components/exam/ReferenceLinksInput";
import { AlignLeft, CalendarDays, CalendarX, ClipboardCheck, Info, ListChecks, Target, Timer, Users } from "lucide-react";
import {
  CodeChip,
  EmptyState,
  InfoGrid,
  PageHeader,
  Section,
  StatGrid,
  StatTile,
  Timeline,
} from "@/Components/app-shell/kit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

const getInitials = (name: string) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "??";

export default function AdminDetailTest({ teacher, test = {}, participants = [] }: any) {
  const t = test as any;
  return (
    <AdminLayout>
      <Head title={`Detail Ujian - ${test?.title ?? ""}`} />
      <div className="py-8 mx-auto lg:px-4">
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link href={route("admin.teachers")}>Daftar Pengajar</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Link href={route("admin.showTeacher", (teacher as any)?.id)}>Detail Pengajar</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Detail Ujian</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <PageHeader
            icon={ClipboardCheck}
            eyebrow="Detail Ujian"
            title={t?.title}
            description={t?.description || undefined}
            actions={<CodeChip code={t?.code ?? "-"} onCopy={() => navigator.clipboard?.writeText(t?.code ?? "")} />}
          />

          <StatGrid>
            <StatTile icon={Timer} label="Durasi" value={typeof t?.duration === "number" ? `${t.duration} mnt` : "-"} tone="brand" />
            <StatTile icon={Target} label="Passing Grade" value={typeof t?.passing_score === "number" ? t.passing_score : "-"} tone="success" />
            <StatTile icon={ListChecks} label="Banyak Soal" value={typeof t?.question_count === "number" ? t.question_count : "-"} tone="info" />
            <StatTile icon={Users} label="Peserta" value={participants?.length || 0} tone="highlight" />
          </StatGrid>

          <Section icon={Info} title="Informasi Ujian">
            <InfoGrid
              items={[
                { icon: ClipboardCheck, label: "Nama Ujian", value: t?.title },
                { icon: ListChecks, label: "Banyak Soal", value: typeof t?.question_count === "number" ? `${t.question_count} Soal` : "(Belum ada soal)" },
                { icon: AlignLeft, label: "Deskripsi", value: t?.description || "-", full: true },
                {
                  icon: CalendarDays,
                  label: "Tanggal Pelaksanaan",
                  value: t?.start_date ? `${format(new Date(t.start_date), "d MMMM yyyy", { locale: id })} - ${format(new Date(t.start_date), "HH:mm", { locale: id })}` : "-",
                },
                {
                  icon: CalendarX,
                  label: "Ujian Ditutup",
                  value: t?.end_date ? `${format(new Date(t.end_date), "d MMMM yyyy", { locale: id })} - ${format(new Date(t.end_date), "HH:mm", { locale: id })}` : "-",
                },
              ]}
            />
            <div className="mt-4">
              <Timeline start={t?.start_date} end={t?.end_date} startLabel="Progres jadwal ujian" />
            </div>
            <div className="mt-4">
              <ReferenceLinksDisplay links={t?.reference_link} />
            </div>
          </Section>

          <Section icon={Users} title={`Daftar Peserta (${participants?.length || 0})`} bodyClassName={participants?.length ? "p-0" : undefined}>
            {participants?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p: any, i: number) => (
                    <TableRow key={p.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-3">
                          {p.user?.profile_url ? (
                            <img
                              src={p.user.profile_url}
                              alt={`Foto profil ${p.user.name}`}
                              className="h-8 w-8 rounded-xl object-cover shadow-sm ring-1 ring-border shrink-0"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-xs font-bold text-white shadow-sm shrink-0">
                              {getInitials(p.user?.name || "??")}
                            </div>
                          )}
                          <span>{p.user?.name || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.user?.email || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={Users} title="Belum ada peserta." />
            )}
          </Section>
        </div>
      </div>
    </AdminLayout>
  );
}
