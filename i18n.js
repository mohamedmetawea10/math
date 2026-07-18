// i18n.js - Localization tables and functions for ERP Platform

const TRANSLATIONS = {
  ar: {
    // Navigation
    appName: 'نظام إدارة مركز الرياضيات',
    teacherTitle: 'مستر محمد مطاوع',
    teacherProfile: 'معلم الرياضيات',
    navHome: 'الصفحة الرئيسية',
    navDashboard: 'لوحة التحكم',
    navStudents: 'إدارة الطلاب',
    navGroups: 'المجموعات والحصص',
    navAttendance: 'حضور ذكي (QR)',
    navGrades: 'إدارة الدرجات',
    navFinance: 'الماليات والاشتراكات',
    navNotifications: 'بوابة الإشعارات',
    navSettings: 'إعدادات النظام',
    navParentPortal: 'بوابة ولي الأمر',
    navTeachersMgmt: 'إدارة حسابات المعلمين',
    navParentsMgmt: 'إدارة حسابات أولياء الأمور',
    navAdminsMgmt: 'إدارة المديرين وصاحب السنتر',
    logout: 'تسجيل الخروج',
    
    // Login
    loginTitle: 'بوابة تسجيل دخول النظام',
    loginSubtitle: 'المنصة التعليمية للرياضيات - مستر محمد مطاوع',
    loginRoleAdmin: 'مدير النظام',
    loginRoleTeacher: 'المعلم',
    loginRoleParent: 'ولي الأمر',
    loginUsername: 'اسم المستخدم / رقم الهوية',
    loginPassword: 'كلمة المرور',
    loginButton: 'دخول آمن',
    loginError: 'اسم المستخدم أو كلمة المرور غير صحيحة أو الحساب غير نشط',
    
    // Stats Cards
    statTotalStudents: 'إجمالي الطلاب',
    statTotalTeachers: 'إجمالي المعلمين',
    statTotalClasses: 'إجمالي الصفوف',
    statTotalGroups: 'إجمالي المجموعات',
    statDailyIncome: 'الإيراد اليومي',
    statWeeklyIncome: 'الإيراد الأسبوعي',
    statMonthlyIncome: 'الإيراد الشهري',
    statAnnualIncome: 'الإيراد السنوي',
    statTotalExpenses: 'إجمالي المصروفات',
    statNetProfit: 'صافي الأرباح',
    
    // Quick Metrics
    currency: 'ج.م',
    student: 'طالب',
    teacher: 'معلم',
    group: 'مجموعة',
    session: 'حصص/شهر',
    
    // Dashboard Titles
    analyticsSection: 'تحليلات البيانات المتقدمة',
    revenueComparison: 'مقارنة الإيرادات والمصروفات',
    attendanceRatio: 'نسبة الحضور والغياب',
    studentDistribution: 'توزيع الطلاب حسب المراحل',
    recentActivity: 'أحدث عمليات النظام',
    recentLogins: 'حركة الدخول الأخيرة',
    
    // Student Management
    studentDb: 'قاعدة بيانات الطلاب',
    addStudent: 'إضافة طالب جديد',
    editStudent: 'تعديل بيانات الطالب',
    deleteStudent: 'حذف طالب',
    searchPlaceholder: 'ابحث بالاسم أو الرقم القومي أو الهاتف...',
    filterLevel: 'تصفية بالمرحلة',
    filterGroup: 'تصفية بالمجموعة',
    exportData: 'تصدير البيانات (CSV)',
    printCard: 'طباعة بطاقة الطالب',
    
    // Student Details
    fullName: 'الاسم بالكامل',
    studentId: 'كود الطالب',
    barcodeId: 'رقم الباركود',
    dob: 'تاريخ الميلاد',
    age: 'السن',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    schoolName: 'اسم المدرسة',
    academicLevel: 'المستوى الأكاديمي',
    subject: 'المادة الدراسية',
    assignedGroup: 'المجموعة الدراسية',
    monthlySessions: 'عدد الحصص شهرياً',
    subscriptionType: 'نوع الاشتراك',
    monthly: 'شهري',
    perSession: 'بالحصة',
    monthlyFee: 'قيمة الرسوم',
    registrationDate: 'تاريخ التسجيل',
    studentPhone: 'رقم هاتف الطالب',
    fatherPhone: 'رقم هاتف الأب',
    motherPhone: 'رقم هاتف الأم',
    address: 'العنوان بالتفصيل',
    notes: 'ملاحظات إضافية',
    awards: 'الجوائز والأوسمة',
    achievements: 'الإنجازات الموثقة',
    actions: 'الإجراءات',
    
    // Group Management
    groupManagement: 'إدارة الصفوف والمجموعات',
    addGroup: 'إضافة مجموعة جديدة',
    groupName: 'اسم المجموعة',
    maxStudents: 'السعة القصوى',
    weeklySchedule: 'الجدول الأسبوعي',
    sessionTime: 'موعد الحصة',
    enrolledStudents: 'المسجلون فعلياً',
    
    // Smart Attendance System
    attendanceSystem: 'نظام التحضير الذكي للطلاب',
    scanQrTitle: 'مسح الرمز السريع (QR Code)',
    scanBarcodeTitle: 'مسح الباركود (Barcode)',
    manualAttendanceTitle: 'التحضير اليدوي السريع',
    qrMethodCamera: 'كاميرا الهاتف المحمول',
    qrMethodWebcam: 'كاميرا الويب للكمبيوتر',
    qrMethodExternal: 'جهاز قارئ خارجي (USB)',
    barcodeInputPlaceholder: 'وجه قارئ الباركود أو اكتب يدوياً واضغط Enter...',
    attendanceStatus: 'حالة الحضور',
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    recordAttendanceBtn: 'تسجيل حضور يدوياً',
    scanSuccess: 'تم تسجيل الحضور بنجاح!',
    scanFailed: 'فشل المسح، الطالب غير مسجل أو الكود غير صالح',
    attendanceStats: 'إحصائيات حضور الطالب',
    totalSessions: 'إجمالي الحصص',
    presentCount: 'مرات الحضور',
    absentCount: 'مرات الغياب',
    lateCount: 'مرات التأخير',
    attendanceRatioText: 'نسبة الحضور',
    dailyAttendanceReport: 'تقرير الحضور اليومي',
    weeklyAttendanceReport: 'تقرير الحضور الأسبوعي',
    monthlyAttendanceReport: 'تقرير الحضور الشهري',
    yearlyAttendanceReport: 'تقرير الحضور السنوي',
    
    // Grades Management
    gradesSystem: 'نظام إدارة درجات الامتحانات والواجبات',
    addExam: 'إضافة اختبار جديد',
    examTitle: 'عنوان الاختبار / الواجب',
    examType: 'النوع',
    quiz: 'اختبار قصير (Quiz)',
    homework: 'واجب منزلي (Homework)',
    exam: 'امتحان شهري (Exam)',
    assignment: 'مهمة دراسية (Assignment)',
    finalExam: 'امتحان نهائي (Final Exam)',
    totalMarks: 'الدرجة الكلية',
    obtainedScore: 'الدرجة الحاصل عليها',
    studentRanking: 'ترتيب الطالب في المجموعة',
    performanceChart: 'مخطط أداء الطالب',
    recordGrade: 'تسجيل الدرجات للطلاب',
    
    // Financial Management
    financialSystem: 'الإدارة المالية والمصروفات',
    addTransaction: 'تسجيل معاملة مالية',
    income: 'إيراد (Income)',
    expense: 'مصروف (Expense)',
    category: 'التصنيف',
    rent: 'إيجار القاعة',
    printing: 'طباعة وتصوير أوراق',
    internet: 'اشتراك الإنترنت والكهرباء',
    monthlyFees: 'اشتراكات الطلاب',
    other: 'أخرى',
    amount: 'المبلغ',
    remainingBalance: 'المبالغ المتبقية على الطلاب',
    paymentStatus: 'حالة الدفع',
    paid: 'مدفوع بالكامل',
    unpaid: 'غير مدفوع',
    partiallyPaid: 'مدفوع جزئياً',
    profitAnalysis: 'تحليل الأرباح والخسائر',
    
    // WhatsApp Automatic Notification System
    whatsappSystem: 'نظام الإشعارات الآلي عبر الواتساب',
    whatsappStatus: 'حالة الاتصال بالبوابة',
    connected: 'متصل بنجاح',
    disconnected: 'غير متصل بالبوابة',
    messageTemplate: 'قوالب الرسائل الجاهزة',
    templateAttendance: 'رسالة تسجيل الحضور',
    templateAbsence: 'رسالة تسجيل الغياب',
    templateGrades: 'رسالة نشر الدرجات',
    templatePayment: 'رسالة استلام الدفع',
    templatePaymentOverdue: 'رسالة الدفع المتأخر',
    whatsappLog: 'سجل الرسائل المرسلة',
    recipientPhone: 'هاتف المستلم',
    messageContent: 'محتوى الرسالة المرسلة',
    deliveryStatus: 'حالة التسليم',
    sent: 'تم الإرسال',
    delivered: 'تم التسليم وقراءته',
    failed: 'فشل الإرسال',
    
    // Settings
    settingsSystem: 'إعدادات النظام العامة',
    systemLanguage: 'لغة الواجهة الافتراضية',
    arabic: 'العربية (RTL)',
    english: 'الإنجليزية (LTR)',
    systemTheme: 'مظهر لوحة التحكم',
    lightMode: 'المظهر المضيء (Light)',
    darkMode: 'المظهر الداكن (Dark)',
    userPermissions: 'صلاحيات المستخدمين والمديرين',
    backupRestore: 'النسخ الاحتياطي واستعادة البيانات',
    createBackup: 'تصدير نسخة احتياطية (JSON)',
    restoreBackup: 'استيراد نسخة احتياطية',
    academicYearSetting: 'العام الدراسي النشط',
    saveSettings: 'حفظ الإعدادات بنجاح!',
    
    // Parent Portal
    parentPortalTitle: 'بوابة أولياء الأمور المتابعة',
    parentSelectStudent: 'اختر الابن للمتابعة',
    parentAttendanceTab: 'سجل الغياب والحضور للابن',
    parentGradesTab: 'نتائج الاختبارات والدرجات للابن',
    parentPaymentsTab: 'حالة المصاريف والمدفوعات للابن',
    parentNotificationsTab: 'الإشعارات والتنبيهات الموجهة',
    parentWelcome: 'مرحباً بك ولي أمر الطالب: ',
    
    // Academic levels (Arabic strict requirement)
    levelPrep1: 'الأول إعدادي',
    levelPrep2: 'الثاني إعدادي',
    levelPrep3: 'الثالث إعدادي',
    levelSec1: 'الأول الثانوي',
    levelSec2: 'الثاني الثانوي',
    levelSec3: 'الثالث الثانوي',
    
    // Primary Levels (English strictly required)
    levelKG1: 'KG1',
    levelKG2: 'KG2',
    levelG1: 'Grade 1',
    levelG2: 'Grade 2',
    levelG3: 'Grade 3',
    levelG4: 'Grade 4',
    levelG5: 'Grade 5',
    levelG6: 'Grade 6',
    
    // Branding Elements
    teacherIntroText: 'معلم رياضيات للمرحلتين الإعدادية والثانوية، أؤمن بتبسيط المفاهيم الرياضية المعقدة وبناء العقول لتجاوز تحديات التفكير المنطقي.',
    teacherLogoText: 'Math Zone Academy',
    contactCard: 'بطاقة الاتصال المباشر',
    whatsAppSendTest: 'إرسال رسالة اختبار',

    // New management fields
    addTeacher: 'تسجيل معلم جديد',
    editTeacher: 'تعديل بيانات المعلم',
    addParent: 'تسجيل ولي أمر جديد',
    editParent: 'تعديل بيانات ولي الأمر',
    addAdmin: 'إضافة مدير جديد',
    editAdmin: 'تعديل بيانات المدير',
    addGroup: 'إضافة مجموعة جديدة',
    editGroup: 'تعديل بيانات المجموعة',
    linkedStudent: 'الطالب المرتبط',
    teacherUsername: 'اسم مستخدم المعلم',
    parentUsername: 'اسم مستخدم ولي الأمر',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    password: 'كلمة المرور',
    email: 'البريد الإلكتروني'
  },
  en: {
    // Navigation
    appName: 'Math Center Management System',
    teacherTitle: 'Mr. Mohamed Motawea',
    teacherProfile: 'Mathematics Teacher',
    navHome: 'Home Page',
    navDashboard: 'Dashboard',
    navStudents: 'Student Management',
    navGroups: 'Classes & Groups',
    navAttendance: 'Smart Attendance (QR)',
    navGrades: 'Grades & Exams',
    navFinance: 'Financial Management',
    navNotifications: 'WhatsApp Gateway',
    navSettings: 'System Settings',
    navParentPortal: 'Parent Portal',
    navTeachersMgmt: 'Manage Teachers Accounts',
    navParentsMgmt: 'Manage Parents Accounts',
    navAdminsMgmt: 'Manage Administrators / Center Owner',
    logout: 'Logout',
    
    // Login
    loginTitle: 'System Authentication Portal',
    loginSubtitle: 'Mathematics Center - Mr. Mohamed Motawea',
    loginRoleAdmin: 'Administrator',
    loginRoleTeacher: 'Teacher',
    loginRoleParent: 'Parent / Guardian',
    loginUsername: 'Username / System ID',
    loginPassword: 'Password',
    loginButton: 'Secure Login',
    loginError: 'Incorrect credentials or deactivated account',
    
    // Stats Cards
    statTotalStudents: 'Total Students',
    statTotalTeachers: 'Total Teachers',
    statTotalClasses: 'Total Classes',
    statTotalGroups: 'Total Groups',
    statDailyIncome: 'Daily Income',
    statWeeklyIncome: 'Weekly Income',
    statMonthlyIncome: 'Monthly Income',
    statAnnualIncome: 'Annual Income',
    statTotalExpenses: 'Total Expenses',
    statNetProfit: 'Net Profit',
    
    // Quick Metrics
    currency: 'EGP',
    student: 'Student',
    teacher: 'Teacher',
    group: 'Group',
    session: 'Sessions/mo',
    
    // Dashboard Titles
    analyticsSection: 'Advanced Data Analytics',
    revenueComparison: 'Revenue vs. Expenses Analysis',
    attendanceRatio: 'Attendance & Absence Ratios',
    studentDistribution: 'Student Level Distribution',
    recentActivity: 'Recent Actions Log',
    recentLogins: 'Recent Security Logins',
    
    // Student Management
    studentDb: 'Student Directory',
    addStudent: 'Add Student Profile',
    editStudent: 'Edit Student Profile',
    deleteStudent: 'Delete Student',
    searchPlaceholder: 'Search name, barcode ID or phone number...',
    filterLevel: 'Filter by Academic Level',
    filterGroup: 'Filter by Active Group',
    exportData: 'Export Directory (CSV)',
    printCard: 'Print Student Profile ID',
    
    // Student Details
    fullName: 'Full Name',
    studentId: 'Student ID',
    barcodeId: 'Barcode ID',
    dob: 'Date of Birth',
    age: 'Age',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    schoolName: 'School Name',
    academicLevel: 'Academic Level',
    subject: 'Subject',
    assignedGroup: 'Group Name',
    monthlySessions: 'Monthly Session Count',
    subscriptionType: 'Subscription Type',
    monthly: 'Monthly Base',
    perSession: 'Per Session Base',
    monthlyFee: 'Tuition Fee Amount',
    registrationDate: 'Registration Date',
    studentPhone: 'Student Phone Number',
    fatherPhone: 'Father Phone Number',
    motherPhone: 'Mother Phone Number',
    address: 'Physical Address',
    notes: 'Developmental Notes',
    awards: 'Awards & Honors',
    achievements: 'Notable Achievements',
    actions: 'Actions',
    
    // Group Management
    groupManagement: 'Classes & Groups Management',
    addGroup: 'Add Study Group',
    groupName: 'Group Name',
    maxStudents: 'Max Capacity',
    weeklySchedule: 'Weekly Schedule',
    sessionTime: 'Session Time Slot',
    enrolledStudents: 'Enrolled Count',
    
    // Smart Attendance System
    attendanceSystem: 'Smart Attendance Center',
    scanQrTitle: 'Scan QR Code Attendance',
    scanBarcodeTitle: 'Scan Barcode Attendance',
    manualAttendanceTitle: 'Manual Session Check-in',
    qrMethodCamera: 'Mobile Device Camera',
    qrMethodWebcam: 'Computer Webcam Integration',
    qrMethodExternal: 'External USB Device Reader',
    barcodeInputPlaceholder: 'Ready to scan barcode or type barcode manual...',
    attendanceStatus: 'Attendance Status',
    present: 'Present',
    absent: 'Absent',
    late: 'Late Check-in',
    recordAttendanceBtn: 'Check-in Student',
    scanSuccess: 'Attendance logged successfully!',
    scanFailed: 'Scan failed. Code invalid or student unregistered.',
    attendanceStats: 'Attendance Reports',
    totalSessions: 'Total Sessions',
    presentCount: 'Present Days',
    absentCount: 'Absent Days',
    lateCount: 'Late Days',
    attendanceRatioText: 'Attendance Rate',
    dailyAttendanceReport: 'Daily attendance',
    weeklyAttendanceReport: 'Weekly attendance',
    monthlyAttendanceReport: 'Monthly attendance',
    yearlyAttendanceReport: 'Yearly attendance',
    
    // Grades Management
    gradesSystem: 'Grades & Assessment Center',
    addExam: 'Record Exam / Quiz Score',
    examTitle: 'Assessment Description',
    examType: 'Category Type',
    quiz: 'Quick Quiz',
    homework: 'Homework Task',
    exam: 'Monthly Term Exam',
    assignment: 'Practical Assignment',
    finalExam: 'Final Year Exam',
    totalMarks: 'Total Max Marks',
    obtainedScore: 'Obtained Student Score',
    studentRanking: 'Group Class Rank',
    performanceChart: 'Historical Progress Chart',
    recordGrade: 'Publish Scores',
    
    // Financial Management
    financialSystem: 'Financial Ledger & Expenses',
    addTransaction: 'Log Transaction Entry',
    income: 'Income Entry',
    expense: 'Expense Output',
    category: 'Ledger Category',
    rent: 'Hall Rent',
    printing: 'Materials & Booklets',
    internet: 'Center Utilities',
    monthlyFees: 'Student Fees Collection',
    other: 'General Admin Outgoings',
    amount: 'EGP Amount',
    remainingBalance: 'Remaining Balances (Unpaid)',
    paymentStatus: 'Payment Status',
    paid: 'Fully Cleared',
    unpaid: 'Outstanding Debt',
    partiallyPaid: 'Partially Cleared',
    profitAnalysis: 'Profit & Margins Report',
    
    // WhatsApp Automatic Notification System
    whatsappSystem: 'Automated WhatsApp Gateway Integrations',
    whatsappStatus: 'WhatsApp API Gateway Status',
    connected: 'Active Connected Gateway',
    disconnected: 'Inactive Connection Status',
    messageTemplate: 'Messaging Templates Control',
    templateAttendance: 'Student Attended Text Template',
    templateAbsence: 'Student Absent Alert Template',
    templateGrades: 'Assessment Grades Text Template',
    templatePayment: 'Payment Invoice Text Template',
    templatePaymentOverdue: 'Debt Overdue Text Template',
    whatsappLog: 'Message Gateway Sent Logs',
    recipientPhone: 'Recipient Phone',
    messageContent: 'SMS / Text Body Content',
    deliveryStatus: 'Delivery Status',
    sent: 'Dispatched Gateway',
    delivered: 'Read Receipt Received',
    failed: 'Dispatched Failed',
    
    // Settings
    settingsSystem: 'ERP Administration Console',
    systemLanguage: 'Dashboard Default Language',
    arabic: 'Arabic (RTL) - العربية',
    english: 'English (LTR) - English',
    systemTheme: 'User Dashboard Color Palette',
    lightMode: 'Premium Light Canvas',
    darkMode: 'Premium Slate Dark Canvas',
    userPermissions: 'Role Permissions & Access Keys',
    backupRestore: 'Data Security Backup & Restore',
    createBackup: 'Download JSON System Backup',
    restoreBackup: 'Upload ERP Restore File',
    academicYearSetting: 'Active Educational Year',
    saveSettings: 'System variables saved successfully!',
    
    // Parent Portal
    parentPortalTitle: 'Parent Dashboard Hub',
    parentSelectStudent: 'Select Student Profile',
    parentAttendanceTab: 'Attendance Tracker',
    parentGradesTab: 'Assessment Gradebook',
    parentPaymentsTab: 'Financial Transactions',
    parentNotificationsTab: 'WhatsApp Notification Logs',
    parentWelcome: 'Welcome, parent of student: ',
    
    // Academic levels (Arabic strict requirement)
    levelPrep1: 'الأول إعدادي',
    levelPrep2: 'الثاني إعدادي',
    levelPrep3: 'الثالث إعدادي',
    levelSec1: 'الأول الثانوي',
    levelSec2: 'الثاني الثانوي',
    levelSec3: 'الثالث الثانوي',
    
    // Primary Levels (English strictly required)
    levelKG1: 'KG1',
    levelKG2: 'KG2',
    levelG1: 'Grade 1',
    levelG2: 'Grade 2',
    levelG3: 'Grade 3',
    levelG4: 'Grade 4',
    levelG5: 'Grade 5',
    levelG6: 'Grade 6',
    
    // Branding Elements
    teacherIntroText: 'Mathematics Teacher for Prep & Secondary classes. Dedicated to building logical minds, resolving abstract algebra, and developing mathematical thinking.',
    teacherLogoText: 'Math Zone Academy',
    contactCard: 'Teacher Profile Info',
    whatsAppSendTest: 'Send Test Broadcast',

    // New management fields
    addTeacher: 'Register New Teacher',
    editTeacher: 'Edit Teacher Details',
    addParent: 'Register New Parent',
    editParent: 'Edit Parent Details',
    linkedStudent: 'Linked Student',
    teacherUsername: 'Teacher Username',
    parentUsername: 'Parent Username',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    password: 'Password',
    email: 'Email Address',
    addTeacher: 'Register New Teacher',
    editTeacher: 'Edit Teacher Account',
    addParent: 'Register New Parent',
    editParent: 'Edit Parent Account',
    addAdmin: 'Add New Administrator',
    editAdmin: 'Edit Administrator',
    addGroup: 'Add New Group',
    editGroup: 'Edit Group'
  }
};

class I18nManager {
  constructor(defaultLang = 'ar') {
    this.currentLang = localStorage.getItem('motawea_math_erp_lang') || defaultLang;
    this.dictionary = TRANSLATIONS;
    document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLang;
  }

  setLang(lang) {
    if (lang !== 'ar' && lang !== 'en') return;
    this.currentLang = lang;
    localStorage.setItem('motawea_math_erp_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    this.translateDOM();
  }

  translate(key) {
    return this.dictionary[this.currentLang][key] || key;
  }

  translateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.translate(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.innerHTML = translation;
      }
    });
  }
}

const i18n = new I18nManager('ar');
window.i18nInstance = i18n; // Expose globally
