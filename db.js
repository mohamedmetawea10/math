// db.js - Mock Database for Mr. Mohamed Motawea's Educational Center ERP

const INITIAL_DB = {
  settings: {
    language: 'ar', // Default Arabic
    theme: 'light', // Default Light Mode
    whatsappEnabled: true,
    whatsappApiKey: 'mock_key_motawea_math_2026',
    academicYear: '2026-2027',
    attendanceBeep: true,
    notificationTypes: {
      attendance: true,
      absence: true,
      grades: true,
      payments: true,
      announcements: true
    }
  },
  siteSettings: {
    centerNameAr: 'أكاديمية Math Zone',
    centerNameEn: 'Math Zone Academy',
    teacherName: 'أ. محمد مطاوع',
    teacherTitle: 'معلم الرياضيات للمرحلتين الإعدادية والثانوية',
    teacherBio: 'معلم رياضيات ذو خبرة تفوق 10 سنوات، متخصص في مساعدة الطلاب على التميز في المفاهيم الرياضية والتفكير التحليلي والمنطقي.',
    teacherPhone: '01021229847',
    teacherEmail: 'motawea.math@gmail.com'
  },
  posts: [
    {
      id: 'post_1',
      title: 'بداية حجز مجموعات العام الدراسي الجديد 2026-2027',
      content: 'تعلن الأكاديمية عن فتح باب الحجز لمجموعات الرياضيات لجميع المراحل الإعدادية والثانوية للعام الدراسي الجديد. الأماكن محدودة جداً بأسبقية الحجز.',
      date: '2026-07-01',
      image: ''
    },
    {
      id: 'post_2',
      title: 'تكريم الطلاب المتفوقين في اختبارات شهر يونيو',
      content: 'يهنئ مستر محمد مطاوع الطلاب الذين حصلوا على الدرجات النهائية في امتحانات شهر يونيو ويتمنى لهم دوام التوفيق والتفوق.',
      date: '2026-06-30',
      image: ''
    }
  ],
  admins: [
    {
      id: 'a00001',
      name: 'أ. محمد مطاوع',
      username: 'admin',
      password: '123',
      phone: '01021229847',
      email: 'motawea.math@gmail.com',
      active: true
    }
  ],
  teachers: [
    {
      id: 't00101',
      username: 'teacher1',
      password: '123',
      nameEn: 'Mr. Mohamed Motawea',
      nameAr: 'أ. محمد مطاوع',
      subjectEn: 'Mathematics',
      subjectAr: 'الرياضيات',
      phone: '01021229847',
      email: 'motawea.math@gmail.com',
      avatar: 'teacher_photo.jpg', // Use local asset if possible
      introEn: 'Mathematics teacher with 10+ years of experience helping students excel in mathematical concepts and analytical thinking.',
      introAr: 'معلم رياضيات ذو خبرة تفوق 10 سنوات، متخصص في مساعدة الطلاب على التميز في المفاهيم الرياضية والتفكير التحليلي.',
      active: true,
      groups: ['G-P1', 'G-P2', 'G-P3', 'G-S1', 'G-S2', 'G-S3'] // assigned groups
    },
    {
      id: 't00102',
      username: 'sarah_math',
      password: '123',
      nameEn: 'Mrs. Sarah Ahmed',
      nameAr: 'أ. سارة أحمد',
      subjectEn: 'Math (Primary)',
      subjectAr: 'ماث (ابتدائي)',
      phone: '01099887766',
      email: 'sarah.math@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      introEn: 'Primary level mathematics specialist, expert in gamified learning environments.',
      introAr: 'أخصائية رياضيات للمرحلة الابتدائية، خبيرة في بيئات التعلم القائمة على الألعاب.',
      active: true,
      groups: ['G-KG1', 'G-G1', 'G-G4', 'G-G6']
    }
  ],
  parents: [
    {
      id: 'p00001',
      username: 'parent1',
      password: '123',
      name: 'محمود علي عبد الرحمن',
      phone: '01123456789',
      email: 'mahmoud.parent@gmail.com',
      studentIds: ['s00001'], // Linked to Ahmad Mahmoud Ali
      active: true
    },
    {
      id: 'p00002',
      username: 'parent_sara',
      password: '123',
      name: 'محمد يوسف الصاوي',
      phone: '01011223344',
      email: 'youssef.parent@gmail.com',
      studentIds: ['s00002'], // Linked to Sara Mohamed yosef
      active: true
    }
  ],
  groups: [
    // Primary Levels
    { id: 'G-KG1', nameEn: 'KG1 - Alpha', nameAr: 'تمهيدي 1 - ألفا', level: ['KG1'], subject: 'Math', teacherId: 't00102', maxStudents: 20, timeSlot: 'Sun, Tue - 03:00 PM', fee: 150, sessionCount: 8 },
    { id: 'G-G1', nameEn: 'Grade 1 - Beta', nameAr: 'الصف الأول - بيتا', level: ['Grade 1'], subject: 'Math', teacherId: 't00102', maxStudents: 25, timeSlot: 'Sun, Tue - 04:30 PM', fee: 200, sessionCount: 8 },
    { id: 'G-G4', nameEn: 'Grade 4 - Gamma', nameAr: 'الصف الرابع - جاما', level: ['Grade 4'], subject: 'Math', teacherId: 't00102', maxStudents: 30, timeSlot: 'Mon, Thu - 03:00 PM', fee: 250, sessionCount: 8 },
    { id: 'G-G6', nameEn: 'Grade 6 - Delta', nameAr: 'الصف السادس - دلتا', level: ['Grade 6'], subject: 'Math', teacherId: 't00102', maxStudents: 30, timeSlot: 'Mon, Thu - 04:30 PM', fee: 280, sessionCount: 8 },
    
    // Prep Levels (Arabic Names strictly as requested)
    { id: 'G-P1', nameEn: '1st Prep - Math', nameAr: 'الأول إعدادي - رياضيات', level: ['الأول إعدادي'], subject: 'Mathematics', teacherId: 't00101', maxStudents: 40, timeSlot: 'Sat, Wed - 04:00 PM', fee: 300, sessionCount: 8 },
    { id: 'G-P2', nameEn: '2nd Prep - Math', nameAr: 'الثاني إعدادي - رياضيات', level: ['الثاني إعدادي'], subject: 'Mathematics', teacherId: 't00101', maxStudents: 40, timeSlot: 'Sat, Wed - 06:00 PM', fee: 320, sessionCount: 8 },
    { id: 'G-P3', nameEn: '3rd Prep - Math', nameAr: 'الثالث إعدادي - رياضيات', level: ['الثالث إعدادي'], subject: 'Mathematics', teacherId: 't00101', maxStudents: 50, timeSlot: 'Sun, Tue - 06:00 PM', fee: 350, sessionCount: 8 },
    
    // Sec Levels (Arabic Names strictly as requested)
    { id: 'G-S1', nameEn: '1st Sec - Algebra', nameAr: 'الأول الثانوي - جبر', level: ['الأول الثانوي'], subject: 'Mathematics', teacherId: 't00101', maxStudents: 60, timeSlot: 'Sat - 08:00 PM', fee: 400, sessionCount: 4 },
    { id: 'G-S2', nameEn: '2nd Sec - Calculus', nameAr: 'الثاني الثانوي - تفاضل', level: ['الثاني الثانوي'], subject: 'Mathematics', teacherId: 't00101', maxStudents: 60, timeSlot: 'Mon - 07:00 PM', fee: 450, sessionCount: 4 },
    { id: 'G-S3', nameEn: '3rd Sec - Applied Math', nameAr: 'الثالث الثانوي - رياضيات تطبيقية', level: ['الثالث الثانوي'], subject: 'Mathematics', teacherId: 't00101', maxStudents: 80, timeSlot: 'Tue, Fri - 08:00 PM', fee: 600, sessionCount: 8 }
  ],
  students: [
    {
      id: 's00001',
      barcode: 's00001',
      name: 'أحمد محمود علي',
      dob: '2009-05-14',
      gender: 'male',
      school: 'مدرسة المتفوقين الرسمية',
      academicLevel: 'الثالث إعدادي',
      subject: 'Mathematics',
      groupId: 'G-P3',
      sessionCount: 8,
      subscriptionType: 'monthly',
      monthlyFee: 350,
      registrationDate: '2026-02-10',
      studentPhone: '01012345678',
      fatherPhone: '01123456789',
      motherPhone: '01234567890',
      address: 'طنطا، شارع البحر الرئيسي',
      notes: 'ممتاز في الجبر والهندسة، يشارك بانتظام',
      awards: ['كأس العبقري في مسابقة مارس', 'شهادة تقدير الواجب'],
      achievements: ['المركز الأول في امتحان نصف العام'],
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
    },
    {
      id: 's00002',
      barcode: 's00002',
      name: 'سارة محمد يوسف',
      dob: '2008-11-22',
      gender: 'female',
      school: 'مدرسة اللغات الحديثة',
      academicLevel: 'الأول الثانوي',
      subject: 'Mathematics',
      groupId: 'G-S1',
      sessionCount: 4,
      subscriptionType: 'monthly',
      monthlyFee: 400,
      registrationDate: '2026-03-01',
      studentPhone: '01511223344',
      fatherPhone: '01011223344',
      motherPhone: '01211223344',
      address: 'طنطا، بجوار الاستاد الرياضي',
      notes: 'تحتاج تركيز إضافي في الهندسة الفراغية',
      awards: ['نجم الأسبوع لشهر أبريل'],
      achievements: ['تحسن ملحوظ بنسبة 20% في الاختبار الثاني'],
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    {
      id: 's00003',
      barcode: 's00003',
      name: 'عمر ياسر عبد الرحمن',
      dob: '2012-01-05',
      gender: 'male',
      school: 'مدرسة النيل المصرية',
      academicLevel: 'Grade 6',
      subject: 'Math',
      groupId: 'G-G6',
      sessionCount: 8,
      subscriptionType: 'per-session',
      monthlyFee: 280,
      registrationDate: '2026-04-15',
      studentPhone: '01033445566',
      fatherPhone: '01066554433',
      motherPhone: '01122334455',
      address: 'المحلة الكبرى، شارع شكري القواتلي',
      notes: 'سريع الفهم للمسائل الحسابية الذهنية',
      awards: [],
      achievements: [],
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
    },
    {
      id: 's00004',
      barcode: 's00004',
      name: 'مريم كريم محمود',
      dob: '2007-09-30',
      gender: 'female',
      school: 'مدرسة سان مارك المشتركة',
      academicLevel: 'الثالث الثانوي',
      subject: 'Mathematics',
      groupId: 'G-S3',
      sessionCount: 8,
      subscriptionType: 'monthly',
      monthlyFee: 600,
      registrationDate: '2025-09-01',
      studentPhone: '01077889900',
      fatherPhone: '01277889900',
      motherPhone: '01177889900',
      address: 'كفر الزيات، شارع الجيش',
      notes: 'طالبة ممتازة، تستعد للامتحان النهائي بجدية',
      awards: ['درع التميز في الرياضيات التطبيقية'],
      achievements: ['الدرجة النهائية في اختبار التفاضل والتكامل التجريبي'],
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    },
    {
      id: 's00005',
      barcode: 's00005',
      name: 'عبد الله طارق السيد',
      dob: '2010-03-12',
      gender: 'male',
      school: 'مدرسة المستقبل المتميزة',
      academicLevel: 'الثاني إعدادي',
      subject: 'Mathematics',
      groupId: 'G-P2',
      sessionCount: 8,
      subscriptionType: 'monthly',
      monthlyFee: 320,
      registrationDate: '2026-01-20',
      studentPhone: '01055667788',
      fatherPhone: '01155667788',
      motherPhone: '01255667788',
      address: 'طنطا، حي قحافة',
      notes: 'كثير الحركة ولكنه متفوق، يحتاج توجيه مستمر',
      awards: ['طالب الشهر المتميز'],
      achievements: [],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    }
  ],
  attendance: [
    { id: 'ATT001', studentId: 's00001', groupId: 'G-P3', date: '2026-07-05', time: '18:05', status: 'present', scanMethod: 'QR Code' },
    { id: 'ATT002', studentId: 's00002', groupId: 'G-S1', date: '2026-07-04', time: '20:15', status: 'late', scanMethod: 'Barcode' },
    { id: 'ATT003', studentId: 's00003', groupId: 'G-G6', date: '2026-07-06', time: '16:30', status: 'present', scanMethod: 'Manual' },
    { id: 'ATT004', studentId: 's00004', groupId: 'G-S3', date: '2026-07-07', time: '19:55', status: 'present', scanMethod: 'QR Code' },
    { id: 'ATT005', studentId: 's00005', groupId: 'G-P2', date: '2026-07-08', time: '', status: 'absent', scanMethod: '' },
    { id: 'ATT006', studentId: 's00001', groupId: 'G-P3', date: '2026-07-01', time: '17:58', status: 'present', scanMethod: 'QR Code' },
    { id: 'ATT007', studentId: 's00002', groupId: 'G-S1', date: '2026-06-27', time: '20:02', status: 'present', scanMethod: 'Barcode' },
    { id: 'ATT008', studentId: 's00003', groupId: 'G-G6', date: '2026-07-02', time: '16:35', status: 'present', scanMethod: 'Manual' },
    { id: 'ATT009', studentId: 's00004', groupId: 'G-S3', date: '2026-07-03', time: '', status: 'absent', scanMethod: '' },
    { id: 'ATT010', studentId: 's00005', groupId: 'G-P2', date: '2026-07-01', time: '18:10', status: 'late', scanMethod: 'Barcode' }
  ],
  grades: [
    { id: 'GRD001', studentId: 's00001', title: 'Monthly Quiz 1', type: 'Quiz', totalMarks: 20, score: 19, date: '2026-06-15', notes: 'Excellent logic' },
    { id: 'GRD002', studentId: 's00001', title: 'Homework - Algebra', type: 'Homework', totalMarks: 10, score: 10, date: '2026-06-20', notes: 'All clear' },
    { id: 'GRD003', studentId: 's00001', title: 'Mid-term Exam', type: 'Exam', totalMarks: 100, score: 95, date: '2026-07-01', notes: 'Ranked 1st in group' },
    
    { id: 'GRD004', studentId: 's00002', title: 'Monthly Quiz 1', type: 'Quiz', totalMarks: 20, score: 15, date: '2026-06-15', notes: 'Need more revision' },
    { id: 'GRD005', studentId: 's00002', title: 'Homework - Functions', type: 'Homework', totalMarks: 10, score: 8, date: '2026-06-20', notes: 'Messy presentation' },
    { id: 'GRD006', studentId: 's00002', title: 'Mid-term Exam', type: 'Exam', totalMarks: 100, score: 82, date: '2026-07-01', notes: 'Good attempt' },
    
    { id: 'GRD007', studentId: 's00003', title: 'Monthly Quiz 1', type: 'Quiz', totalMarks: 20, score: 18, date: '2026-06-15', notes: 'Great job' },
    { id: 'GRD008', studentId: 's00003', title: 'Homework - Decimals', type: 'Homework', totalMarks: 10, score: 9, date: '2026-06-20', notes: 'Nice work' },
    
    { id: 'GRD009', studentId: 's00004', title: 'Monthly Quiz 1', type: 'Quiz', totalMarks: 20, score: 20, date: '2026-06-15', notes: 'Perfect score!' },
    { id: 'GRD010', studentId: 's00004', title: 'Mid-term Exam', type: 'Exam', totalMarks: 100, score: 100, date: '2026-07-01', notes: 'Exceptional answers' },
    
    { id: 'GRD011', studentId: 's00005', title: 'Monthly Quiz 1', type: 'Quiz', totalMarks: 20, score: 14, date: '2026-06-15', notes: 'Needs improvement' }
  ],
  transactions: [
    // Incomes
    { id: 'TX001', type: 'income', amount: 350, category: 'monthly-fees', date: '2026-07-01', studentId: 's00001', desc: 'Subscription July 2026' },
    { id: 'TX002', type: 'income', amount: 400, category: 'monthly-fees', date: '2026-07-02', studentId: 's00002', desc: 'Subscription July 2026' },
    { id: 'TX003', type: 'income', amount: 280, category: 'monthly-fees', date: '2026-07-03', studentId: 's00003', desc: 'Subscription July 2026' },
    { id: 'TX004', type: 'income', amount: 600, category: 'monthly-fees', date: '2026-07-01', studentId: 's00004', desc: 'Subscription July 2026' },
    { id: 'TX005', type: 'income', amount: 320, category: 'monthly-fees', date: '2026-07-02', studentId: 's00005', desc: 'Subscription July 2026' },
    // Earlier months income
    { id: 'TX006', type: 'income', amount: 1950, category: 'monthly-fees', date: '2026-06-01', studentId: '', desc: 'Total Bulk Fees June 2026' },
    { id: 'TX007', type: 'income', amount: 1800, category: 'monthly-fees', date: '2026-05-01', studentId: '', desc: 'Total Bulk Fees May 2026' },
    { id: 'TX008', type: 'income', amount: 1700, category: 'monthly-fees', date: '2026-04-01', studentId: '', desc: 'Total Bulk Fees April 2026' },
    
    // Expenses
    { id: 'TX009', type: 'expense', amount: 300, category: 'rent', date: '2026-07-01', studentId: '', desc: 'Hall rent partial payment' },
    { id: 'TX010', type: 'expense', amount: 100, category: 'printing', date: '2026-07-03', studentId: '', desc: 'Printing algebra booklets' },
    { id: 'TX011', type: 'expense', amount: 50, category: 'internet', date: '2026-07-04', studentId: '', desc: 'Center WiFi subscription' },
    { id: 'TX012', type: 'expense', amount: 250, category: 'rent', date: '2026-06-01', studentId: '', desc: 'Hall rent June 2026' },
    { id: 'TX013', type: 'expense', amount: 150, category: 'printing', date: '2026-06-10', studentId: '', desc: 'Printing mid-term booklets' }
  ],
  whatsappLogs: [
    { id: 'MSG001', studentId: 's00001', recipient: '01123456789', type: 'attendance', message: 'Dear Parent, your child Ahmed Mahmoud Ali attended today\'s session successfully. Time: 18:05.', date: '2026-07-05 18:05:12', status: 'delivered' },
    { id: 'MSG002', studentId: 's00002', recipient: '01011223344', type: 'attendance', message: 'Dear Parent, your child Sara Mohamed yosef was marked late. Time: 20:15.', date: '2026-07-04 20:15:30', status: 'delivered' },
    { id: 'MSG003', studentId: 's00005', recipient: '01155667788', type: 'absence', message: 'Dear Parent, your child Abd Allah Tarek El-Sayed was absent from today\'s session.', date: '2026-07-08 19:00:00', status: 'sent' }
  ]
};

// Database persistence wrapper
class ERPDatabase {
  constructor() {
    this.storageKey = 'motawea_math_erp_db';
    this.data = this.load();

    // Listen for changes from other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.data = this.load();
        window.dispatchEvent(new CustomEvent('db_updated', { detail: { source: 'external' } }));
      }
    });
  }

  load() {
    // If the database in localStorage contains old IDs (e.g. "ST202601"), we clear it to avoid data corruption.
    const raw = localStorage.getItem(this.storageKey);
    if (raw && raw.includes('ST202601')) {
      localStorage.removeItem(this.storageKey);
      this.saveData(INITIAL_DB);
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }

    if (!raw) {
      this.saveData(INITIAL_DB);
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }
    try {
      const parsed = JSON.parse(raw);
      // Migration: Add admins list if not existing
      if (!parsed.admins) {
        parsed.admins = JSON.parse(JSON.stringify(INITIAL_DB.admins));
      }
      if (!parsed.siteSettings) {
        parsed.siteSettings = JSON.parse(JSON.stringify(INITIAL_DB.siteSettings));
      }
      if (!parsed.posts) {
        parsed.posts = JSON.parse(JSON.stringify(INITIAL_DB.posts));
      }
      if (!parsed.parents) {
        parsed.parents = JSON.parse(JSON.stringify(INITIAL_DB.parents));
      } else {
        // Migrate parent studentIds array
        parsed.parents.forEach(p => {
          if (!p.studentIds) {
            p.studentIds = p.studentId ? [p.studentId] : [];
          }
        });
      }
      if (parsed.groups) {
        parsed.groups.forEach(g => {
          if (!Array.isArray(g.level)) {
            g.level = g.level ? [g.level] : [];
          }
        });
      }
      if (parsed.teachers && parsed.teachers[0]) {
        parsed.teachers[0].avatar = './teacher_photo.jpg';
        if (!parsed.teachers[0].username) {
          parsed.teachers[0].username = 'teacher1';
          parsed.teachers[0].password = '123';
          parsed.teachers[0].active = true;
        }
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing stored database, reverting to defaults', e);
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    window.dispatchEvent(new CustomEvent('db_updated', { detail: { source: 'local' } }));
  }

  saveData(customData) {
    localStorage.setItem(this.storageKey, JSON.stringify(customData));
    window.dispatchEvent(new CustomEvent('db_updated', { detail: { source: 'local' } }));
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DB));
    this.save();
  }
}

const db = new ERPDatabase();
window.dbInstance = db; // Expose globally for modules to access
