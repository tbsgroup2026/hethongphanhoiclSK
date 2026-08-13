// ─── TBS HTPH-CLSK — Translation strings (vi ↔ en) ──────────────────────────
// Domain‑organized; each leaf is { vi: string; en: string }.

export type Lang = "vi" | "en";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a dotted key path (e.g. "home.greeting") to a translated string. */
export function t(key: string, lang: Lang): string {
  const parts = key.split(".");
  let node: any = translations;
  for (const p of parts) {
    if (node == null || typeof node !== "object") return key;
    node = node[p];
  }
  return node?.[lang] ?? key;
}

/** Status enum → translated label */
export function tStatus(status: string, lang: Lang): string {
  return (translations.status as any)[status]?.[lang] ?? status;
}

/** Severity enum → translated label */
export function tSeverity(severity: string, lang: Lang): string {
  return (translations.severity as any)[severity]?.[lang] ?? severity;
}

/** Role enum → translated label */
export function tRole(role: string, lang: Lang): string {
  return (translations.roles as any)[role]?.[lang] ?? role;
}

/** Notification kind → translated title (just the text, no icon) */
export function tNotifTitle(kind: string, lang: Lang): string {
  return (translations.notifKinds as any)[kind]?.[lang] ?? kind;
}

/** timeAgo in the given language */
export function tTimeAgo(iso: string, lang: Lang): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return lang === "vi" ? "vừa xong" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return lang === "vi" ? `${minutes} phút trước` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === "vi" ? `${hours} giờ trước` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === "vi" ? `${days} ngày trước` : `${days}d ago`;
}

/** Short time‑ago for issue cards */
export function tTimeAgoShort(iso: string, lang: Lang): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return lang === "vi" ? "Vừa xong" : "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 3600) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 86400) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 604800) return `${Math.floor(minutes / 1440)}d`;
  return new Date(iso).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US");
}

// ─── Master translations object ───────────────────────────────────────────────

