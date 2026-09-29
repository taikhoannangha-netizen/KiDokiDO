import { WeeklyGoalConfig, StudentWeeklyGoalReport, ParentEmailRecord, UserAccount } from '../types';

export const DEFAULT_WEEKLY_GOAL_CONFIG: WeeklyGoalConfig = {
  targetLessons: 6,
  targetStudyMinutes: 60,
  targetStars: 50,
  autoEmailAlerts: true,
  parentEmail: "caoquocbaozx4@gmail.com",
  reminderFrequency: "always",
};

const WEEKLY_GOAL_STORAGE_KEY = "KIDO_WEEKLY_GOAL_CONFIG_V1";
const PARENT_EMAIL_HISTORY_KEY = "KIDO_PARENT_EMAIL_HISTORY_V1";

export function getWeeklyGoalConfig(): WeeklyGoalConfig {
  try {
    const raw = localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY) || localStorage.getItem("DINO_WEEKLY_GOAL_CONFIG_V1");
    if (raw) return { ...DEFAULT_WEEKLY_GOAL_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Failed to load weekly goal config", e);
  }
  return DEFAULT_WEEKLY_GOAL_CONFIG;
}

export function saveWeeklyGoalConfig(config: WeeklyGoalConfig) {
  try {
    localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save weekly goal config", e);
  }
}

export function evaluateStudentWeeklyGoal(
  student: UserAccount,
  config?: WeeklyGoalConfig,
  parent?: UserAccount
): StudentWeeklyGoalReport {
  const cfg = config || getWeeklyGoalConfig();
  const completedLessons = student.completedLessons !== undefined ? student.completedLessons : Math.min(student.level || 0, cfg.targetLessons);
  const studyMinutes = student.studyTimeMinutes !== undefined ? student.studyTimeMinutes : (student.streakDays || 0) * 8;
  const starsEarned = student.stars !== undefined ? student.stars : 0;

  const targetLessons = Math.max(1, cfg.targetLessons);
  const targetMinutes = Math.max(10, cfg.targetStudyMinutes);
  const targetStars = Math.max(10, cfg.targetStars);

  const lessonsPercent = Math.min(100, Math.round((completedLessons / targetLessons) * 100));
  const minutesPercent = Math.min(100, Math.round((studyMinutes / targetMinutes) * 100));
  const starsPercent = Math.min(100, Math.round((starsEarned / targetStars) * 100));
  const overallScorePercent = Math.round(lessonsPercent * 0.5 + minutesPercent * 0.3 + starsPercent * 0.2);

  let status: 'achieved' | 'needs_effort' | 'missed';
  let statusText: string;
  let advice: string;

  if (lessonsPercent >= 100) {
    status = 'achieved';
    statusText = 'Hoàn thành xuất sắc mục tiêu tuần! 🌟';
    advice = `Khủng Long Kido khen ngợi bé ${student.name} đã rất chăm chỉ và vượt chỉ tiêu tuần này!`;
  } else if (lessonsPercent >= 50) {
    status = 'needs_effort';
    statusText = 'Tiến độ trung bình - Cần nỗ lực thêm ⚠️';
    advice = `Bé ${student.name} đã hoàn thành ${completedLessons}/${targetLessons} bài học. Hãy nhắc bé dành thêm 15-20 phút học cùng Kido để về đích nhé!`;
  } else {
    status = 'missed';
    statusText = 'Chưa hoàn thành mục tiêu tuần 🔴';
    advice = `Bé ${student.name} mới chỉ hoàn thành ${completedLessons}/${targetLessons} bài học (${lessonsPercent}%). Phụ huynh nên khích lệ bé học tập đều đặn hơn.`;
  }

  const missingLessons = Math.max(0, targetLessons - completedLessons);
  const missingMinutes = Math.max(0, targetMinutes - studyMinutes);
  const missingStars = Math.max(0, targetStars - starsEarned);
  const isGoalMet = lessonsPercent >= 100;

  const parentEmail = parent?.email || student.email || cfg.parentEmail || 'caoquocbaozx4@gmail.com';
  const parentName = parent?.name || 'Quý Phụ Huynh';

  return {
    studentId: student.id,
    studentName: student.name,
    studentUsername: student.username,
    avatar: student.avatar || '🎒',
    parentEmail,
    parentName,
    targetLessons,
    completedLessons,
    lessonsProgressPercent: lessonsPercent,
    targetMinutes,
    studyMinutes,
    minutesProgressPercent: minutesPercent,
    targetStars,
    starsEarned,
    starsProgressPercent: starsPercent,
    overallScorePercent,
    status,
    statusText,
    missingLessons,
    missingMinutes,
    missingStars,
    isGoalMet,
    kidoAdvice: advice,
    dinoAdvice: advice,
  };
}

export function scanAllStudentsWeeklyGoals(
  accounts: UserAccount[],
  _unused?: any,
  config?: WeeklyGoalConfig
) {
  const cfg = config || getWeeklyGoalConfig();
  const kids = accounts.filter((c) => c.role === 'kid');
  const parents = accounts.filter((c) => c.role === 'parent');

  const allReports = kids.map((kid) => {
    const parent = parents.find(
      (p) => (p.linkedKidIds || []).includes(kid.id) || (kid.linkedParentIds || []).includes(p.id)
    );
    return evaluateStudentWeeklyGoal(kid, cfg, parent);
  });

  const unmetReports = allReports.filter((r) => !r.isGoalMet);
  const achievedReports = allReports.filter((r) => r.isGoalMet);

  return {
    allReports,
    unmetReports,
    achievedReports,
  };
}

