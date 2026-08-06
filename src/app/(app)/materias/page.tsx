import { PageHeader } from "@/components/shared/page-header";
import { CourseList, type CourseRow } from "@/features/courses/components/course-list";
import { getActiveTerm, listBlocks, listCourses } from "@/features/courses/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Materias · nerd" };

export default async function CoursesPage() {
  const user = await requireUser();
  const [term, courses, blocks] = await Promise.all([
    getActiveTerm(user.id),
    listCourses(user.id),
    listBlocks(user.id),
  ]);

  const rows: CourseRow[] = courses.map((course) => ({
    id: course.id,
    name: course.name,
    code: course.code,
    teacher: course.teacher,
    room: course.room,
    color: course.color,
    credits: course.credits,
    minAttendancePct: course.minAttendancePct,
    blockCount: blocks.filter((b) => b.courseId === course.id).length,
    pendingTasks: 0,
  }));

  return (
    <>
      <PageHeader
        title="Materias"
        description={
          term ? `Semestre: ${term.name}` : "Se creará un semestre al agregar la primera materia."
        }
      />
      <CourseList courses={rows} defaultMinAttendance={user.defaultMinAttendancePct} />
    </>
  );
}