const translations = {
  // ── Common / shared ──────────────────────────────────────────────────────────
  common: {
    cancel:           { vi: "Hủy",               en: "Cancel" },
    confirm:          { vi: "Xác nhận",          en: "Confirm" },
    save:             { vi: "Lưu",               en: "Save" },
    close:            { vi: "Đóng",              en: "Close" },
    loading:          { vi: "Đang tải...",        en: "Loading..." },
    send:             { vi: "Gửi",               en: "Send" },
    submitting:       { vi: "Đang gửi...",        en: "Submitting..." },
    done:             { vi: "Xong",              en: "Done" },
    optional:         { vi: "(không bắt buộc)",   en: "(optional)" },
    delete:           { vi: "Xoá",               en: "Delete" },
    deleteRow:        { vi: "Xoá dòng",          en: "Delete row" },
    add:              { vi: "Thêm",              en: "Add" },
    selectPlaceholder:{ vi: "Chọn...",           en: "Select..." },
    quantity:         { vi: "Số lượng",          en: "Quantity" },
    note:             { vi: "Ghi chú",           en: "Note" },
    notePlaceholder:  { vi: "Ghi chú (không bắt buộc)", en: "Note (optional)" },
    otherFailure:     { vi: "Khác",              en: "Other" },
    noData:           { vi: "Không có dữ liệu",   en: "No data" },
    dash:             { vi: "-",                 en: "-" },
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────────
  tabs: {
    home:             { vi: "Trang chủ",          en: "Home" },
    notifications:    { vi: "Thông báo",          en: "Notifications" },
    work:             { vi: "Công việc",          en: "Work" },
    profile:          { vi: "Cá nhân",            en: "Profile" },
  },

  // ── Login screen ─────────────────────────────────────────────────────────────
  login: {
    brandTitle:       { vi: "TBS HTPH-CLSK",      en: "TBS HTPH-CLSK" },
    brandSubtitle:    { vi: "Hệ Thống Phản Hồi & Xử Lý Sự Cố Chất Lượng",
                        en: "Quality Issue Response & Resolution System" },
    portalBadge:      { vi: "🌿 Cổng Đăng Nhập Di Động Phân Xưởng",
                        en: "🌿 Factory Mobile Login Portal" },
    quickRoleTitle:   { vi: "Chọn nhanh vai trò", en: "Quick Role Select" },
    rolesCount:       { vi: "5 Roles",            en: "5 Roles" },
    employeeCodeLabel:{ vi: "Tên đăng nhập (Mã nhân viên)", en: "Username (Employee Code)" },
    employeeCodePH:   { vi: "VD: NV001, QA001, LL001...",   en: "e.g. NV001, QA001, LL001..." },
    passwordLabel:    { vi: "Mật khẩu",           en: "Password" },
    passwordPH:       { vi: "Nhập mật khẩu",      en: "Enter password" },
    demoHint:         { vi: "Demo mặc định: ",     en: "Demo default: " },
    loginButton:      { vi: "Đăng Nhập",          en: "Login" },
    connecting:       { vi: "Đang kết nối hệ thống...", en: "Connecting to system..." },
    serverLabel:      { vi: "⚙️ Máy chủ: ",       en: "⚙️ Server: " },
    serverLoading:    { vi: "Đang tải...",         en: "Loading..." },
    errorEmptyFields: { vi: "Vui lòng điền tên đăng nhập và mật khẩu.",
                        en: "Please fill in username and password." },
    serverConfigTitle:{ vi: "Cấu Hình Địa Chỉ Máy Chủ", en: "Server Address Configuration" },
    serverConfigSub:  { vi: "Nhập IP máy chủ phân xưởng hoặc Domain của hệ thống TBS HTPH-CLSK",
                        en: "Enter factory server IP or TBS HTPH-CLSK system domain" },
    serverConfigPH:   { vi: "VD: http://192.168.1.100:3000", en: "e.g. http://192.168.1.100:3000" },
    saveConfig:       { vi: "Lưu Cấu Hình",       en: "Save Configuration" },
  },

  // ── Home screen ──────────────────────────────────────────────────────────────
  home: {
    greeting:         { vi: "Xin chào,",           en: "Hello," },
    reportedCount:    { vi: "Báo cáo",             en: "Reported" },
    inProgressCount:  { vi: "Đang xử lý",          en: "In Progress" },
    reportCta:        { vi: "Báo cáo vấn đề",      en: "Report Issue" },
    checkCta:         { vi: "Kiểm tra sự cố",      en: "Check Issue" },
    recentActivity:   { vi: "Hoạt động gần đây",   en: "Recent Activity" },

    // Report form
    reportFormTitle:  { vi: "Báo cáo vấn đề",      en: "Report Issue" },
    poCodeLabel:      { vi: "Mã PO",               en: "PO Code" },
    poCodePH:         { vi: "VD: PO-2026-001",      en: "e.g. PO-2026-001" },
    areaLabel:        { vi: "Khu vực / Xưởng",      en: "Area / Workshop" },
    areaPH:           { vi: "Chọn khu vực",         en: "Select area" },
    lineLabel:        { vi: "Chuyền",              en: "Line" },
    linePH:           { vi: "Chọn chuyền",          en: "Select line" },
    linePHNoArea:     { vi: "Chọn khu vực trước",   en: "Select area first" },
    teamLabel:        { vi: "Tổ",                  en: "Team" },
    teamPH:           { vi: "Chọn tổ",             en: "Select team" },
    teamPHNoLine:     { vi: "Chọn chuyền trước",    en: "Select line first" },
    failureCategoryLabel: { vi: "Danh mục lỗi",     en: "Failure Category" },
    failureCategoryPH:    { vi: "Chọn danh mục lỗi", en: "Select failure category" },
    otherFailureLabel:    { vi: "Mô tả lỗi khác",   en: "Other failure description" },
    otherFailurePH:       { vi: "Mô tả chi tiết lỗi (bắt buộc)", en: "Describe the failure (required)" },
    severityLabel:        { vi: "Mức độ nghiêm trọng", en: "Severity" },
    severityPH:           { vi: "Chọn mức độ",      en: "Select severity" },
    descriptionLabel:     { vi: "Mô tả vấn đề",     en: "Issue Description" },
    descriptionPH:        { vi: "Mô tả chi tiết tình trạng gặp phải", en: "Describe the problem in detail" },
    imagesLabel:          { vi: "Hình ảnh minh chứng", en: "Evidence Images" },
    submitReport:         { vi: "Gửi báo cáo",      en: "Submit Report" },
    imageUploadError:     { vi: "Không thể tải ảnh lên", en: "Cannot upload image" },
    fillRequired:         { vi: "Vui lòng nhập mã PO và mô tả", en: "Please fill in PO code and description" },
    selectAreaRequired:   { vi: "Vui lòng chọn khu vực/xưởng", en: "Please select an area/workshop" },
    selectSeverityRequired:{ vi: "Vui lòng chọn mức độ nghiêm trọng", en: "Please select severity" },
    selectCategoryRequired:{ vi: "Vui lòng chọn danh mục lỗi", en: "Please select a failure category" },
    otherRequired:         { vi: "Vui lòng mô tả lỗi khác", en: "Please describe the other failure" },

    // Check form
    checkFormTitle:       { vi: "Kiểm tra sự cố",    en: "Check Issue" },
    checkPoCodeLabel:     { vi: "Mã PO / Mã sản phẩm", en: "PO Code / Product Code" },
    checkButton:          { vi: "Tra cứu",            en: "Lookup" },
    checking:             { vi: "Đang tra cứu...",     en: "Looking up..." },
    checkPoRequired:      { vi: "Vui lòng nhập mã PO/SP", en: "Please enter PO/SP code" },
    checkError:           { vi: "Không thể tra cứu, thử lại", en: "Cannot lookup, try again" },
    noIssuesFound:        { vi: "Chưa từng ghi nhận lỗi với mã này", en: "No issues recorded with this code" },
    foundIssuesPrefix:    { vi: "Tìm thấy ",          en: "Found " },
    foundIssuesSuffix:    { vi: " sự cố trước đó",     en: " previous issues" },

    // Empty state
    emptyIcon:            { vi: "📋",                 en: "📋" },
    emptyTitle:           { vi: "Chưa có báo cáo",     en: "No reports" },
    emptyText:            { vi: "Bạn sẽ thấy các sự cố đã báo cáo ở đây", en: "You'll see reported issues here" },

    // Report error
    reportSubmitError:    { vi: "Không thể gửi báo cáo", en: "Cannot submit report" },
  },

  // ── Notifications screen ────────────────────────────────────────────────────
  notifications: {
    headerTitle:      { vi: "Thông báo",          en: "Notifications" },
    emptyIcon:        { vi: "🔔",                  en: "🔔" },
    emptyText:        { vi: "Chưa có thông báo nào", en: "No notifications yet" },
    reporterLabel:    { vi: "Người báo",           en: "Reporter" },
    poCodeLabel:      { vi: "Mã PO",               en: "PO Code" },
    teamLineLabel:    { vi: "Tổ / Chuyền",         en: "Team / Line" },
    failureCategoryLabel: { vi: "Danh mục lỗi",    en: "Failure category" },
    descriptionLabel: { vi: "Mô tả",               en: "Description" },
    solutionLabel:    { vi: "Giải pháp",           en: "Solution" },
    noSolution:       { vi: "Không có đề xuất",    en: "No proposal" },
    maintainerLabel:  { vi: "Bảo trì",             en: "Maintenance" },
    repairedByLabel:  { vi: "Đã sửa bởi",          en: "Repaired by" },
    statusLabel:      { vi: "Trạng thái",          en: "Status" },
    rootCauseLabel:   { vi: "Nguyên nhân gốc",     en: "Root cause" },
  },

  // ── Notification kind titles ────────────────────────────────────────────────
  notifKinds: {
    NEED_INVESTIGATE: { vi: "Cần điều tra 5M+1E",         en: "5M+1E Investigation needed" },
    FYI_REPORTED:     { vi: "[FYI] Sự cố mới tại phân xưởng", en: "[FYI] New issue at workshop" },
    NEED_ROOT_CAUSE:  { vi: "Cần chốt nguyên nhân gốc",   en: "Root cause decision needed" },
    NEED_ASSIGN:      { vi: "Cần giao việc bảo trì",      en: "Maintenance assignment needed" },
    TASK_ASSIGNED:    { vi: "CẦN TRỢ GIÚP",               en: "HELP NEEDED" },
    TASK_ACCEPTED:    { vi: "Đã nhận việc",               en: "Task accepted" },
    NEED_REPAIR_REVIEW:{ vi: "Xác nhận sửa chữa đạt yêu cầu?", en: "Confirm repair is satisfactory?" },
    NEED_VERIFY:      { vi: "Đang theo dõi — Đóng vấn đề?", en: "Monitoring — Close issue?" },
    TASK_DONE_INFO:   { vi: "Bảo trì đã hoàn thành sửa chữa", en: "Maintenance completed repair" },
    ISSUE_RESOLVED:   { vi: "Sự cố đã hoàn thành",        en: "Issue resolved" },
  },

  // ── Work screen ──────────────────────────────────────────────────────────────
  work: {
    headerTitle:      { vi: "Công việc",          en: "Work" },
    needAssign:       { vi: "Cần giao việc",       en: "Awaiting Assignment" },
    myTasks:          { vi: "Việc của tôi",        en: "My Tasks" },
    emptyAssign:      { vi: "Chưa có ticket nào cần giao việc", en: "No tickets awaiting assignment" },
    emptyMyTasks:     { vi: "Bạn chưa có việc bảo trì nào", en: "You have no maintenance tasks" },
    emptyIcon:        { vi: "🛠️",                  en: "🛠️" },
    taskPending:      { vi: "Chờ nhận",            en: "Pending" },
    taskProcessing:   { vi: "Đang xử lý",          en: "Processing" },
    taskDone:         { vi: "Đã hoàn thành",       en: "Completed" },
  },

  // ── Profile screen ───────────────────────────────────────────────────────────
  profile: {
    headerTitle:      { vi: "Cá nhân",            en: "Profile" },
    detailsTitle:     { vi: "Chi tiết",           en: "Details" },
    statsTitle:       { vi: "Thống kê",           en: "Statistics" },
    settingsTitle:    { vi: "Cài đặt",            en: "Settings" },
    employeeCodeLabel:{ vi: "Mã nhân viên",       en: "Employee Code" },
    phoneLabel:       { vi: "Số điện thoại",       en: "Phone" },
    roleLabel:        { vi: "Vai trò",            en: "Role" },
    areaLabel:        { vi: "Khu vực",            en: "Area" },
    totalTasks:       { vi: "Tổng nhiệm vụ",      en: "Total Tasks" },
    completedTasks:   { vi: "Đã hoàn thành",      en: "Completed" },
    totalWork:        { vi: "Tổng việc",          en: "Total" },
    notificationsSetting: { vi: "Thông báo",      en: "Notifications" },
    notificationsOn:  { vi: "Bật",                en: "On" },
    darkModeSetting:  { vi: "Chế độ tối",         en: "Dark Mode" },
    darkModeAuto:     { vi: "Tự động",            en: "Auto" },
    versionSetting:   { vi: "Phiên bản ứng dụng", en: "App Version" },
    languageSetting:  { vi: "Ngôn ngữ",           en: "Language" },
    languageVi:       { vi: "Tiếng Việt",         en: "Vietnamese" },
    languageEn:       { vi: "English",            en: "English" },
    logout:           { vi: "Đăng xuất",          en: "Logout" },
    logoutConfirm:    { vi: "Bạn có chắc chắn muốn đăng xuất?", en: "Are you sure you want to logout?" },
    changePassword:   { vi: "Đổi mật khẩu",       en: "Change Password" },
    currentPassword:  { vi: "Mật khẩu hiện tại",  en: "Current Password" },
    newPassword:      { vi: "Mật khẩu mới",       en: "New Password" },
    passwordSuccess:  { vi: "Đổi mật khẩu thành công", en: "Password changed successfully" },
    passwordError:    { vi: "Không thể đổi mật khẩu", en: "Cannot change password" },
    avatarError:      { vi: "Không thể cập nhật ảnh đại diện", en: "Cannot update avatar" },
    fontSizeLabel:    { vi: "Cỡ chữ",             en: "Font Size" },
  },

  // ── Issue detail screen ─────────────────────────────────────────────────────
  issue: {
    back:             { vi: "‹ Quay lại",          en: "‹ Back" },
    loading:          { vi: "Đang tải...",         en: "Loading..." },
    reporterLabel:    { vi: "Người báo cáo: ",     en: "Reporter: " },
    otherFailurePrefix:{ vi: "Lỗi khác: ",         en: "Other failure: " },

    // Investigation
    needInvestigate:  { vi: "Sự cố này cần bạn điều tra nguyên nhân", en: "This issue needs your investigation" },
    investigateCta:   { vi: "🔍 Kiểm tra sự cố",   en: "🔍 Investigate Issue" },
    investigationTitle:{ vi: "🤖 Điều tra nguyên nhân (AI hỏi xoáy 5 Whys)", en: "🤖 AI Root Cause Investigation (5 Whys)" },
    startWithAi:      { vi: "Bắt đầu điều tra với AI", en: "Start investigation with AI" },
    aiChatPlaceholder:{ vi: "Nhập câu trả lời...",  en: "Type your answer..." },
    aiResultTitle:    { vi: "Kết quả AI tổng hợp — kiểm tra lại trước khi gửi", en: "AI Summary — review before submitting" },
    aiRootCauseLabel: { vi: "🧩 Nguyên nhân gốc",   en: "🧩 Root Cause" },
    submitInvestigation: { vi: "Xác nhận & Gửi",    en: "Confirm & Submit" },
    investigationError:{ vi: "Không thể gửi biểu mẫu", en: "Cannot submit form" },
    fillAllFields:    { vi: "Vui lòng điền đầy đủ các mục", en: "Please fill in all fields" },
    aiError:          { vi: "Không thể kết nối AI, thử lại", en: "Cannot connect AI, try again" },

    // 5M+1E Investigation Results
    investigationResults: { vi: "Kết quả điều tra 5M+1E", en: "5M+1E Investigation Results" },
    rootCauseBy:      { vi: "🧩 Nguyên nhân gốc (theo ", en: "🧩 Root cause (per " },
    rootCauseByClose: { vi: ")",                          en: ")" },
    man:              { vi: "Man (Con người)",            en: "Man (People)" },
    machine:          { vi: "Machine (Máy móc)",           en: "Machine" },
    material:         { vi: "Material (Nguyên liệu)",      en: "Material" },
    method:           { vi: "Method (Phương pháp)",        en: "Method" },
    measurement:      { vi: "Measurement (Đo lường)",      en: "Measurement" },
    environment:      { vi: "Environment (Môi trường)",    en: "Environment" },

    // Root Cause Form
    rootCauseTitle:   { vi: "🧩 Tổng hợp nguyên nhân & Giải pháp", en: "🧩 Root Cause Synthesis & Solution" },
    rootCauseHint:    { vi: "Xem lại 3 bản 5M+1E ở trên, viết nguyên nhân gốc rễ cuối cùng và giải pháp xử lý — hoặc bấm AI tổng hợp để có gợi ý.",
                        en: "Review the 3 5M+1E submissions above, write the final root cause and solution — or tap AI synthesis for suggestions." },
    aiSynthesizing:   { vi: "AI đang tổng hợp...", en: "AI synthesizing..." },
    aiSynthesizeBtn:  { vi: "🤖 AI tổng hợp 3 nguyên nhân & gợi ý giải pháp", en: "🤖 AI synthesize 3 root causes & suggest solution" },
    synthesizeError:  { vi: "Không thể tổng hợp bằng AI", en: "Cannot synthesize with AI" },
    sosTitle:         { vi: "⚠️ AI đánh giá sự cố này vượt ngoài khả năng xử lý ở xưởng", en: "⚠️ AI assesses this issue is beyond workshop capability" },
    sosSent:          { vi: "✓ Đã gửi SOS cho Giám đốc", en: "✓ SOS sent to Director" },
    sosSending:       { vi: "Đang gửi...",          en: "Sending..." },
    sosBtn:           { vi: "🆘 Gửi SOS cho Giám đốc", en: "🆘 Send SOS to Director" },
    rootCauseInput:   { vi: "Nguyên nhân gốc",       en: "Root Cause" },
    solutionInput:    { vi: "Giải pháp đề xuất (không bắt buộc)", en: "Proposed solution (optional)" },
    decideBtn:        { vi: "Chốt nguyên nhân & Giải pháp", en: "Confirm Root Cause & Solution" },
    deciding:         { vi: "Đang gửi...",           en: "Submitting..." },
    rootCauseSection: { vi: "Nguyên nhân gốc",       en: "Root Cause" },
    solutionSection:  { vi: "Giải pháp đề xuất",     en: "Proposed Solution" },
    decideErrorEmpty: { vi: "Vui lòng nhập nguyên nhân gốc", en: "Please enter root cause" },
    decideError:      { vi: "Không thể chốt nguyên nhân", en: "Cannot confirm root cause" },

    // Assign Form
    assignTitle:      { vi: "Giao việc cho bảo trì",  en: "Assign to Maintenance" },
    searchMaintenance: { vi: "Tìm theo mã nhân viên hoặc tên", en: "Search by employee code or name" },
    assignBtn:        { vi: "Giao việc",             en: "Assign" },
    assigning:        { vi: "Đang giao...",           en: "Assigning..." },
    assignError:      { vi: "Không thể giao việc",   en: "Cannot assign task" },

    // Task Card
    taskHelpNeeded:   { vi: "CẦN TRỢ GIÚP",          en: "HELP NEEDED" },
    taskTitle:        { vi: "Việc bảo trì",          en: "Maintenance Task" },
    taskReporter:     { vi: "Người báo cáo: ",        en: "Reporter: " },
    taskSolution:     { vi: "Giải pháp đề xuất: ",    en: "Proposed solution: " },
    taskMaintainer:   { vi: "Bảo trì: ",             en: "Maintenance: " },
    taskAcceptedAt:   { vi: "Đã nhận lúc ",          en: "Accepted at " },
    taskCompletedAt:  { vi: "Hoàn thành lúc ",       en: "Completed at " },
    taskRepaired:     { vi: "Đã sửa: ",              en: "Repaired: " },
    taskMonitoringStart: { vi: "Bắt đầu theo dõi lúc ", en: "Monitoring started at " },
    taskClosed:       { vi: "✓ Đã đóng vấn đề",       en: "✓ Issue closed" },

    // Accept
    acceptBtn:        { vi: "Nhận việc",             en: "Accept Task" },
    accepting:        { vi: "Đang nhận...",           en: "Accepting..." },
    acceptError:      { vi: "Không thể nhận việc",   en: "Cannot accept task" },

    // Complete
    repairDetailLabel:{ vi: "Mô tả sửa chữa",        en: "Repair Description" },
    partsLabel:       { vi: "Linh kiện thay thế",     en: "Replaced Parts" },
    addPartBtn:       { vi: "+ Thêm linh kiện",       en: "+ Add part" },
    beforeImagesLabel:{ vi: "Ảnh trước sửa chữa",     en: "Before repair images" },
    afterImagesLabel: { vi: "Ảnh sau sửa chữa",       en: "After repair images" },
    completeBtn:      { vi: "Hoàn thành",            en: "Complete" },
    completing:       { vi: "Đang gửi...",            en: "Submitting..." },
    completeErrorEmpty:{ vi: "Vui lòng nhập mô tả sửa chữa", en: "Please enter repair description" },
    completeError:    { vi: "Không thể hoàn thành việc", en: "Cannot complete task" },

    // Repair Review
    repairReviewTitle:{ vi: "Sửa chữa đã đạt yêu cầu chưa?", en: "Is the repair satisfactory?" },
    reviewDoneBtn:    { vi: "✅ Xong",                en: "✅ Done" },
    reviewRejectBtn:  { vi: "❌ Chưa xong, làm lại",  en: "❌ Not done, redo" },
    reviewError:      { vi: "Không thể xác nhận",    en: "Cannot confirm" },

    // Verify
    verifyMonitoring: { vi: "Đang trong giai đoạn theo dõi (3-48h sau khi xác nhận sửa chữa đạt yêu cầu).",
                        en: "In monitoring phase (3-48h after repair confirmed satisfactory)." },
    verifyNotYet:     { vi: "Chỉ có thể xác nhận sau ", en: "Can only verify after " },
    verifyExpired:    { vi: "Đã quá hạn theo dõi, hệ thống sẽ tự động đóng vấn đề",
                        en: "Monitoring expired, system will auto-close the issue" },
    verifyCloseBtn:   { vi: "Đóng vấn đề",            en: "Close Issue" },
    verifyRecheckBtn: { vi: "Kiểm tra lại",           en: "Recheck" },
    verifyError:      { vi: "Không thể xác nhận",    en: "Cannot confirm" },

    // Elapsed timer
    timerProcessing:  { vi: "⏱ Đang xử lý: ",        en: "⏱ Processing: " },
    aiCompletedMessage: { vi: "Đã chốt nguyên nhân gốc rễ: ", en: "Root cause determined: " },
  },

  // ── Issue card component ─────────────────────────────────────────────────────
  issueCard: {
    justNow:          { vi: "Vừa xong",             en: "Just now" },
  },

  // ── Severity labels ──────────────────────────────────────────────────────────
  severity: {
    LOW:              { vi: "Thấp",                 en: "Low" },
    MEDIUM:           { vi: "Trung bình",           en: "Medium" },
    HIGH:             { vi: "Cao",                  en: "High" },
    URGENT:           { vi: "Khẩn cấp",             en: "Urgent" },
    // Short labels for badge
    lowShort:         { vi: "Thấp",                 en: "Low" },
    mediumShort:      { vi: "Trung",                en: "Med" },
    highShort:        { vi: "Cao",                  en: "High" },
    urgentShort:      { vi: "Khẩn cấp",             en: "Urgent" },
  },

  // ── Status labels ────────────────────────────────────────────────────────────
  status: {
    REPORTED:         { vi: "Vừa báo cáo",          en: "Reported" },
    INVESTIGATING:    { vi: "Đang điều tra",        en: "Investigating" },
    ROOT_CAUSE_FOUND: { vi: "Đã xác định",          en: "Root Cause Found" },
    ASSIGNED:         { vi: "Đã giao việc",         en: "Assigned" },
    IN_PROGRESS:      { vi: "Đang xử lý",           en: "In Progress" },
    DONE:             { vi: "Đã hoàn thành",         en: "Done" },
    // Variant used in issue/[id].tsx
    rootCauseFoundAlt:{ vi: "Đã có nguyên nhân",    en: "Root Cause Found" },
  },

  // ── Role labels ──────────────────────────────────────────────────────────────
  roles: {
    ADMIN:            { vi: "Quản trị viên",         en: "Admin" },
    OPERATOR:         { vi: "Vận hành",              en: "Operator" },
    QA:               { vi: "QA kiểm chất",          en: "QA Inspector" },
    LINE_LEADER:      { vi: "Trưởng chuyền",         en: "Line Leader" },
    TECHNOLOGY:       { vi: "Công nghệ",             en: "Technology" },
    DEPARTMENT_HEAD:  { vi: "Trưởng phòng",          en: "Department Head" },
    MAINTENANCE:      { vi: "Bảo trì",               en: "Maintenance" },
    DIRECTOR:         { vi: "Giám đốc",              en: "Director" },

    // Short/alternate role labels
    OPERATOR_short:   { vi: "Vận hành",              en: "Operator" },
    QA_short:         { vi: "QA",                    en: "QA" },
    LINE_LEADER_short:{ vi: "Trưởng line",           en: "Line Leader" },
    TECHNOLOGY_short: { vi: "Công nghệ",             en: "Technology" },
    MAINTENANCE_short:{ vi: "Bảo trì",               en: "Maintenance" },
    ADMIN_short:      { vi: "Admin",                 en: "Admin" },
    DIRECTOR_short:   { vi: "Giám đốc",              en: "Director" },

    // Profile variant
    OPERATOR_profile: { vi: "Nhân viên vận hành",    en: "Production Operator" },
    QA_profile:       { vi: "QA",                    en: "QA" },
    LINE_LEADER_profile:{ vi: "Trưởng line",         en: "Line Leader" },
    TECHNOLOGY_profile:{ vi: "Công nghệ",            en: "Technology" },
    MAINTENANCE_profile:{ vi: "Nhân viên bảo trì",   en: "Maintenance Staff" },
    ADMIN_profile:    { vi: "Admin",                 en: "Admin" },
    DIRECTOR_profile: { vi: "Giám đốc",              en: "Director" },
    DEPARTMENT_HEAD_profile: { vi: "Trưởng phòng ban", en: "Department Head" },
  },

  // ── Demo account descriptions (login screen) ─────────────────────────────────
  demoRoles: {
    operator:         { vi: "Nhân viên sản xuất",    en: "Production Worker" },
    qa:               { vi: "Kiểm soát chất lượng",  en: "Quality Control" },
    lineLeader:       { vi: "Quản lý dây chuyền",    en: "Line Manager" },
    technology:       { vi: "Hỗ trợ kỹ thuật",       en: "Technical Support" },
    manager:          { vi: "Trưởng phòng",           en: "Department Head" },
    maintenance:      { vi: "Nhân viên bảo trì",      en: "Maintenance Staff" },
  },
};

export default translations;
