import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AttendanceBar } from "@/features/attendance/components/attendance-bar";
import { getCourseAttendance } from "@/features/attendance/queries";
import { BlockList } from "@/features/courses/components/block-list";
import { getCourse, listBlocks } from "@/features/courses/queries";
import { courseColor } from "@/lib/course-colors";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const user = await requireUser();

  // Recurso ajeno o inexistente → 404, nunca 403: un 403 confirmaría que existe.
  const course = await getCourse(user.id, courseId);
  if (!course) notFound();

  const [blocks, attendance] = await Promise.all([
    listBlocks(user.id, course.id),
    getCourseAttendance(user, course.id),
  ]);
  const minPct = Number(course.minAttendancePct ?? user.defaultMinAttendancePct);

  return (
    <>
      <Link href="/materias" className="text-[13px] text-text-secondary hover:underline">
        ← Materias
      </Link>

      <div className="mt-3">
        <PageHeader
          title={course.name}
          description={[course.code, course.teacher, course.room].filter(Boolean).join(" · ")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[13px] text-text-secondary">
        <span className="flex items-center gap-2">
          <span
            className={cn("size-2.5 rounded-full", courseColor(course.color).dot)}
            aria-hidden="true"
          />
          {course.color}
        </span>
        {course.credits !== null && <span>{course.credits} créditos</span>}
        <span>
          Asistencia mínima: {minPct}%{course.minAttendancePct === null && " (general)"}
        </span>
      </div>

      {attendance && (
        <section className="mt-8 rounded-card border border-border bg-surface p-4">
          <h2 className="mb-3 text-lg font-semibold">Asistencia</h2>
          <AttendanceBar summary={attendance.summary} minPct={minPct} />
        </section>
      )}

      <BlockList
        courseId={course.id}
        blocks={blocks.map((b) => ({
          id: b.id,
          weekday: b.weekday,
          startTime: b.startTime,
          endTime: b.endTime,
          room: b.room,
        }))}
      />
    </>
  );
}
