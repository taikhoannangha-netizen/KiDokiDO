export function hasGradeAccess(allowedGrades?: string[], grade?: string, role?: string): boolean {
  if (role === 'admin' || !allowedGrades || allowedGrades.length === 0 || allowedGrades.includes('all')) {
    return true;
  }
  return grade ? allowedGrades.includes(grade) : false;
}

export function formatAllowedGradesText(allowedGrades?: string[], role?: string): string {
  if (role === 'admin') return 'Tất cả các lớp (Admin)';
  if (!allowedGrades || allowedGrades.length === 0 || allowedGrades.includes('all') || allowedGrades.length >= 5) {
    return 'Tất cả các lớp (Lớp 1 - 5)';
  }
  const grades = allowedGrades
    .filter((g) => g.startsWith('grade-'))
    .map((g) => g.replace('grade-', 'Lớp '))
    .sort();
  return grades.length > 0 ? grades.join(', ') : 'Chưa phân quyền';
}