export function generateParentEmailTemplate(
  report: StudentWeeklyGoalReport,
  parentNameInput?: string,
  senderName: string = 'Hệ Thống KidoEnglish AI'
) {
  const pName = parentNameInput || report.parentName || 'Quý Phụ Huynh';
  const advice = report.kidoAdvice;
  const subject = report.isGoalMet
    ? `🎉 [KidoEnglish] Chúc mừng bé ${report.studentName} đã hoàn thành xuất sắc mục tiêu tuần!`
    : `⚠️ [KidoEnglish] Cảnh báo tiến độ: Bé ${report.studentName} chưa hoàn thành mục tiêu học tập tuần này!`;

  const bodyText = `Kính gửi ${pName},

KidoEnglish xin gửi tới Phụ huynh báo cáo tổng kết tiến độ học tập hàng tuần của bé: ${report.studentName} (@${report.studentUsername || ''}).

📊 TỔNG QUAN TIẾN ĐỘ TUẦN NÀY:
- Trạng thái: ${report.statusText}
- Số bài học hoàn thành: ${report.completedLessons}/${report.targetLessons} bài (${report.lessonsProgressPercent}%) ${report.missingLessons > 0 ? `(Còn thiếu ${report.missingLessons} bài)` : '(Đạt chỉ tiêu)'}
- Thời gian học tập: ${report.studyMinutes}/${report.targetMinutes} phút (${report.minutesProgressPercent}%)
- Sao thưởng tích lũy: ⭐ ${report.starsEarned}/${report.targetStars} sao (${report.starsProgressPercent}%)
- Đánh giá tổng thể: ${report.overallScorePercent}%

🦖 LỜI NHẮN TỪ KHỦNG LONG KIDO:
"${advice}"

💡 LỜI KHUYÊN DÀNH CHO PHỤ HUYNH:
${report.missingLessons > 0 ? `1. Cùng bé dành ra 10-15 phút vào buổi tối ôn lại từ vựng bằng Flashcards.
2. Khích lệ bé làm thêm ${report.missingLessons} bài học ngắn trong mục Luyện Kỹ Năng.
3. Thưởng huy hiệu hoặc quà khi bé hoàn thành đủ mục tiêu tuần sau.` : `1. Khen ngợi và đập tay khích lệ tinh thần tự giác của bé!
2. Mở khóa thêm phần thưởng hoặc sticker mới trong Tủ đồ để duy trì động lực học tập.`}

Trân trọng,
${senderName}
Website: KidoEnglish - Learn, Play & Grow
Email hỗ trợ: support@kidoenglish.edu.vn`;

  const bodyHtml = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #1d50b4, #4f46e5); color: #ffffff; padding: 24px 28px; text-align: center;">
    <div style="font-size: 32px; margin-bottom: 6px;">🦖 📚</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">BÁO CÁO MỤC TIÊU HỌC TẬP HÀNG TUẦN</h1>
    <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Hệ Thống KidoEnglish - Học Tiếng Anh Thông Minh Cho Bé</p>
  </div>
  <div style="padding: 26px 28px;">
    <p style="font-size: 14px; color: #334155; margin-top: 0;">Kính gửi <strong>${pName}</strong>,</p>
    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      KidoEnglish xin gửi bảng thông báo tiến độ học tập trong tuần này của học sinh <strong>${report.studentName}</strong> (Tài khoản: <code>@${report.studentUsername || ''}</code>):
    </p>
    <div style="background-color: ${report.isGoalMet ? '#ecfdf5' : '#fff1f2'}; border: 2px solid ${report.isGoalMet ? '#10b981' : '#f43f5e'}; border-radius: 14px; padding: 14px 18px; margin: 18px 0; font-weight: bold; color: ${report.isGoalMet ? '#065f46' : '#9f1239'}; font-size: 14px;">
      ${report.statusText}
    </div>
    <div style="background-color: #f8fafc; border-radius: 14px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.8;">
      <div>📚 Bài học: <strong>${report.completedLessons}/${report.targetLessons} bài (${report.lessonsProgressPercent}%)</strong></div>
      <div>⏱️ Thời gian: <strong>${report.studyMinutes}/${report.targetMinutes} phút (${report.minutesProgressPercent}%)</strong></div>
      <div>⭐ Sao thưởng: <strong>${report.starsEarned}/${report.targetStars} sao (${report.starsProgressPercent}%)</strong></div>
    </div>
    <p style="font-style: italic; color: #64748b; font-size: 13px;">"${advice}"</p>
    <p style="font-size: 13px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
      Trân trọng,<br><strong>${senderName}</strong>
    </p>
  </div>
</div>`;

  return { subject, bodyText, bodyHtml };
}

export function saveParentEmailRecord(record: ParentEmailRecord) {
  try {
    const raw = localStorage.getItem(PARENT_EMAIL_HISTORY_KEY);
    const list: ParentEmailRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(PARENT_EMAIL_HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn("Failed to save parent email log", e);
  }
}

export function getParentEmailHistory(): ParentEmailRecord[] {
  try {
    const raw = localStorage.getItem(PARENT_EMAIL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to read parent email log", e);
    return [];
  }
}
