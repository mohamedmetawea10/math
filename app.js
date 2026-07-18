// app.js - Core application controller and router for Motawea Math ERP

class ERPApp {
  constructor() {
    this.db = window.dbInstance;
    this.i18n = window.i18nInstance;
    this.charts = window.erpChartsInstance;
    
    this.currentUser = null; // Stores currently logged in user { username, role, studentId }
    this.activeView = 'home';
    
    // Scanner handle
    this.html5QrcodeScanner = null;
    this.audioBeep = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav'); // Free beep sound URL

    this.init();
  }

  init() {
    // Set default theme from database
    this.applyTheme(this.db.data.settings.theme);
    
    // Initialize standard select option inputs
    this.initSelectOptions();
    
    // Initialize Event Listeners
    this.bindEvents();
    
    // Auto-refresh UI on database updates (cross-tab or local)
    window.addEventListener('db_updated', () => {
      this.refreshActivePageData();
    });
    
    // Router - initial state
    const savedToken = localStorage.getItem('erp_auth_token');
    if (savedToken) {
      try {
        this.currentUser = JSON.parse(savedToken);
        this.routeAfterLogin(false);
      } catch (e) {
        this.showLogin();
      }
    } else {
      this.showLogin();
    }
    
    // Sync UI with initial language
    this.i18n.translateDOM();
    this.updateLanguageButtonLabel();
    this.updateBrandingDOM();
    
    // توليد الرموز الرياضية العائمة في الخلفية
    this.createFloatingMathSymbols();
  }

  createFloatingMathSymbols() {
    let container = document.querySelector('.math-bg-decorations');
    if (!container) {
      container = document.createElement('div');
      container.className = 'math-bg-decorations';
      document.body.appendChild(container);
    }
    container.innerHTML = '';
    const symbols = ['∑', '∫', 'π', '√', '∞', 'x²', 'y', 'z', 'Δ', 'α', 'β', 'θ', 'sin', 'cos', 'tan', 'log', 'lim', 'f(x)', 'a²+b²=c²', '∫x dx', 'λ', 'Ω'];
    const colors = ['var(--neon-blue)', 'var(--neon-purple)', 'var(--neon-green)', 'var(--neon-orange)'];
    for (let i = 0; i < 40; i++) {
      const span = document.createElement('span');
      span.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      span.style.color = colors[Math.floor(Math.random() * colors.length)];
      span.style.left = Math.random() * 100 + 'vw';
      span.style.top = Math.random() * 100 + 'vh';
      span.style.fontSize = Math.floor(Math.random() * 24 + 14) + 'px';
      span.style.animationDelay = Math.random() * 20 + 's';
      span.style.animationDuration = (Math.random() * 20 + 15) + 's';
      
      const floatX = (Math.random() * 200 - 100) + 'px';
      const floatY = (Math.random() * 200 - 100) + 'px';
      const floatRot = (Math.random() * 720 - 360) + 'deg';
      span.style.setProperty('--float-x', floatX);
      span.style.setProperty('--float-y', floatY);
      span.style.setProperty('--float-rot', floatRot);
      
      span.className = 'floating-math-symbol';
      container.appendChild(span);
    }
  }

  confirmAction(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('custom-confirm-modal');
      const msgEl = document.getElementById('custom-confirm-message');
      const btnYes = document.getElementById('btn-confirm-yes');
      const btnNo = document.getElementById('btn-confirm-no');
      
      if (!modal || !msgEl || !btnYes || !btnNo) {
        resolve(confirm(message));
        return;
      }
      
      msgEl.textContent = message;
      modal.style.display = 'flex';
      
      // Focus on the Yes button to support Enter key immediately
      setTimeout(() => btnYes.focus(), 50);
      
      const cleanup = () => {
        modal.style.display = 'none';
        btnYes.onclick = null;
        btnNo.onclick = null;
        document.removeEventListener('keydown', handleKey);
      };
      
      const handleKey = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          resolve(true);
          cleanup();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          resolve(false);
          cleanup();
        }
      };
      
      btnYes.onclick = () => {
        resolve(true);
        cleanup();
      };
      
      btnNo.onclick = () => {
        resolve(false);
        cleanup();
      };
      
      document.addEventListener('keydown', handleKey);
    });
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.getElementById('btn-theme-toggle').innerHTML = '<i data-lucide="sun"></i>';
      document.getElementById('btn-login-theme-toggle').innerHTML = '<i data-lucide="sun"></i>';
    } else {
      document.body.classList.remove('dark-mode');
      document.getElementById('btn-theme-toggle').innerHTML = '<i data-lucide="moon"></i>';
      document.getElementById('btn-login-theme-toggle').innerHTML = '<i data-lucide="moon"></i>';
    }
    lucide.createIcons();
    this.db.data.settings.theme = theme;
    this.db.save();
    
    // Redraw charts if dashboard is active
    if (this.currentUser && this.activeView === 'dashboard') {
      this.renderDashboardCharts();
    }
  }

  updateLanguageButtonLabel() {
    const btn = document.getElementById('btn-lang-toggle');
    const loginBtn = document.getElementById('btn-login-lang-toggle');
    if (this.i18n.currentLang === 'ar') {
      btn.innerHTML = '<span style="font-weight: 700; font-size:13px;">EN</span>';
      loginBtn.innerHTML = '<span style="font-weight: 700; font-size:13px;">EN</span>';
    } else {
      btn.innerHTML = '<span style="font-weight: 700; font-size:13px;">AR</span>';
      loginBtn.innerHTML = '<span style="font-weight: 700; font-size:13px;">AR</span>';
    }
  }

  // Pre-populate Levels and Subjects in Select controls strictly matching prompt specs
  initSelectOptions() {
    const levels = [
      'KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'الأول إعدادي', 'الثاني إعدادي', 'الثالث إعدادي', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'
    ];

    const estLevelSelect = document.getElementById('est-level');
    const stLevelSelect = document.getElementById('st-level');
    const filterGradeLevelSelect = document.getElementById('filter-grade-level');
    
    if (estLevelSelect) estLevelSelect.innerHTML = '';
    if (stLevelSelect) stLevelSelect.innerHTML = '';
    if (filterGradeLevelSelect) filterGradeLevelSelect.innerHTML = '<option value="">كل المراحل / All Levels</option>';

    levels.forEach(lvl => {
      if (estLevelSelect) estLevelSelect.innerHTML += `<option value="${lvl}">${lvl}</option>`;
      if (stLevelSelect) stLevelSelect.innerHTML += `<option value="${lvl}">${lvl}</option>`;
      if (filterGradeLevelSelect) filterGradeLevelSelect.innerHTML += `<option value="${lvl}">${lvl}</option>`;
    });

    if (estLevelSelect) {
      estLevelSelect.addEventListener('change', () => this.populateStudentGroupOptions(estLevelSelect.value, 'est-group'));
      this.populateStudentGroupOptions(levels[0], 'est-group');
    }
    if (stLevelSelect) {
      stLevelSelect.addEventListener('change', () => this.populateStudentGroupOptions(stLevelSelect.value, 'st-group'));
      this.populateStudentGroupOptions(levels[0], 'st-group');
    }
  }

  populateStudentGroupOptions(level, targetSelectId = 'est-group') {
    const groupSelect = document.getElementById(targetSelectId);
    if (!groupSelect) return;
    groupSelect.innerHTML = '';
    
    const filteredGroups = this.db.data.groups.filter(g => {
      const groupLevels = Array.isArray(g.level) ? g.level : [g.level];
      return groupLevels.includes(level);
    });
    
    if (filteredGroups.length === 0) {
      groupSelect.innerHTML = `<option value="">لا يوجد مجموعات لهذا الصف / No groups</option>`;
      return;
    }
    
    filteredGroups.forEach(g => {
      const name = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
      groupSelect.innerHTML += `<option value="${g.id}">${name}</option>`;
    });
  }

  populateModalSelectOptions() {
    const stLevelSelect = document.getElementById('st-level');
    if (stLevelSelect) {
      this.populateStudentGroupOptions(stLevelSelect.value, 'st-group');
    }
  }

  bindEvents() {
    // === مستمعي أحداث رفع صور الطلاب والأزرار الجديدة لولي الأمر ===
    const stAvatar = document.getElementById('st-avatar');
    if (stAvatar) {
      stAvatar.addEventListener('change', () => {
        const preview = document.getElementById('st-avatar-preview');
        const container = document.getElementById('st-avatar-preview-container');
        if (stAvatar.files && stAvatar.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src = e.target.result;
            container.style.display = 'block';
            document.getElementById('st-avatar-cleared').value = 'false';
          };
          reader.readAsDataURL(stAvatar.files[0]);
        }
      });
    }
    
    const btnRemoveStAvatar = document.getElementById('btn-remove-st-avatar');
    if (btnRemoveStAvatar) {
      btnRemoveStAvatar.addEventListener('click', () => {
        const stAvatar = document.getElementById('st-avatar');
        if (stAvatar) stAvatar.value = '';
        document.getElementById('st-avatar-preview').src = '';
        document.getElementById('st-avatar-preview-container').style.display = 'none';
        document.getElementById('st-avatar-cleared').value = 'true';
      });
    }

    const estAvatar = document.getElementById('est-avatar');
    if (estAvatar) {
      estAvatar.addEventListener('change', () => {
        const preview = document.getElementById('est-avatar-preview');
        const container = document.getElementById('est-avatar-preview-container');
        if (estAvatar.files && estAvatar.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src = e.target.result;
            container.style.display = 'block';
            document.getElementById('est-avatar-cleared').value = 'false';
          };
          reader.readAsDataURL(estAvatar.files[0]);
        }
      });
    }
    
    const btnRemoveEstAvatar = document.getElementById('btn-remove-est-avatar');
    if (btnRemoveEstAvatar) {
      btnRemoveEstAvatar.addEventListener('click', () => {
        const estAvatar = document.getElementById('est-avatar');
        if (estAvatar) estAvatar.value = '';
        document.getElementById('est-avatar-preview').src = '';
        document.getElementById('est-avatar-preview-container').style.display = 'none';
        document.getElementById('est-avatar-cleared').value = 'true';
      });
    }

    const parentNavHome = document.getElementById('parent-nav-home');
    const parentNavPortal = document.getElementById('parent-nav-portal');
    if (parentNavHome && parentNavPortal) {
      parentNavHome.addEventListener('click', () => {
        this.switchView('home');
      });
      parentNavPortal.addEventListener('click', () => {
        this.switchView('parent-portal');
      });
    }

    // Parent self-registration toggle views
    const linkGotoRegister = document.getElementById('link-goto-register');
    const linkGotoLogin = document.getElementById('link-goto-login');
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');

    if (linkGotoRegister) {
      linkGotoRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginCard.style.display = 'none';
        registerCard.style.display = 'block';
      });
    }

    if (linkGotoLogin) {
      linkGotoLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerCard.style.display = 'none';
        loginCard.style.display = 'block';
      });
    }

    // Parent self-registration dynamic student rows
    const btnRegAddStudent = document.getElementById('btn-reg-add-student');
    const regStudentsContainer = document.getElementById('registration-students-container');
    if (btnRegAddStudent) {
      btnRegAddStudent.addEventListener('click', () => {
        const newRow = document.createElement('div');
        newRow.className = 'student-confirmation-row';
        newRow.style = 'display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; align-items: flex-end;';
        newRow.innerHTML = `
          <div style="flex: 1; min-width: 140px;">
            <label style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px; display: block;">كود الطالب</label>
            <input type="text" class="form-input reg-student-id" required placeholder="مثال: 12345" style="padding: 8px 10px; font-size: 12.5px;">
          </div>
          <button type="button" class="btn btn-danger" style="padding: 8px; margin-bottom: 0; border-radius: var(--border-radius-md); width: 36px; height: 38px; justify-content: center; display: inline-flex; align-items: center;" onclick="this.parentElement.remove()">✕</button>
        `;
        regStudentsContainer.appendChild(newRow);
      });
    }

    // Parent registration form submit
    const parentRegForm = document.getElementById('parent-registration-form');
    if (parentRegForm) {
      parentRegForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitParentRegistrationRequest();
      });
    }

    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;

      this.handleLogin(null, username, password);
    });

    // Student levels buttons tabs toggler
    const levelTabs = document.querySelectorAll('.level-btn-tab');
    levelTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const level = btn.getAttribute('data-level');
        if (level === 'register') {
          // Open Modal Student
          document.getElementById('student-form').reset();
          document.getElementById('student-form-action').value = 'add';
          document.getElementById('student-form-id').value = '';
          document.getElementById('student-modal-title').textContent = 'إضافة طالب جديد';
          document.getElementById('st-avatar-cleared').value = 'false';
          document.getElementById('st-avatar-preview').src = '';
          document.getElementById('st-avatar-preview-container').style.display = 'none';
          
          // Generate new format code (5 random digits)
          const generateId = () => Math.floor(10000 + Math.random() * 90000).toString();
          let formattedId = generateId();
          while (this.db.data.students.find(s => s.id === formattedId)) {
            formattedId = generateId();
          }
          document.getElementById('st-barcode').value = formattedId;
          
          // Populate modal dropdowns (levels & groups)
          this.populateModalSelectOptions();
          
          document.getElementById('modal-student').style.display = 'flex';
        } else {
          levelTabs.forEach(b => {
            b.classList.remove('btn-primary', 'active');
            b.classList.add('btn-secondary');
          });
          btn.classList.remove('btn-secondary');
          btn.classList.add('btn-primary', 'active');
          
          document.getElementById('students-list-view-card').style.display = 'block';
          this.renderStudentsListForLevel(level);
        }
      });
    });

    // Student modal form save
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
      studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveStudentForm();
      });
    }

    // Sidebar navigation clicks
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.switchView(view);
        menuItems.forEach(mi => mi.classList.remove('active'));
        item.classList.add('active');

        // Hide mobile sidebar drawer
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('active-mobile');

        // Auto-collapse sidebar on desktop to show content full-width as requested
        const erpContainer = document.getElementById('erp-container');
        if (erpContainer && window.innerWidth > 1024) {
          erpContainer.classList.add('sidebar-collapsed');
        }
      });
    });

    // Sidebar toggle (for both mobile and desktop)
    const mobileToggle = document.getElementById('mobile-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        const erpContainer = document.getElementById('erp-container');
        if (window.innerWidth <= 1024) {
          if (sidebar) sidebar.classList.toggle('active-mobile');
        } else {
          if (erpContainer) erpContainer.classList.toggle('sidebar-collapsed');
        }
      });
    }

    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    if (sidebarCloseBtn) {
      sidebarCloseBtn.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        const erpContainer = document.getElementById('erp-container');
        if (sidebar) sidebar.classList.remove('active-mobile');
        if (erpContainer) erpContainer.classList.add('sidebar-collapsed');
      });
    }

    // Language Toggle Trigger (Dashboard and Login)
    const toggleLangFn = () => {
      const newLang = this.i18n.currentLang === 'ar' ? 'en' : 'ar';
      this.i18n.setLang(newLang);
      this.updateLanguageButtonLabel();
      this.refreshActivePageData();
    };
    document.getElementById('btn-lang-toggle').addEventListener('click', toggleLangFn);
    document.getElementById('btn-login-lang-toggle').addEventListener('click', toggleLangFn);

    // Theme Toggle Trigger (Dashboard and Login)
    const toggleThemeFn = () => {
      const currentTheme = this.db.data.settings.theme;
      this.applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    };
    document.getElementById('btn-theme-toggle').addEventListener('click', toggleThemeFn);
    document.getElementById('btn-login-theme-toggle').addEventListener('click', toggleThemeFn);

    // Global Logout Trigger
    document.getElementById('btn-logout').addEventListener('click', () => {
      this.logout();
    });
    
    // Top Logout Trigger
    const btnTopLogout = document.getElementById('btn-top-logout');
    if (btnTopLogout) {
      btnTopLogout.addEventListener('click', () => {
        this.logout();
      });
    }

    // Custom notification modal triggers
    const btnAddNotification = document.getElementById('btn-add-notification');
    if (btnAddNotification) {
      btnAddNotification.addEventListener('click', () => this.openAddNotificationModal());
    }
    const btnSendCustomNotification = document.getElementById('btn-send-custom-notification');
    if (btnSendCustomNotification) {
      btnSendCustomNotification.addEventListener('click', () => this.sendCustomNotification());
    }

    // Quick Attendance selection listeners
    const attGroupSelect = document.getElementById('attendance-group-select');
    if (attGroupSelect) {
      attGroupSelect.addEventListener('change', () => this.renderAttendanceStudentsGrid());
    }
    const attDateSelect = document.getElementById('attendance-date-select');
    if (attDateSelect) {
      attDateSelect.addEventListener('change', () => this.renderAttendanceStudentsGrid());
    }

    // Student Manager filter changes and search triggers
    document.getElementById('filter-student-group').addEventListener('change', () => this.renderStudentsList());
    
    // Print Student Profile Trigger
    document.getElementById('btn-print-trigger').addEventListener('click', () => {
      window.print();
    });

    // Start/Stop QR Webcam Scanner (Guarded)
    const btnStartScanner = document.getElementById('btn-start-scanner');
    if (btnStartScanner) btnStartScanner.addEventListener('click', () => this.startQrScanner());
    const btnStopScanner = document.getElementById('btn-stop-scanner');
    if (btnStopScanner) btnStopScanner.addEventListener('click', () => this.stopQrScanner());

    // Barcode input submission (Guarded)
    const btnSubmitBarcode = document.getElementById('btn-submit-barcode');
    if (btnSubmitBarcode) btnSubmitBarcode.addEventListener('click', () => this.processBarcodeScannerInput());
    const attendanceBarcodeInput = document.getElementById('attendance-barcode-input');
    if (attendanceBarcodeInput) {
      attendanceBarcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.processBarcodeScannerInput();
        }
      });
    }

    // Attendance simulation actions (Guarded)
    const btnSimQrScan = document.getElementById('btn-sim-qr-scan');
    if (btnSimQrScan) btnSimQrScan.addEventListener('click', () => this.simulateAttendanceScan('QR Code'));
    const btnSimBarcodeScan = document.getElementById('btn-sim-barcode-scan');
    if (btnSimBarcodeScan) btnSimBarcodeScan.addEventListener('click', () => this.simulateAttendanceScan('Barcode'));

    // Manual Attendance Check-in form (Guarded)
    const attendanceManualForm = document.getElementById('attendance-manual-form');
    if (attendanceManualForm) {
      attendanceManualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitManualAttendance();
      });
    }

    // Attendance Log filter changes
    document.getElementById('attendance-log-date').addEventListener('change', () => {
      this.populateAttendanceDropdowns();
      this.renderAttendanceStudentsGrid();
      this.renderAttendanceLogs();
    });
    document.getElementById('attendance-log-group').addEventListener('change', () => this.renderAttendanceLogs());

    // Grade group change to display list of students
    document.getElementById('grade-group-select').addEventListener('change', (e) => {
      this.populateGradesStudentsList(e.target.value);
    });

    // Record group grades submit
    document.getElementById('record-group-grade-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitGroupGradesRecord();
    });

    // Grades table filter by group
    document.getElementById('filter-grade-group').addEventListener('change', () => this.renderGradesTable());

    // Finance transaction form submit
    document.getElementById('finance-transaction-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitFinanceTransaction();
    });

    // Finance category switches student field visibility
    const txTypeSelect = document.getElementById('finance-tx-type');
    const studentFeeGroup = document.getElementById('finance-student-fee-group');
    txTypeSelect.addEventListener('change', () => {
      if (txTypeSelect.value === 'income') {
        studentFeeGroup.style.display = 'block';
      } else {
        studentFeeGroup.style.display = 'none';
      }
    });

    // WhatsApp Live Test broadcast sender
    const whatsappTestForm = document.getElementById('whatsapp-test-form');
    if (whatsappTestForm) {
      whatsappTestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendWhatsAppTestMessage();
      });
    }

    // Parent portal Select child selection
    document.getElementById('parent-student-select').addEventListener('change', (e) => {
      const student = this.db.data.students.find(s => s.id === e.target.value);
      if (student) {
        document.getElementById('parent-portal-greeting').innerHTML = `${this.i18n.translate('parentWelcome')} <strong style="color:var(--primary);">${student.name}</strong>`;
      }
      this.renderParentStudentPanel(e.target.value);
    });

    // Branding settings form submit
    const brandingForm = document.getElementById('branding-settings-form');
    if (brandingForm) {
      brandingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveBrandingSettings();
      });
    }

    document.getElementById('btn-backup-export').addEventListener('click', () => this.exportDatabaseBackup());
    document.getElementById('btn-backup-import-trigger').addEventListener('click', () => {
      document.getElementById('backup-file-input').click();
    });
    document.getElementById('backup-file-input').addEventListener('change', (e) => this.importDatabaseBackup(e));
    
    document.getElementById('btn-reset-db').addEventListener('click', async () => {
      if (await this.confirmAction('🚨 تنبيه: سيؤدي هذا الإجراء إلى حذف كافة بياناتك المخصصة والرجوع إلى الإعدادات الافتراضية. هل أنت متأكد؟')) {
        this.db.reset();
        window.location.reload();
      }
    });

    // Export Students Directory trigger
    document.getElementById('btn-export-students').addEventListener('click', () => this.exportStudentsToCSV());

    // TEACHER AND PARENT MANAGEMENT TRIGGERS
    document.getElementById('btn-add-teacher-mgmt').addEventListener('click', () => this.openTeacherModal());
    document.getElementById('teacher-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTeacherForm();
    });

    document.getElementById('btn-add-parent-mgmt').addEventListener('click', () => this.openParentModal());
    document.getElementById('parent-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveParentForm();
    });

    // GROUP MANAGEMENT TRIGGERS
    document.getElementById('btn-add-group').addEventListener('click', () => this.openGroupModal());
    document.getElementById('group-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveGroupForm();
    });

    // ADMIN MANAGEMENT TRIGGERS
    document.getElementById('btn-add-admin-mgmt').addEventListener('click', () => this.openAdminModal());
    document.getElementById('admin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAdminForm();
    });

    // FINANCE MODAL TRIGGERS
    document.getElementById('btn-add-transaction').addEventListener('click', () => {
      document.getElementById('modal-finance-transaction').style.display = 'flex';
      document.getElementById('finance-transaction-form').reset();
      document.getElementById('finance-student-fee-group').style.display = 'block';
    });

    const toggleSheetBtn = document.getElementById('btn-toggle-monthly-sheet');
    if (toggleSheetBtn) {
      toggleSheetBtn.addEventListener('click', () => {
        const container = document.getElementById('monthly-sheet-container');
        const textSpan = document.getElementById('btn-toggle-monthly-sheet-text');
        if (container.style.display === 'none') {
          container.style.display = 'block';
          textSpan.textContent = this.i18n.currentLang === 'ar' ? 'إخفاء الكشف' : 'Hide Sheet';
          this.renderMonthlySubscriptionSheet();
        } else {
          container.style.display = 'none';
          textSpan.textContent = this.i18n.currentLang === 'ar' ? 'عرض الكشف' : 'Show Sheet';
        }
      });
    }

    const parentBellBtn = document.getElementById('btn-parent-notifications');
    if (parentBellBtn) {
      parentBellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('parent-notifications-dropdown');
        if (dropdown.style.display === 'none') {
          dropdown.style.display = 'block';
          this.markParentNotificationsAsRead();
        } else {
          dropdown.style.display = 'none';
        }
      });
    }

    const btnMarkAllReadInline = document.getElementById('btn-mark-all-read-inline');
    if (btnMarkAllReadInline) {
      btnMarkAllReadInline.addEventListener('click', () => {
        this.markParentNotificationsAsRead();
      });
    }

    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('parent-notifications-dropdown');
      if (dropdown && dropdown.style.display !== 'none' && !dropdown.contains(e.target) && e.target.id !== 'btn-parent-notifications') {
        dropdown.style.display = 'none';
      }
    });

    // Home view event listeners
    const btnAddPost = document.getElementById('btn-add-post');
    if (btnAddPost) {
      btnAddPost.addEventListener('click', () => {
        document.getElementById('post-form').reset();
        document.getElementById('post-form-action').value = 'add';
        document.getElementById('post-form-id').value = '';
        const imageClearedEl = document.getElementById('post-image-cleared');
        if (imageClearedEl) imageClearedEl.value = 'false';
        document.getElementById('post-modal-title').textContent = 'إضافة منشور جديد';
        document.getElementById('post-image-preview-container').style.display = 'none';
        document.getElementById('modal-post').style.display = 'flex';
      });
    }

    const postForm = document.getElementById('post-form');
    if (postForm) {
      postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.savePostForm();
      });
    }

    const postImageInput = document.getElementById('post-image');
    if (postImageInput) {
      postImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const preview = document.getElementById('post-image-preview');
            preview.src = evt.target.result;
            document.getElementById('post-image-preview-container').style.display = 'block';
            const imageClearedEl = document.getElementById('post-image-cleared');
            if (imageClearedEl) imageClearedEl.value = 'false';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const btnRemovePostImage = document.getElementById('btn-remove-post-image');
    if (btnRemovePostImage) {
      btnRemovePostImage.addEventListener('click', () => {
        const postImageInput = document.getElementById('post-image');
        if (postImageInput) postImageInput.value = '';
        document.getElementById('post-image-preview').src = '';
        document.getElementById('post-image-preview-container').style.display = 'none';
        const imageClearedEl = document.getElementById('post-image-cleared');
        if (imageClearedEl) imageClearedEl.value = 'true';
      });
    }

    const btnEditHomeBio = document.getElementById('btn-edit-home-bio');
    if (btnEditHomeBio) {
      btnEditHomeBio.addEventListener('click', () => {
        const settings = this.db.data.siteSettings;
        document.getElementById('bio-name').value = settings.teacherName;
        document.getElementById('bio-title').value = settings.teacherTitle;
        document.getElementById('bio-text').value = settings.teacherBio;
        document.getElementById('bio-phone').value = settings.teacherPhone;
        document.getElementById('bio-email').value = settings.teacherEmail || '';
        document.getElementById('modal-teacher-bio').style.display = 'flex';
      });
    }

    const teacherBioForm = document.getElementById('teacher-bio-form');
    if (teacherBioForm) {
      teacherBioForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTeacherBioForm();
      });
    }

    // Interactive Dashboard Stat Cards Click Handlers
    const cardGroups = document.getElementById('card-stat-groups');
    if (cardGroups) {
      cardGroups.addEventListener('click', () => this.showDashboardGroupsDetail());
    }

    const cardDailyInc = document.getElementById('card-stat-daily-income');
    if (cardDailyInc) {
      cardDailyInc.addEventListener('click', () => this.showDashboardDailyIncomeDetail());
    }

    const cardWeeklyInc = document.getElementById('card-stat-weekly-income');
    if (cardWeeklyInc) {
      cardWeeklyInc.addEventListener('click', () => this.showDashboardWeeklyIncomeDetail());
    }

    const cardExpenses = document.getElementById('card-stat-expenses');
    if (cardExpenses) {
      cardExpenses.addEventListener('click', () => this.showDashboardExpensesDetail());
    }

    // Month buttons in annual analysis
    const monthButtons = document.querySelectorAll('.month-btn-tab');
    monthButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        monthButtons.forEach(b => {
          b.classList.remove('btn-primary', 'active');
          b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary', 'active');
        
        const m = parseInt(btn.getAttribute('data-month'));
        this.updateSelectedMonthStats(m);
      });
    });
  }


  // Toast system builder
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle-2';
    if (type === 'error') icon = 'alert-triangle';
    
    toast.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
      </div>
      <button style="background:none; border:none; color:inherit; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Auto remove after 4.5 seconds
    setTimeout(() => {
      toast.remove();
    }, 4500);
  }

  // Play Beep for Attendance
  playBeep() {
    if (this.db.data.settings.attendanceBeep) {
      this.audioBeep.play().catch(e => console.log('Audio playback prevented by browser policy'));
    }
  }

  // Trigger simulated WhatsApp message text block
  triggerWhatsAppNotification(studentId, type, variables = {}) {
    const student = this.db.data.students.find(s => s.id === studentId);
    if (!student) return;

    let phone = student.fatherPhone || student.motherPhone || student.studentPhone;
    if (!phone) return;

    const groupObj = this.db.data.groups.find(g => g.id === student.groupId);
    const groupName = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';

    let text = '';
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === 'attendance') {
      text = this.i18n.currentLang === 'ar'
        ? `السلام عليكم ورحمة الله وبركاته، نود إعلامكم بأن ابننا الطالب/ ${student.name} قد حضر اليوم حصة (${groupName}) بنجاح في تمام الساعة ${timeStr}. نتمنى له دوام التوفيق والتميز.\nأكاديمية Math Zone 🌹`
        : `Dear Parent, we would like to inform you that student ${student.name} attended today's session (${groupName}) successfully at ${timeStr}. We wish them continued success.\nMath Zone Academy 🌹`;
    } else if (type === 'absence') {
      text = this.i18n.currentLang === 'ar'
        ? `السلام عليكم ورحمة الله وبركاته، نود إحاطتكم علماً بغياب الطالب/ ${student.name} عن حصة (${groupName}) المقررة اليوم. يرجى المتابعة والحرص على تعويض الدرس.\nمع تحيات أكاديمية Math Zone 🌹`
        : `Dear Parent, we regret to inform you that student ${student.name} was absent from today's session (${groupName}). Please follow up to ensure they catch up.\nBest regards, Math Zone Academy 🌹`;
    } else if (type === 'grades') {
      text = this.i18n.currentLang === 'ar'
        ? `السلام عليكم ورحمة الله وبركاته، نود مشاركتكم نتيجة اختبار الطالب/ ${student.name} في (${variables.title}) لمادة الرياضيات بمجموعة (${groupName}). حصل الطالب على درجة: ${variables.score} من ${variables.total}. يتمنى له مستر محمد دوام التميز والتفوق 🌟`
        : `Dear Parent, we are pleased to share student ${student.name}'s result in (${variables.title}) for Math class (${groupName}). Score: ${variables.score}/${variables.total}. We wish them continuous excellence 🌟`;
    } else if (type === 'payment') {
      text = this.i18n.currentLang === 'ar'
        ? `السلام عليكم ورحمة الله وبركاته، تم بحمد الله استلاف مبلغ ${variables.amount} ج.م قيمة اشتراك الرياضيات للطالب/ ${student.name} بمجموعة (${groupName}). نشكركم لتعاونكم وثقتكم بنا.\nأكاديمية Math Zone 💳`
        : `Dear Parent, payment of ${variables.amount} EGP for student ${student.name} in group (${groupName}) received successfully. Thank you for your trust.\nMath Zone Academy 💳`;
    }

    // Add log entry
    const newLog = {
      id: 'MSG' + Date.now(),
      studentId: studentId,
      recipient: phone,
      type: type,
      message: text,
      date: `${dateStr} ${timeStr}`,
      status: 'sent'
    };
    
    this.db.data.whatsappLogs.unshift(newLog);

    if (!this.db.data.parentNotifications) this.db.data.parentNotifications = [];
    this.db.data.parentNotifications.unshift({
      id: 'NOT' + Date.now() + Math.random().toString().substring(2, 6),
      studentId: studentId,
      type: type,
      title: type === 'attendance' ? 'تسجيل حضور' : (type === 'absence' ? 'تسجيل غياب' : (type === 'grades' ? 'إعلان درجة' : 'دفعة مالية')),
      message: text,
      date: `${dateStr} ${timeStr}`,
      read: false
    });

    this.db.save();

    // Show system-level notification toast to user instead of WhatsApp dispatches
    const toastMsg = this.i18n.currentLang === 'ar'
      ? `🔔 تم إرسال إشعار لحساب ولي الأمر بنجاح.`
      : `🔔 Notification sent to parent portal successfully.`;
    this.showToast(toastMsg, 'success');

    // Live-refresh parent portal tables if the portal is currently open
    // and the logged-in parent owns this student (or admin is previewing)
    if (this.activeView === 'parent-portal') {
      try {
        // Re-render notifications section (bell badge + inline list)
        this.renderParentNotifications();

        // Re-render the student data panel if this student is selected
        const select = document.getElementById('parent-student-select');
        if (select && select.value === studentId) {
          this.renderParentStudentPanel(studentId);
        }
      } catch(e) { /* silent — portal may not be fully initialised */ }
    }
  }

  // Authenticate Username/Password with automatic role detection
  handleLogin(ignoredRole, username, password) {
    // 1. Scan admins
    const admin = this.db.data.admins && this.db.data.admins.find(a => 
      a.username === username && a.password === password
    );
    
    if (admin) {
      if (!admin.active) {
        this.showToast('الحساب معطل حالياً / Account deactivated', 'error');
        return;
      }
      this.currentUser = { username: admin.username, role: 'admin', adminId: admin.id };
    }
    // 2. Scan teachers
    else {
      const teacher = this.db.data.teachers.find(t => 
        (t.username === username || t.id === username) && t.password === password
      );
      
      if (teacher) {
        if (!teacher.active) {
          this.showToast('الحساب معطل حالياً / Account deactivated', 'error');
          return;
        }
        this.currentUser = { username: teacher.id, role: 'teacher' };
      }
      // 3. Scan parents
      else {
        const parent = this.db.data.parents.find(p => 
          (p.username === username || p.id === username) && p.password === password
        );
        
        if (parent) {
          if (parent.pendingApproval) {
            this.showToast('الحساب بانتظار تأكيد الإدارة وتفعيل الحساب', 'error');
            return;
          }
          if (!parent.active) {
            this.showToast('الحساب معطل حالياً / Account deactivated', 'error');
            return;
          }
          const sIds = parent.studentIds || (parent.studentId ? [parent.studentId] : []);
          this.currentUser = { username: parent.id, role: 'parent', studentId: sIds[0] };
        } else {
          this.showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
          return;
        }
      }
    }

    // Save token
    localStorage.setItem('erp_auth_token', JSON.stringify(this.currentUser));

    this.routeAfterLogin(true);
  }

  routeAfterLogin(showToast = true) {
    if (showToast) {
      this.showToast(this.i18n.currentLang === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!', 'success');
    }
    
    // Hide login, show dashboard
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('erp-container').style.display = 'flex';
    
    // Update Header Badges
    this.updateUserHeaderBadge();
    
    // Configure Sidebar items according to permissions
    this.configureSidebarPermissions();
    
    // Route to appropriate view
    if (this.currentUser.role === 'parent') {
      document.getElementById('erp-container').classList.add('parent-mode');
      const pQuick = document.getElementById('parent-quick-nav');
      if (pQuick) pQuick.style.display = 'flex';
      this.switchView('parent-portal');
      document.querySelectorAll('.sidebar-menu .menu-item').forEach(mi => mi.classList.remove('active'));
      const parentSidebarItem = document.querySelector('.sidebar-menu [data-view="parent-portal"]');
      if (parentSidebarItem) parentSidebarItem.classList.add('active');
    } else {
      document.getElementById('erp-container').classList.remove('parent-mode');
      const pQuick = document.getElementById('parent-quick-nav');
      if (pQuick) pQuick.style.display = 'none';
      this.switchView('home');
      document.querySelectorAll('.sidebar-menu .menu-item').forEach(mi => mi.classList.remove('active'));
      const homeSidebarItem = document.querySelector('.sidebar-menu [data-view="home"]');
      if (homeSidebarItem) homeSidebarItem.classList.add('active');
      
      // Auto trigger payment overdue checks when admin logs in
      if (this.currentUser.role === 'admin') {
        this.checkAndSendOverdueReminders();
      }
    }
  }

  // 10 Days monthly fee overdue WhatsApp notification checks
  checkAndSendOverdueReminders() {
    const today = new Date();
    const day = today.getDate();
    // Only check if it's the 11th of the month or later (meaning 10 days of the month have passed)
    if (day < 11) return;

    const currentMonthStr = today.toISOString().substring(0, 7); // YYYY-MM
    const currentMonthName = today.toLocaleString('ar-EG', { month: 'long' });

    let reminderCount = 0;

    this.db.data.students.forEach(student => {
      // Find if student has paid for this month
      const transactions = this.db.data.transactions || [];
      const hasPaid = transactions.some(tx => 
        tx.studentId === student.id && 
        tx.type === 'income' && 
        tx.category === 'monthly-fees' && 
        tx.date.substring(0, 7) === currentMonthStr
      );

      if (!hasPaid) {
        // Check if we already sent an overdue reminder in the last 15 days to avoid spam
        const logs = this.db.data.whatsappLogs || [];
        const recentReminder = logs.find(log => 
          log.studentId === student.id && 
          log.type === 'payment-overdue' &&
          (Date.now() - new Date(log.date).getTime()) < 15 * 24 * 60 * 60 * 1000
        );

        if (!recentReminder) {
          const groupObj = this.db.data.groups.find(g => g.id === student.groupId);
          const groupName = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';
          
          let phone = student.fatherPhone || student.motherPhone || student.studentPhone;
          if (phone) {
            const msg = `السلام عليكم ورحمة الله وبركاته، نود تذكيركم بتأخر سداد اشتراك شهر ${currentMonthName} للطالب/ ${student.name} بمجموعة (${groupName}).\n\nيرجى سرعة السداد خلال أيام لتفادي تعليق حساب الطالب بالمنصة والحضور. شاكرين حسن تعاونكم معنا.\nأكاديمية Math Zone 🔔`;
            
            const newLog = {
              id: 'MSG' + Date.now() + Math.random().toString().substring(2, 6),
              studentId: student.id,
              recipient: phone,
              type: 'payment-overdue',
              message: msg,
              date: `${today.toLocaleDateString()} ${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              status: 'sent'
            };
            
            this.db.data.whatsappLogs.unshift(newLog);
            reminderCount++;
          }
        }
      }
    });

    if (reminderCount > 0) {
      this.db.save();
      this.showToast(`🔔 تم إرسال عدد ${reminderCount} رسائل تذكير بالاشتراكات المتأخرة عبر الواتساب تلقائياً.`, 'warning');
      this.renderWhatsAppLogs();
    }
  }

  updateUserHeaderBadge() {
    const avatar = document.getElementById('user-badge-avatar');
    const name = document.getElementById('user-badge-name');
    const roleSpan = document.getElementById('user-badge-role');

    if (this.currentUser.role === 'admin') {
      const admin = (this.db.data.admins || []).find(a => a.username === this.currentUser.username) || this.db.data.admins[0];
      avatar.src = admin.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'; // default photo if not set
      name.textContent = admin.name;
      roleSpan.textContent = this.i18n.translate('loginRoleAdmin');
      roleSpan.setAttribute('data-i18n', 'loginRoleAdmin');
    } else if (this.currentUser.role === 'teacher') {
      const teacher = this.db.data.teachers.find(t => t.id === this.currentUser.username) || this.db.data.teachers[0];
      avatar.src = teacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150';
      name.textContent = this.i18n.currentLang === 'ar' ? teacher.nameAr : teacher.nameEn;
      roleSpan.textContent = this.i18n.translate('loginRoleTeacher');
      roleSpan.setAttribute('data-i18n', 'loginRoleTeacher');
    } else {
      const parent = this.db.data.parents.find(p => p.id === this.currentUser.username) || this.db.data.parents[0];
      avatar.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'; // parent generic avatar
      name.textContent = parent.name;
      roleSpan.textContent = this.i18n.translate('loginRoleParent');
      roleSpan.setAttribute('data-i18n', 'loginRoleParent');
    }
  }

  configureSidebarPermissions() {
    const role = this.currentUser ? this.currentUser.role : '';

    const items = document.querySelectorAll('.sidebar-menu .menu-item');
    items.forEach(item => {
      item.style.display = 'none';

      if (item.getAttribute('data-view') === 'home') {
        item.style.display = 'block';
      } else if (role === 'admin') {
        if (!item.classList.contains('role-parent')) {
          item.style.display = 'block';
        }
      } else if (role === 'teacher') {
        if (item.classList.contains('role-teacher') || item.getAttribute('data-view') === 'dashboard') {
          item.style.display = 'block';
        }
      } else if (role === 'parent') {
        if (item.classList.contains('role-parent')) {
          item.style.display = 'block';
        }
      }
    });

    // Control specific internal view buttons
    const adminBtns = document.querySelectorAll('.admin-only');
    adminBtns.forEach(btn => {
      btn.style.display = role === 'admin' ? '' : 'none';
    });
    
    // Add group visibility button
    const btnAddGroup = document.getElementById('btn-add-group');
    if (btnAddGroup) btnAddGroup.style.display = role === 'admin' ? '' : 'none';

    // Show/hide general elements based on roles
    document.querySelectorAll('.role-admin').forEach(el => {
      let shouldShow = (role === 'admin');
      if (el.classList.contains('role-teacher') && role === 'teacher') shouldShow = true;
      if (el.classList.contains('role-parent') && role === 'parent') shouldShow = true;
      el.style.display = shouldShow ? '' : 'none';
    });

    document.querySelectorAll('.role-teacher').forEach(el => {
      let shouldShow = (role === 'teacher');
      if (el.classList.contains('role-admin') && role === 'admin') shouldShow = true;
      if (el.classList.contains('role-parent') && role === 'parent') shouldShow = true;
      el.style.display = shouldShow ? '' : 'none';
    });

    document.querySelectorAll('.role-parent').forEach(el => {
      let shouldShow = (role === 'parent');
      if (el.classList.contains('role-admin') && role === 'admin') shouldShow = true;
      if (el.classList.contains('role-teacher') && role === 'teacher') shouldShow = true;
      el.style.display = shouldShow ? '' : 'none';
    });
  }

  showLogin() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('erp-container').style.display = 'none';
    document.getElementById('erp-container').classList.remove('parent-mode');
    const pQuick = document.getElementById('parent-quick-nav');
    if (pQuick) pQuick.style.display = 'none';
    this.currentUser = null;
  }

  logout() {
    localStorage.removeItem('erp_auth_token');
    this.currentUser = null;
    this.stopQrScanner();
    this.showLogin();
    this.showToast('تم تسجيل الخروج بأمان / Logged out successfully', 'info');
  }

  switchView(viewId) {
    this.activeView = viewId;
    
    // Hide all view panels
    const panels = document.querySelectorAll('.view-panel');
    panels.forEach(p => p.style.display = 'none');
    
    // Show active panel
    const activePanel = document.getElementById(`view-${viewId}`);
    if (activePanel) {
      activePanel.style.display = 'block';
      this.refreshActivePageData();
    }

    // تحديث التصميم البصري الفعال لأزرار التنقل العلوية لولي الأمر
    const pHome = document.getElementById('parent-nav-home');
    const pPortal = document.getElementById('parent-nav-portal');
    if (pHome && pPortal) {
      if (viewId === 'home') {
        pHome.classList.remove('btn-secondary');
        pHome.classList.add('btn-primary');
        pPortal.classList.remove('btn-primary');
        pPortal.classList.add('btn-secondary');
      } else if (viewId === 'parent-portal') {
        pPortal.classList.remove('btn-secondary');
        pPortal.classList.add('btn-primary');
        pHome.classList.remove('btn-primary');
        pHome.classList.add('btn-secondary');
      }
    }
  }

  refreshActivePageData() {
    if (this.activeView === 'home') {
      this.renderHomeContent();
    } else if (this.activeView === 'dashboard') {
      this.calculateDashboardStats();
      this.renderDashboardCharts();
    } else if (this.activeView === 'students') {
      this.populateFilterDropdowns();
      this.resetEmbeddedStudentForm();
      // Clear all active tabs and hide all cards to provide a clean empty state
      const levelTabs = document.querySelectorAll('.level-btn-tab');
      levelTabs.forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-secondary');
      });
      document.getElementById('student-registration-form-card').style.display = 'none';
      document.getElementById('students-list-view-card').style.display = 'none';
    } else if (this.activeView === 'teachers-mgmt') {
      this.renderTeachersMgmtList();
    } else if (this.activeView === 'parents-mgmt') {
      this.renderPendingParentRequests();
      this.renderParentsMgmtList();
    } else if (this.activeView === 'admins-mgmt') {
      this.renderAdminsMgmtList();
    } else if (this.activeView === 'groups') {
      this.renderGroupsList();
    } else if (this.activeView === 'attendance') {
      this.populateAttendanceDropdowns();
      this.renderAttendanceStudentsGrid();
      this.renderAttendanceLogs();
    } else if (this.activeView === 'grades') {
      this.populateGradesDropdowns();
      this.renderGradesTable();
    } else if (this.activeView === 'finance') {
      this.populateFinanceDropdowns();
      this.renderFinanceTable();
    } else if (this.activeView === 'whatsapp') {
      this.renderWhatsAppLogs();
    } else if (this.activeView === 'parent-portal') {
      this.initParentPortal();
    } else if (this.activeView === 'settings') {
      this.loadSettingsPage();
    }
    
    lucide.createIcons();
    this.i18n.translateDOM();
  }

  // Dashboard Stats Calculations
  calculateDashboardStats() {
    const data = this.db.data;
    
    document.getElementById('stat-students').textContent = data.students.length;
    document.getElementById('stat-teachers').textContent = data.teachers.length;
    document.getElementById('stat-groups').textContent = data.groups.length;

    let dailyInc = 0, weeklyInc = 0, monthlyInc = 0, annualInc = 0;
    let totalExp = 0;
    
    const todayStr = new Date().toISOString().substring(0, 10);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toISOString().substring(0, 7);

    data.transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const isCurrentYear = txDate.getFullYear() === currentYear;
      
      if (tx.type === 'income') {
        if (tx.date === todayStr) dailyInc += tx.amount;
        if (txDate >= oneWeekAgo) weeklyInc += tx.amount;
        if (tx.date.substring(0, 7) === currentMonth) monthlyInc += tx.amount;
        if (isCurrentYear) annualInc += tx.amount;
      } else {
        if (isCurrentYear) totalExp += tx.amount;
      }
    });

    const netProfit = annualInc - totalExp;
    const curr = this.i18n.translate('currency');

    document.getElementById('stat-daily-income').textContent = `${dailyInc} ${curr}`;
    document.getElementById('stat-weekly-income').textContent = `${weeklyInc} ${curr}`;
    document.getElementById('stat-monthly-income').textContent = `${monthlyInc} ${curr}`;
    document.getElementById('stat-annual-income').textContent = `${annualInc} ${curr}`;
    document.getElementById('stat-expenses').textContent = `${totalExp} ${curr}`;
    
    const profitEl = document.getElementById('stat-net-profit');
    profitEl.textContent = `${netProfit} ${curr}`;
    profitEl.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
  }

  renderDashboardCharts() {
    const data = this.db.data;
    this.charts.drawAnnualRevenueChart('canvas-annual-revenue', data.transactions);
    
    const currentMonthIdx = new Date().getMonth();
    const monthButtons = document.querySelectorAll('.month-btn-tab');
    monthButtons.forEach(btn => {
      const m = parseInt(btn.getAttribute('data-month'));
      if (m === currentMonthIdx) {
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary', 'active');
      } else {
        btn.classList.remove('btn-primary', 'active');
        btn.classList.add('btn-secondary');
      }
    });
    
    this.updateSelectedMonthStats(currentMonthIdx);
  }

  populateFilterDropdowns() {
    const groupSelect = document.getElementById('filter-student-group');
    groupSelect.innerHTML = `<option value="">${this.i18n.translate('filterGroup')}</option>`;
    
    this.db.data.groups.forEach(g => {
      const name = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
      groupSelect.innerHTML += `<option value="${g.id}">${name}</option>`;
    });
  }

  renderStudentsList() {
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';

    const levelFilter = this.activeStudentFilterLevel;
    const groupFilter = document.getElementById('filter-student-group').value;

    let filtered = this.db.data.students;

    if (levelFilter && levelFilter !== 'register') {
      filtered = filtered.filter(s => s.academicLevel === levelFilter);
    }
    if (groupFilter) {
      filtered = filtered.filter(s => s.groupId === groupFilter);
    }

    // Sort alphabetically by student name (Arabic-friendly localeCompare)
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding: 20px; color:var(--text-muted);">لا يوجد نتائج مطابقة / No student profiles matching</td></tr>`;
      return;
    }

    filtered.forEach(student => {
      const groupObj = this.db.data.groups.find(g => g.id === student.groupId);
      const groupName = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';
      
      tbody.innerHTML += `
        <tr class="fade-in" style="cursor: pointer;" onclick="window.appInstance.showStudentDetails('${student.id}')">
          <td>
            <div class="student-table-profile">
              <img class="student-table-img" src="${student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" alt="">
              <div>
                <strong style="font-size:14px; display:block;">${student.name}</strong>
              </div>
            </div>
          </td>
          <td><span style="font-weight:600; font-size:12.5px;">${groupName}</span></td>
        </tr>
      `;
    });

    lucide.createIcons();
    this.configureSidebarPermissions();
  }

  async deleteStudent(id) {
    if (!await this.confirmAction('هل أنت متأكد من حذف حساب هذا الطالب وكل سجلاته نهائياً؟')) return;
    this.db.data.students = this.db.data.students.filter(s => s.id !== id);
    this.db.data.grades = this.db.data.grades.filter(g => g.studentId !== id);
    this.db.save();
    this.showToast('Student deleted / تم حذف الطالب بنجاح', 'success');
    this.renderStudentsList();
  }

  resetEmbeddedStudentForm() {
    const form = document.getElementById('embedded-student-form');
    if (!form) return;
    form.reset();
    document.getElementById('est-form-action').value = 'add';
    document.getElementById('est-form-id').value = '';
    document.getElementById('student-form-heading').textContent = this.i18n.currentLang === 'ar' ? 'تسجيل ملف طالب جديد' : 'Register New Student Profile';
    document.getElementById('btn-cancel-est').style.display = 'none';
    
    // تصفير الصورة الشخصية
    document.getElementById('est-avatar').value = '';
    document.getElementById('est-avatar-cleared').value = 'false';
    document.getElementById('est-avatar-preview').src = '';
    document.getElementById('est-avatar-preview-container').style.display = 'none';
    
    // Generate default values
    document.getElementById('est-barcode').value = '9780201' + Math.floor(Math.random() * 1000000);
    document.getElementById('est-sessions').value = 8;
    document.getElementById('est-fee').value = 350;
    
    const lvlVal = document.getElementById('est-level').value;
    if (lvlVal) this.populateStudentGroupOptions(lvlVal);
  }

  renderStudentsListForLevel(level) {
    this.activeStudentFilterLevel = level;
    this.renderStudentsList();
  }

  editStudentInline(studentId) {
    const s = this.db.data.students.find(x => x.id === studentId);
    if (!s) return;

    // Switch to register tab
    const levelTabs = document.querySelectorAll('.level-btn-tab');
    levelTabs.forEach(b => {
      b.classList.remove('btn-primary', 'active');
      b.classList.add('btn-secondary');
    });
    const regTab = document.querySelector('.level-btn-tab[data-level="register"]');
    if (regTab) {
      regTab.classList.remove('btn-secondary');
      regTab.classList.add('btn-primary', 'active');
    }

    document.getElementById('student-registration-form-card').style.display = 'block';
    document.getElementById('students-list-view-card').style.display = 'none';

    document.getElementById('student-form-heading').textContent = this.i18n.currentLang === 'ar' ? `تعديل ملف الطالب: ${s.name}` : `Edit Student Profile: ${s.name}`;
    document.getElementById('est-form-action').value = 'edit';
    document.getElementById('est-form-id').value = s.id;

    document.getElementById('est-name').value = s.name;
    document.getElementById('est-dob').value = s.dob;
    document.getElementById('est-gender').value = s.gender;
    document.getElementById('est-school').value = s.school;
    document.getElementById('est-level').value = s.academicLevel;
    
    this.populateStudentGroupOptions(s.academicLevel);
    document.getElementById('est-group').value = s.groupId;
    
    document.getElementById('est-sessions').value = s.sessionCount;
    document.getElementById('est-subtype').value = s.subscriptionType;
    document.getElementById('est-fee').value = s.monthlyFee;
    document.getElementById('est-barcode').value = s.barcode;
    document.getElementById('est-phone').value = s.studentPhone || '';
    document.getElementById('est-father-phone').value = s.fatherPhone || '';
    document.getElementById('est-mother-phone').value = s.motherPhone || '';
    document.getElementById('est-address').value = s.address || '';
    document.getElementById('est-awards').value = s.awards ? s.awards.join(', ') : '';
    document.getElementById('est-achievements').value = s.achievements ? s.achievements.join(', ') : '';
    document.getElementById('est-notes').value = s.notes || '';

    // تهيئة وتعبئة الصورة الشخصية المدمجة ومعاينتها
    document.getElementById('est-avatar').value = '';
    document.getElementById('est-avatar-cleared').value = 'false';
    const estPreview = document.getElementById('est-avatar-preview');
    const estContainer = document.getElementById('est-avatar-preview-container');
    if (s.avatar) {
      estPreview.src = s.avatar;
      estContainer.style.display = 'block';
    } else {
      estPreview.src = '';
      estContainer.style.display = 'none';
    }

    document.getElementById('btn-cancel-est').style.display = 'inline-flex';
    
    lucide.createIcons();
  }

  saveEmbeddedStudentForm() {
    const action = document.getElementById('est-form-action').value;
    const id = document.getElementById('est-form-id').value;
    const s = this.db.data.students.find(x => x.id === id);

    const buildStudentObj = (avatarDataUrl) => {
      const isCleared = document.getElementById('est-avatar-cleared').value === 'true';
      let finalAvatar = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150';
      if (s) {
        finalAvatar = s.avatar;
      }
      if (avatarDataUrl) {
        finalAvatar = avatarDataUrl;
      } else if (isCleared) {
        finalAvatar = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150';
      }

      const studentObj = {
        id: action === 'add' ? 'ST' + Date.now().toString().substring(6) : id,
        name: document.getElementById('est-name').value,
        dob: document.getElementById('est-dob').value,
        gender: document.getElementById('est-gender').value,
        school: document.getElementById('est-school').value,
        academicLevel: document.getElementById('est-level').value,
        subject: document.getElementById('est-level').value.includes('إعدادي') || document.getElementById('est-level').value.includes('الثانوي') ? 'Mathematics' : 'Math',
        groupId: document.getElementById('est-group').value,
        sessionCount: parseInt(document.getElementById('est-sessions').value),
        subscriptionType: document.getElementById('est-subtype').value,
        monthlyFee: parseFloat(document.getElementById('est-fee').value),
        barcode: document.getElementById('est-barcode').value,
        studentPhone: document.getElementById('est-phone').value,
        fatherPhone: document.getElementById('est-father-phone').value,
        motherPhone: document.getElementById('est-mother-phone').value,
        address: document.getElementById('est-address').value,
        notes: document.getElementById('est-notes').value,
        awards: document.getElementById('est-awards').value ? document.getElementById('est-awards').value.split(',').map(x => x.trim()) : [],
        achievements: document.getElementById('est-achievements').value ? document.getElementById('est-achievements').value.split(',').map(x => x.trim()) : [],
        avatar: finalAvatar,
        registrationDate: action === 'add' ? new Date().toISOString().substring(0, 10) : s.registrationDate
      };

      if (action === 'add') {
        this.db.data.students.push(studentObj);
        this.showToast('Student added / تم إضافة الطالب بنجاح', 'success');
      } else {
        const idx = this.db.data.students.findIndex(x => x.id === id);
        if (idx !== -1) {
          this.db.data.students[idx] = studentObj;
          this.showToast('Student updated / تم تعديل البيانات بنجاح', 'success');
        }
      }

      this.db.save();
      
      // Switch to student's level list tab
      const lvl = studentObj.academicLevel;
      const levelTabs = document.querySelectorAll('.level-btn-tab');
      levelTabs.forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-secondary');
      });
      const levelTab = document.querySelector(`.level-btn-tab[data-level="${lvl}"]`);
      if (levelTab) {
        levelTab.classList.remove('btn-secondary');
        levelTab.classList.add('btn-primary', 'active');
      }

      document.getElementById('student-registration-form-card').style.display = 'none';
      document.getElementById('students-list-view-card').style.display = 'block';
      
      this.renderStudentsListForLevel(lvl);
    };

    const avatarInput = document.getElementById('est-avatar');
    if (avatarInput.files && avatarInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => buildStudentObj(e.target.result);
      reader.readAsDataURL(avatarInput.files[0]);
    } else {
      buildStudentObj(null);
    }
  }

  printStudentCard(studentId) {
    const s = this.db.data.students.find(x => x.id === studentId);
    if (!s) return;

    document.getElementById('print-card-name').textContent = s.name;
    document.getElementById('print-card-level').textContent = s.academicLevel;
    document.getElementById('print-card-id').textContent = s.id;
    
    const groupObj = this.db.data.groups.find(g => g.id === s.groupId);
    document.getElementById('print-card-group').textContent = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';
    
    document.getElementById('print-card-phone').textContent = s.studentPhone || s.fatherPhone || '-';
    document.getElementById('print-card-barcode').textContent = s.barcode;
    document.getElementById('print-card-img').src = s.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150';

    const qrBox = document.getElementById('print-card-qr-box');
    qrBox.innerHTML = '';
    
    const qrPayload = JSON.stringify({
      id: s.id,
      name: s.name,
      barcode: s.barcode,
      groupId: s.groupId
    });

    new QRCode(qrBox, {
      text: qrPayload,
      width: 90,
      height: 90,
      colorDark: '#0f172a',
      colorLight: '#ffffff'
    });

    document.getElementById('modal-id-card').style.display = 'flex';
  }

  exportStudentsToCSV() {
    let csv = '\uFEFF';
    csv += 'ID,Name,Barcode,Level,Group,Phone,Father Phone,Fee\n';
    
    this.db.data.students.forEach(s => {
      const groupObj = this.db.data.groups.find(g => g.id === s.groupId);
      const groupName = groupObj ? groupObj.nameEn : 'Unassigned';
      csv += `"${s.id}","${s.name}","${s.barcode}","${s.academicLevel}","${groupName}","${s.studentPhone || ''}","${s.fatherPhone || ''}","${s.monthlyFee}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `students_motawea_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Data exported / تم تصدير البيانات بنجاح', 'success');
  }

  // ==================== TEACHER ACCOUNT MANAGEMENT (CRUD) ====================
  renderTeachersMgmtList() {
    const tbody = document.getElementById('teachers-mgmt-table-body');
    tbody.innerHTML = '';
    
    let teachers = this.db.data.teachers;

    teachers.forEach(t => {
      const name = this.i18n.currentLang === 'ar' ? t.nameAr : t.nameEn;

      tbody.innerHTML += `
        <tr class="fade-in" style="cursor: pointer;" onclick="window.appInstance.showAccountDetails('teacher', '${t.id}')">
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="${t.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
              <strong>${name}</strong>
            </div>
          </td>
          <td><code>${t.username}</code></td>
          <td><code>${t.password}</code></td>
        </tr>
      `;
    });
  }

  openTeacherModal(teacherId = null) {
    const modal = document.getElementById('modal-teacher');
    const form = document.getElementById('teacher-form');
    const titleEl = document.getElementById('teacher-modal-title');
    const actionEl = document.getElementById('teacher-form-action');
    const idEl = document.getElementById('teacher-form-id');

    form.reset();

    if (teacherId) {
      const t = this.db.data.teachers.find(x => x.id === teacherId);
      if (!t) return;

      titleEl.textContent = this.i18n.currentLang === 'ar' ? 'تعديل حساب المعلم' : 'Edit Teacher Account';
      actionEl.value = 'edit';
      idEl.value = t.id;

      document.getElementById('t-name').value = this.i18n.currentLang === 'ar' ? t.nameAr : t.nameEn;
      document.getElementById('t-username').value = t.username;
      document.getElementById('t-password').value = t.password;
      document.getElementById('t-subject').value = t.subjectEn;
      document.getElementById('t-phone').value = t.phone;
      document.getElementById('t-email').value = t.email;
      document.getElementById('t-status').value = t.active.toString();
      document.getElementById('t-intro').value = this.i18n.currentLang === 'ar' ? t.introAr : t.introEn;
    } else {
      titleEl.textContent = this.i18n.translate('addTeacher');
      actionEl.value = 'add';
      idEl.value = '';
      document.getElementById('t-status').value = 'true';
    }

    modal.style.display = 'flex';
    lucide.createIcons();
  }

  saveTeacherForm() {
    const action = document.getElementById('teacher-form-action').value;
    const id = document.getElementById('teacher-form-id').value;
    const username = document.getElementById('t-username').value.trim();
    const password = document.getElementById('t-password').value;

    if (!username || !password) {
      this.showToast('اسم المستخدم وكلمة المرور مطلوبان', 'error');
      return;
    }

    const isDuplicate = this.db.data.teachers.some(t => 
      t.username === username && t.id !== id
    );
    if (isDuplicate) {
      this.showToast('اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر', 'error');
      return;
    }

    const buildTeacherObj = (avatarDataUrl) => {
      const tName = document.getElementById('t-name').value;
      const teacherObj = {
        id: action === 'add' ? 'T' + Date.now().toString().substring(8) : id,
        username: document.getElementById('t-username').value.trim(),
        password: document.getElementById('t-password').value,
        nameEn: tName,
        nameAr: tName,
        subjectEn: document.getElementById('t-subject').value,
        subjectAr: document.getElementById('t-subject').value,
        phone: document.getElementById('t-phone').value,
        email: document.getElementById('t-email').value,
        avatar: avatarDataUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        introEn: document.getElementById('t-intro').value,
        introAr: document.getElementById('t-intro').value,
        active: document.getElementById('t-status').value === 'true',
        groups: []
      };

      if (action === 'add') {
        this.db.data.teachers.push(teacherObj);
        this.showToast('Teacher account created / تم إنشاء حساب المعلم بنجاح', 'success');
      } else {
        const idx = this.db.data.teachers.findIndex(x => x.id === id);
        if (idx !== -1) {
          if (!avatarDataUrl) {
            teacherObj.avatar = this.db.data.teachers[idx].avatar;
          }
          teacherObj.groups = this.db.data.teachers[idx].groups;
          this.db.data.teachers[idx] = teacherObj;
          this.showToast('Teacher account updated / تم تحديث بيانات المعلم', 'success');
        }
      }

      this.db.save();
      document.getElementById('modal-teacher').style.display = 'none';
      this.renderTeachersMgmtList();
    };

    const avatarInput = document.getElementById('t-avatar');
    if (avatarInput.files && avatarInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => buildTeacherObj(e.target.result);
      reader.readAsDataURL(avatarInput.files[0]);
    } else {
      buildTeacherObj(null);
    }
  }

  async deleteTeacher(id) {
    if (id === 't00101') {
      alert('لا يمكن حذف الحساب الرئيسي للمدرس!');
      return;
    }
    if (!await this.confirmAction('هل أنت متأكد من حذف حساب المعلم هذا؟')) return;
    this.db.data.teachers = this.db.data.teachers.filter(x => x.id !== id);
    this.db.save();
    this.showToast('Teacher deleted / تم حذف المعلم', 'success');
    this.renderTeachersMgmtList();
  }

  // ==================== PARENT ACCOUNT MANAGEMENT (CRUD) ====================
  renderParentsMgmtList() {
    const tbody = document.getElementById('parents-mgmt-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let parents = this.db.data.parents.filter(p => !p.pendingApproval);

    parents.forEach(p => {
      tbody.innerHTML += `
        <tr class="fade-in" style="cursor: pointer;" onclick="window.appInstance.showAccountDetails('parent', '${p.id}')">
          <td><strong>${p.name}</strong></td>
          <td><code>${p.username}</code></td>
          <td><code>${p.password}</code></td>
        </tr>
      `;
    });
  }

  renderPendingParentRequests() {
    const card = document.getElementById('pending-parents-card');
    const tbody = document.getElementById('pending-parents-table-body');
    if (!card || !tbody) return;

    const pending = this.db.data.parents.filter(p => p.pendingApproval === true);
    
    if (pending.length === 0) {
      card.style.display = 'none';
      tbody.innerHTML = '';
      return;
    }

    card.style.display = 'block';
    tbody.innerHTML = '';

    pending.forEach(p => {
      // Find linked students names
      const sIds = p.studentIds || [];
      const studentDetails = sIds.map(id => {
        const s = this.db.data.students.find(x => x.id === id);
        return s ? `${s.name} (<code>${id}</code>)` : `Student ID: ${id}`;
      }).join(', ');

      tbody.innerHTML += `
        <tr class="fade-in">
          <td><strong>${p.name}</strong></td>
          <td><code>${p.phone}</code></td>
          <td>${studentDetails}</td>
          <td>
            <div class="card-actions-wrapper" style="justify-content: flex-start; gap: 8px;">
              <button class="btn btn-success" style="padding: 4px 8px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px;" onclick="window.appInstance.approveParentRequest('${p.id}')">
                <i data-lucide="check" style="width: 14px; height: 14px;"></i> تأكيد وتفعيل
              </button>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px;" onclick="window.appInstance.rejectParentRequest('${p.id}')">
                <i data-lucide="x" style="width: 14px; height: 14px;"></i> رفض الطلب
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    lucide.createIcons();
  }

  approveParentRequest(parentId) {
    const parent = this.db.data.parents.find(p => p.id === parentId);
    if (!parent) return;

    // Generate credentials
    const username = 'p_' + parent.phone;
    const password = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit password

    parent.username = username;
    parent.password = password;
    parent.active = true;
    parent.pendingApproval = false;

    this.db.save();

    // Get linked student names
    const sIds = parent.studentIds || [];
    const studentNames = sIds.map(id => {
      const s = this.db.data.students.find(x => x.id === id);
      return s ? s.name : id;
    }).join(' و ');

    // تنبيه نجاح تفعيل الحساب وعرض البيانات في رسالة منبثقة
    this.showToast(`🔔 تم تفعيل الحساب بنجاح.`, 'success');
    alert(`🔑 تم التفعيل بنجاح!\nبيانات ولي الأمر:\nاسم المستخدم: ${username}\nكلمة المرور: ${password}`);

    this.refreshActivePageData();
  }

  async rejectParentRequest(parentId) {
    if (!await this.confirmAction('هل أنت متأكد من رفض وحذف طلب تسجيل ولي الأمر هذا؟')) return;
    this.db.data.parents = this.db.data.parents.filter(p => p.id !== parentId);
    this.db.save();
    this.showToast('تم رفض وحذف الطلب بنجاح', 'info');
    this.refreshActivePageData();
  }

  submitParentRegistrationRequest() {
    const name = document.getElementById('reg-parent-name').value.trim();
    const phone = document.getElementById('reg-parent-phone').value.trim();
    
    if (!name || !phone) {
      this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    const rows = document.querySelectorAll('#registration-students-container .student-confirmation-row');
    const studentIds = [];
    let allValid = true;

    for (let row of rows) {
      const stIdInput = row.querySelector('.reg-student-id');
      if (!stIdInput) continue;
      
      const stId = stIdInput.value.trim();

      if (!stId) {
        this.showToast('يرجى إدخال أكواد جميع الأبناء', 'error');
        allValid = false;
        break;
      }

      // Find student in database (case-insensitive, trim whitespace)
      const stIdNorm = stId.toLowerCase().trim();
      const student = this.db.data.students.find(s => s.id.toLowerCase().trim() === stIdNorm);
      if (!student) {
        this.showToast(`كود الطالب ${stId} غير موجود بالنظام. تأكد من الكود الصحيح الموجود في بطاقة الطالب.`, 'error');
        allValid = false;
        break;
      }

      studentIds.push(student.id);
    }

    if (!allValid) return;

    // Check for duplicate pending or active parent with the same phone
    const existingParent = this.db.data.parents.find(p => p.phone === phone);
    if (existingParent) {
      if (existingParent.pendingApproval) {
        this.showToast('تم إرسال طلب تسجيل بهذا الرقم بالفعل وبانتظار تفعيل الإدارة', 'warning');
      } else {
        this.showToast('رقم هاتف ولي الأمر هذا مسجل بالفعل في النظام', 'error');
      }
      return;
    }

    // Create pending approval parent object
    const parentObj = {
      id: 'PR' + Date.now().toString().substring(8),
      username: '',
      password: '',
      name: name,
      phone: phone,
      email: '',
      studentIds: studentIds,
      active: false,
      pendingApproval: true
    };

    this.db.data.parents.push(parentObj);
    this.db.save();

    // Trigger toast and alert to inform the parent
    this.showToast('تم تقديم طلب التسجيل بنجاح وبانتظار تفعيل الإدارة', 'success');
    alert(`تم تقديم طلبك بنجاح يا أ. ${name}!\nسيرسل لك النظام رسالة بالواتساب تحتوي على بيانات الدخول (اسم المستخدم وكلمة المرور) فور مراجعة وتفعيل حسابك من قبل الإدارة.`);

    // Reset parent registration form
    const parentRegForm = document.getElementById('parent-registration-form');
    if (parentRegForm) parentRegForm.reset();

    // Reset student rows to initial single row
    const regStudentsContainer = document.getElementById('registration-students-container');
    if (regStudentsContainer) {
      regStudentsContainer.innerHTML = `
        <div class="student-confirmation-row" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; align-items: flex-end;">
          <div style="flex: 1; min-width: 140px;">
            <label style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px; display: block;">كود الطالب</label>
            <input type="text" class="form-input reg-student-id" required placeholder="مثال: s00001" style="padding: 8px 10px; font-size: 12.5px;">
          </div>
          <div style="flex: 1.2; min-width: 160px;">
            <label style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px; display: block;">رقم موبايل الطالب أو ولي الأمر المسجل</label>
            <input type="text" class="form-input reg-student-phone" required placeholder="01XXXXXXXXX" style="padding: 8px 10px; font-size: 12.5px;">
          </div>
        </div>
      `;
    }

    // Go back to login view
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('login-card').style.display = 'block';
  }

  openParentModal(parentId = null) {
    const modal = document.getElementById('modal-parent');
    const form = document.getElementById('parent-form');
    const titleEl = document.getElementById('parent-modal-title');
    const actionEl = document.getElementById('parent-form-action');
    const idEl = document.getElementById('parent-form-id');

    form.reset();

    // Populate students list checkboxes
    const checkboxesContainer = document.getElementById('p-students-checkboxes');
    if (checkboxesContainer) {
      checkboxesContainer.innerHTML = '';
      this.db.data.students.forEach(s => {
        checkboxesContainer.innerHTML += `
          <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 13px; cursor: pointer;">
            <input type="checkbox" class="parent-student-cb" value="${s.id}">
            <span>${s.name} (${s.id} - ${s.academicLevel})</span>
          </label>
        `;
      });
    }

    if (parentId) {
      const p = this.db.data.parents.find(x => x.id === parentId);
      if (!p) return;

      titleEl.textContent = this.i18n.currentLang === 'ar' ? 'تعديل حساب ولي الأمر' : 'Edit Parent Account';
      actionEl.value = 'edit';
      idEl.value = p.id;

      document.getElementById('p-name').value = p.name;
      document.getElementById('p-username').value = p.username;
      document.getElementById('p-password').value = p.password;
      document.getElementById('p-phone').value = p.phone;
      document.getElementById('p-email').value = p.email || '';
      document.getElementById('p-status').value = p.active.toString();

      // Check linked students checkboxes
      const activeSIds = p.studentIds || (p.studentId ? [p.studentId] : []);
      const checkboxes = document.querySelectorAll('.parent-student-cb');
      checkboxes.forEach(cb => {
        if (activeSIds.includes(cb.value)) {
          cb.checked = true;
        }
      });
    } else {
      titleEl.textContent = this.i18n.translate('addParent');
      actionEl.value = 'add';
      idEl.value = '';
      document.getElementById('p-status').value = 'true';
    }

    modal.style.display = 'flex';
    lucide.createIcons();
  }

  saveParentForm() {
    const action = document.getElementById('parent-form-action').value;
    const id = document.getElementById('parent-form-id').value;

    const username = document.getElementById('p-username').value.trim();
    const password = document.getElementById('p-password').value;

    if (!username || !password) {
      this.showToast('اسم المستخدم وكلمة المرور مطلوبان', 'error');
      return;
    }

    const isDuplicate = this.db.data.parents.some(p => 
      p.username === username && p.id !== id
    );
    if (isDuplicate) {
      this.showToast('اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر', 'error');
      return;
    }

    const checkedCbs = document.querySelectorAll('.parent-student-cb:checked');
    const selectedStudentIds = Array.from(checkedCbs).map(cb => cb.value);

    if (selectedStudentIds.length === 0) {
      this.showToast('يرجى تحديد طالب واحد على الأقل لربطه بولي الأمر', 'error');
      return;
    }

    const parentObj = {
      id: action === 'add' ? 'PR' + Date.now().toString().substring(8) : id,
      username: username,
      password: password,
      name: document.getElementById('p-name').value,
      phone: document.getElementById('p-phone').value,
      email: document.getElementById('p-email').value,
      studentIds: selectedStudentIds,
      active: document.getElementById('p-status').value === 'true'
    };

    if (action === 'add') {
      this.db.data.parents.push(parentObj);
      this.showToast('Parent account created / تم إنشاء حساب ولي الأمر بنجاح', 'success');
    } else {
      const idx = this.db.data.parents.findIndex(x => x.id === id);
      if (idx !== -1) {
        this.db.data.parents[idx] = parentObj;
        this.showToast('Parent account updated / تم تحديث بيانات ولي الأمر', 'success');
      }
    }

    this.db.save();
    document.getElementById('modal-parent').style.display = 'none';
    this.renderParentsMgmtList();
  }

  async deleteParent(id) {
    if (!await this.confirmAction('هل أنت متأكد من حذف حساب ولي الأمر هذا؟ / Are you sure you want to delete this parent account?')) return;
    this.db.data.parents = this.db.data.parents.filter(x => x.id !== id);
    this.db.save();
    this.showToast('Parent deleted / تم حذف ولي الأمر', 'success');
    this.renderParentsMgmtList();
  }

  // ==================== GROUPS & ATTENDANCES RENDERS ====================
  renderGroupsList() {
    const tbody = document.getElementById('groups-table-body');
    tbody.innerHTML = '';

    this.db.data.groups.forEach(g => {
      const enrolled = this.db.data.students.filter(s => s.groupId === g.id).length;
      const groupName = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
      const teacher = this.db.data.teachers.find(t => t.id === g.teacherId);
      const teacherName = teacher ? (this.i18n.currentLang === 'ar' ? teacher.nameAr : teacher.nameEn) : '-';
      
      const levelsList = Array.isArray(g.level) ? g.level.join(', ') : g.level;

      tbody.innerHTML += `
        <tr class="fade-in">
          <td><strong>${groupName}</strong><br><small style="color:var(--text-muted);">${teacherName}</small></td>
          <td><span class="badge" style="background-color:var(--primary-light); color:var(--primary);">${levelsList}</span></td>
          <td>${g.subject}</td>
          <td><code>${g.timeSlot}</code></td>
          <td class="admin-only"><strong>${g.fee} ${this.i18n.translate('currency')}</strong></td>
          <td>${g.maxStudents}</td>
          <td><span style="font-weight:700; color:${enrolled >= g.maxStudents ? 'var(--danger)' : 'var(--success)'};">${enrolled} / ${g.maxStudents}</span></td>
          <td class="admin-only">
            <div class="card-actions-wrapper">
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:11.5px;" onclick="window.appInstance.openGroupModal('${g.id}')">تعديل</button>
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:11.5px; color:var(--danger);" onclick="window.appInstance.deleteGroup('${g.id}')">حذف</button>
            </div>
          </td>
        </tr>
      `;
    });

    lucide.createIcons();
    this.configureSidebarPermissions();
  }

  async deleteGroup(id) {
    if (!await this.confirmAction('تحذير: حذف المجموعة سيؤدي إلى إلغاء تعيينها لكل طلابها. هل أنت متأكد؟')) return;
    this.db.data.groups = this.db.data.groups.filter(g => g.id !== id);
    this.db.save();
    this.showToast('تم حذف المجموعة بنجاح / Group deleted', 'success');
    this.renderGroupsList();
  }

  openGroupModal(groupId = null) {
    const modal = document.getElementById('modal-group');
    const form = document.getElementById('group-form');
    const titleEl = document.getElementById('group-modal-title');
    const actionEl = document.getElementById('group-form-action');
    const idEl = document.getElementById('group-form-id');

    form.reset();

    // Populate teachers dropdown
    const teacherSelect = document.getElementById('grp-teacher');
    teacherSelect.innerHTML = '';
    this.db.data.teachers.forEach(t => {
      const name = this.i18n.currentLang === 'ar' ? t.nameAr : t.nameEn;
      teacherSelect.innerHTML += `<option value="${t.id}">${name}</option>`;
    });

    // Populate levels checkboxes
    const levels = [
      'KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'الأول إعدادي', 'الثاني إعدادي', 'الثالث إعدادي', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'
    ];
    const checkboxesContainer = document.getElementById('grp-levels-checkboxes');
    if (checkboxesContainer) {
      checkboxesContainer.innerHTML = '';
      levels.forEach(lvl => {
        checkboxesContainer.innerHTML += `
          <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 13px; cursor: pointer;">
            <input type="checkbox" class="group-level-cb" value="${lvl}">
            <span>${lvl}</span>
          </label>
        `;
      });
    }

    if (groupId) {
      const g = this.db.data.groups.find(x => x.id === groupId);
      if (!g) return;

      titleEl.textContent = this.i18n.currentLang === 'ar' ? 'تعديل بيانات المجموعة' : 'Edit Group';
      actionEl.value = 'edit';
      idEl.value = g.id;

      document.getElementById('grp-name-ar').value = g.nameAr;
      document.getElementById('grp-name-en').value = g.nameEn;
      document.getElementById('grp-subject').value = g.subject;
      document.getElementById('grp-teacher').value = g.teacherId || (this.db.data.teachers[0] ? this.db.data.teachers[0].id : '');
      document.getElementById('grp-max').value = g.maxStudents;
      document.getElementById('grp-timeslot').value = g.timeSlot || '';
      document.getElementById('grp-fee').value = g.fee;
      document.getElementById('grp-sessions').value = g.sessionCount || 8;

      // Check active levels checkboxes
      const activeLevels = Array.isArray(g.level) ? g.level : [g.level];
      const checkboxes = document.querySelectorAll('.group-level-cb');
      checkboxes.forEach(cb => {
        if (activeLevels.includes(cb.value)) {
          cb.checked = true;
        }
      });
    } else {
      titleEl.textContent = this.i18n.translate('addGroup') || 'إضافة مجموعة جديدة';
      actionEl.value = 'add';
      idEl.value = '';
      document.getElementById('grp-max').value = 40;
      document.getElementById('grp-fee').value = 350;
      document.getElementById('grp-sessions').value = 8;
      
      if (this.db.data.teachers.length > 0) {
        teacherSelect.value = this.db.data.teachers[0].id;
      }
    }

    modal.style.display = 'flex';
    lucide.createIcons();
  }

  saveGroupForm() {
    const action = document.getElementById('group-form-action').value;
    const id = document.getElementById('group-form-id').value;

    const nameAr = document.getElementById('grp-name-ar').value.trim();
    const nameEn = document.getElementById('grp-name-en').value.trim();

    if (!nameAr || !nameEn) {
      this.showToast('يرجى كتابة اسم المجموعة بالعربية والإنجليزية', 'error');
      return;
    }

    const checkedCbs = document.querySelectorAll('.group-level-cb:checked');
    const selectedLevels = Array.from(checkedCbs).map(cb => cb.value);

    if (selectedLevels.length === 0) {
      this.showToast('يرجى اختيار مستوى أكاديمي واحد على الأقل للمجموعة', 'error');
      return;
    }

    const newId = action === 'add' 
      ? 'G-' + nameEn.substring(0, 3).toUpperCase().replace(/\s/g, '') + Date.now().toString().substring(10)
      : id;

    const groupObj = {
      id: newId,
      nameAr: nameAr,
      nameEn: nameEn,
      level: selectedLevels,
      subject: document.getElementById('grp-subject').value,
      teacherId: document.getElementById('grp-teacher').value,
      maxStudents: parseInt(document.getElementById('grp-max').value) || 40,
      timeSlot: document.getElementById('grp-timeslot').value,
      fee: parseFloat(document.getElementById('grp-fee').value) || 0,
      sessionCount: parseInt(document.getElementById('grp-sessions').value) || 8
    };

    if (action === 'add') {
      this.db.data.groups.push(groupObj);
      this.showToast('تم إضافة المجموعة بنجاح / Group added successfully', 'success');
    } else {
      const idx = this.db.data.groups.findIndex(x => x.id === id);
      if (idx !== -1) {
        this.db.data.groups[idx] = groupObj;
        this.showToast('تم تحديث بيانات المجموعة / Group updated', 'success');
      }
    }

    this.db.save();
    document.getElementById('modal-group').style.display = 'none';
    this.renderGroupsList();
    this.initSelectOptions();
  }

  // ==================== ADMINS ACCOUNT MANAGEMENT (CRUD) ====================
  renderAdminsMgmtList() {
    const tbody = document.getElementById('admins-mgmt-table-body');
    tbody.innerHTML = '';
    
    const admins = this.db.data.admins || [];

    admins.forEach(a => {
      const isOwner = a.id === 'a00001';
      const ownerBadge = isOwner ? ' <span class="badge" style="background-color:var(--warning-light); color:var(--warning); font-size:10px;">صاحب السنتر</span>' : '';

      tbody.innerHTML += `
        <tr class="fade-in" style="cursor: pointer;" onclick="window.appInstance.showAccountDetails('admin', '${a.id}')">
          <td><strong>${a.name}</strong>${ownerBadge}</td>
          <td><code>${a.username}</code></td>
          <td><code>${a.password}</code></td>
        </tr>
      `;
    });
  }

  openAdminModal(adminId = null) {
    const modal = document.getElementById('modal-admin');
    const form = document.getElementById('admin-form');
    const titleEl = document.getElementById('admin-modal-title');
    const actionEl = document.getElementById('admin-form-action');
    const idEl = document.getElementById('admin-form-id');

    form.reset();
    document.getElementById('adm-avatar').value = '';

    if (adminId) {
      const a = (this.db.data.admins || []).find(x => x.id === adminId);
      if (!a) return;

      titleEl.textContent = this.i18n.currentLang === 'ar' ? 'تعديل حساب المدير' : 'Edit Admin Account';
      actionEl.value = 'edit';
      idEl.value = a.id;

      document.getElementById('adm-name').value = a.name;
      document.getElementById('adm-username').value = a.username;
      document.getElementById('adm-password').value = a.password;
      document.getElementById('adm-phone').value = a.phone || '';
      document.getElementById('adm-email').value = a.email || '';
      document.getElementById('adm-status').value = a.active.toString();
    } else {
      titleEl.textContent = this.i18n.currentLang === 'ar' ? 'إضافة مدير جديد' : 'Add Administrator';
      actionEl.value = 'add';
      idEl.value = '';
      document.getElementById('adm-status').value = 'true';
    }

    modal.style.display = 'flex';
    lucide.createIcons();
  }

  saveAdminForm() {
    const action = document.getElementById('admin-form-action').value;
    const id = document.getElementById('admin-form-id').value;

    const username = document.getElementById('adm-username').value.trim();
    const password = document.getElementById('adm-password').value;

    if (!username || !password) {
      this.showToast('اسم المستخدم وكلمة المرور مطلوبان', 'error');
      return;
    }

    // Ensure admins array exists
    if (!this.db.data.admins) this.db.data.admins = [];

    // Check for duplicate username (excluding current admin being edited)
    const isDuplicate = this.db.data.admins.some(a => 
      a.username === username && a.id !== id
    );
    if (isDuplicate) {
      this.showToast('اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر', 'error');
      return;
    }

    const buildAdminObj = (avatarDataUrl) => {
      const adminObj = {
        id: action === 'add' ? 'AD' + Date.now().toString().substring(8) : id,
        name: document.getElementById('adm-name').value,
        username: username,
        password: password,
        phone: document.getElementById('adm-phone').value,
        email: document.getElementById('adm-email').value,
        avatar: avatarDataUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        active: document.getElementById('adm-status').value === 'true'
      };

      if (action === 'add') {
        this.db.data.admins.push(adminObj);
        this.showToast('تم إنشاء حساب المدير بنجاح / Admin account created', 'success');
      } else {
        const idx = this.db.data.admins.findIndex(x => x.id === id);
        if (idx !== -1) {
          if (!avatarDataUrl) {
            adminObj.avatar = this.db.data.admins[idx].avatar;
          }
          this.db.data.admins[idx] = adminObj;
          this.showToast('تم تحديث بيانات المدير / Admin updated', 'success');
        }
      }

      this.db.save();
      // If the current logged-in user is editing their own profile, update sidebar badge instantly
      if (this.currentUser && this.currentUser.username === username) {
        this.updateUserHeaderBadge();
      }
      document.getElementById('modal-admin').style.display = 'none';
      this.renderAdminsMgmtList();
    };

    const avatarInput = document.getElementById('adm-avatar');
    if (avatarInput.files && avatarInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => buildAdminObj(e.target.result);
      reader.readAsDataURL(avatarInput.files[0]);
    } else {
      buildAdminObj(null);
    }
  }

  async deleteAdmin(id) {
    if (id === 'a00001') {
      alert('لا يمكن حذف حساب صاحب السنتر!');
      return;
    }
    if (!await this.confirmAction('هل أنت متأكد من حذف هذا الحساب الإداري؟')) return;
    this.db.data.admins = (this.db.data.admins || []).filter(x => x.id !== id);
    this.db.save();
    this.showToast('تم حذف حساب المدير / Admin deleted', 'success');
    this.renderAdminsMgmtList();
  }

  populateAttendanceDropdowns() {
    const simSelect = document.getElementById('attendance-sim-student-select');
    const manSelect = document.getElementById('attendance-manual-student-select');
    const logGroup = document.getElementById('attendance-log-group');
    const attGroupSelect = document.getElementById('attendance-group-select');
    
    let dateInput = document.getElementById('attendance-log-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().substring(0, 10);
    }
    
    let attDateSelect = document.getElementById('attendance-date-select');
    if (attDateSelect && !attDateSelect.value) {
      attDateSelect.value = new Date().toISOString().substring(0, 10);
    }
    
    const selectedDateVal = dateInput ? dateInput.value : new Date().toISOString().substring(0, 10);
    const dateObj = new Date(selectedDateVal);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selectedDay = dayNames[dateObj.getDay()];
    
    const dayNameAr = {
      'Sat': 'السبت', 'Sun': 'الأحد', 'Mon': 'الإثنين', 'Tue': 'الثلاثاء', 'Wed': 'الأربعاء', 'Thu': 'الخميس', 'Fri': 'الجمعة'
    };
    
    const activeGroups = this.db.data.groups.filter(g => g.timeSlot.includes(selectedDay));
    const activeGroupIds = activeGroups.map(g => g.id);

    const scheduleInfoEl = document.getElementById('attendance-schedule-info');
    if (scheduleInfoEl) {
      if (activeGroups.length > 0) {
        const groupNames = activeGroups.map(g => this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn).join('، ');
        scheduleInfoEl.innerHTML = `<span style="font-size:12.5px; font-weight:700; color:var(--primary); background:var(--primary-light); padding:4px 8px; border-radius:4px; margin-bottom:12px; display:inline-block;">مجموعات يوم ${dayNameAr[selectedDay] || selectedDay}: ${groupNames}</span>`;
      } else {
        scheduleInfoEl.innerHTML = `<span style="font-size:12.5px; font-weight:700; color:var(--danger); background:var(--danger-light); padding:4px 8px; border-radius:4px; margin-bottom:12px; display:inline-block;">لا توجد مجموعات مجدولة ليوم ${dayNameAr[selectedDay] || selectedDay}</span>`;
      }
    }

    if (simSelect) simSelect.innerHTML = '<option value="">اختر طالباً للمحاكاة...</option>';
    if (manSelect) manSelect.innerHTML = '<option value="">اختر طالباً للتحضير اليدوي...</option>';
    if (logGroup) logGroup.innerHTML = '<option value="">كل المجموعات</option>';
    if (attGroupSelect && attGroupSelect.innerHTML === '') {
      attGroupSelect.innerHTML = '<option value="">اختر المجموعة...</option>';
    }

    this.db.data.students.forEach(s => {
      if (activeGroupIds.includes(s.groupId)) {
        if (simSelect) simSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.id})</option>`;
        if (manSelect) manSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.id})</option>`;
      }
    });

    const currentGroupVal = attGroupSelect ? attGroupSelect.value : '';
    if (attGroupSelect) {
      attGroupSelect.innerHTML = '<option value="">اختر المجموعة...</option>';
    }
    
    this.db.data.groups.forEach(g => {
      const name = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
      if (logGroup) logGroup.innerHTML += `<option value="${g.id}">${name}${activeGroupIds.includes(g.id) ? ' (مجدول اليوم)' : ''}</option>`;
      if (attGroupSelect) {
        attGroupSelect.innerHTML += `<option value="${g.id}">${name}</option>`;
      }
    });
    
    if (attGroupSelect && currentGroupVal) {
      attGroupSelect.value = currentGroupVal;
    }
  }

  startQrScanner() {
    document.getElementById('btn-start-scanner').style.display = 'none';
    document.getElementById('btn-stop-scanner').style.display = 'inline-flex';
    document.getElementById('laser-line').style.display = 'block';

    const qrReaderEl = document.getElementById('qr-reader');
    qrReaderEl.innerHTML = '';

    this.html5QrcodeScanner = new Html5Qrcode('qr-reader');
    this.html5QrcodeScanner.start(
      { facingMode: 'user' },
      { fps: 10, qrbox: 200 },
      (decodedText) => {
        this.handleQrScanSuccess(decodedText);
      },
      (errorMessage) => {}
    ).catch(err => {
      this.showToast('فشل فتح الكاميرا: يرجى التحقق من الأذونات أو استخدام المحاكي المدمج', 'error');
      this.stopQrScanner();
    });
  }

  stopQrScanner() {
    document.getElementById('btn-start-scanner').style.display = 'inline-flex';
    document.getElementById('btn-stop-scanner').style.display = 'none';
    document.getElementById('laser-line').style.display = 'none';

    if (this.html5QrcodeScanner) {
      this.html5QrcodeScanner.stop().then(() => {
        this.html5QrcodeScanner = null;
        document.getElementById('qr-reader').innerHTML = '';
      }).catch(err => console.log('Error stopping scanner', err));
    }
  }

  handleQrScanSuccess(decodedText) {
    try {
      let payload = JSON.parse(decodedText);
      if (payload && payload.id) {
        this.logAttendanceRecord(payload.id, 'QR Code');
      }
    } catch (e) {
      if (decodedText.startsWith('ST')) {
        this.logAttendanceRecord(decodedText, 'QR Code');
      } else {
        this.showToast('الرمز الممسوح غير صالح / Invalid code format', 'error');
      }
    }
  }

  processBarcodeScannerInput() {
    const inputEl = document.getElementById('attendance-barcode-input');
    const code = inputEl.value.trim();
    if (!code) return;

    const student = this.db.data.students.find(s => s.barcode === code || s.id === code);
    if (student) {
      this.logAttendanceRecord(student.id, 'Barcode');
      inputEl.value = '';
    } else {
      this.showToast('رمز الباركود غير مسجل بالنظام / Barcode not registered', 'error');
    }
  }

  simulateAttendanceScan(method) {
    const studentId = document.getElementById('attendance-sim-student-select').value;
    if (!studentId) {
      this.showToast('يرجى اختيار طالب أولاً / Please select student first', 'event-error');
      return;
    }
    this.logAttendanceRecord(studentId, method);
  }

  submitManualAttendance() {
    const studentId = document.getElementById('attendance-manual-student-select').value;
    const status = document.getElementById('attendance-manual-status').value;
    
    if (!studentId) return;
    this.logAttendanceRecord(studentId, 'Manual', status);
  }

  logAttendanceRecord(studentId, method, customStatus = 'present') {
    const student = this.db.data.students.find(s => s.id === studentId);
    if (!student) {
      this.showToast('طالب غير مسجل / Student profile not found', 'error');
      return;
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const exists = this.db.data.attendance.find(a => a.studentId === studentId && a.date === todayStr);
    
    if (exists) {
      exists.status = customStatus;
      exists.scanMethod = method;
      exists.time = customStatus === 'absent' ? '' : timeStr;
      this.showToast(`تم تحديث التحضير: ${student.name} (${customStatus})`, 'info');
    } else {
      const newRecord = {
        id: 'ATT' + Date.now().toString().substring(7),
        studentId: studentId,
        groupId: student.groupId,
        date: todayStr,
        time: customStatus === 'absent' ? '' : timeStr,
        status: customStatus,
        scanMethod: method
      };
      
      this.db.data.attendance.push(newRecord);
      this.showToast(`تم تسجيل الحضور: ${student.name}`, 'success');
      this.playBeep();
    }

    this.db.save();
    
    if (customStatus === 'present' || customStatus === 'late') {
      this.triggerWhatsAppNotification(studentId, 'attendance');
    } else if (customStatus === 'absent') {
      this.triggerWhatsAppNotification(studentId, 'absence');
    }

    this.renderAttendanceLogs();
  }

  renderAttendanceLogs() {
    const tbody = document.getElementById('attendance-log-table-body');
    tbody.innerHTML = '';

    const filterDate = document.getElementById('attendance-log-date').value;
    const filterGroup = document.getElementById('attendance-log-group').value;

    let studentsList = this.db.data.students;

    if (filterGroup) {
      studentsList = studentsList.filter(s => s.groupId === filterGroup);
    }

    studentsList.forEach(student => {
      const record = this.db.data.attendance.find(a => a.studentId === student.id && a.date === filterDate);
      const status = record ? record.status : 'absent';
      const time = record ? record.time : '-';
      const method = record ? record.scanMethod : '-';

      const groupObj = this.db.data.groups.find(g => g.id === student.groupId);
      const groupName = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';

      let badgeClass = 'badge-absent';
      if (status === 'present') badgeClass = 'badge-present';
      if (status === 'late') badgeClass = 'badge-late';

      tbody.innerHTML += `
        <tr class="fade-in">
          <td><strong>${student.name}</strong></td>
          <td>${groupName}</td>
          <td>${filterDate}</td>
          <td>${time}</td>
          <td><span class="badge ${badgeClass}">${this.i18n.translate(status)}</span></td>
          <td>${method}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.appInstance.changeStudentAttendanceStatus('${student.id}', '${filterDate}', 'present')">حاضر</button>
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.appInstance.changeStudentAttendanceStatus('${student.id}', '${filterDate}', 'absent')">غائب</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  changeStudentAttendanceStatus(studentId, date, newStatus) {
    const recordIdx = this.db.data.attendance.findIndex(a => a.studentId === studentId && a.date === date);
    if (recordIdx !== -1) {
      this.db.data.attendance[recordIdx].status = newStatus;
      this.db.data.attendance[recordIdx].time = newStatus === 'absent' ? '' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      this.db.data.attendance.push({
        id: 'ATT' + Date.now().toString().substring(7),
        studentId: studentId,
        groupId: this.db.data.students.find(s => s.id === studentId).groupId,
        date: date,
        time: newStatus === 'absent' ? '' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: newStatus,
        scanMethod: 'Manual'
      });
    }
    this.db.save();
    this.showToast('Attendance updated / تم تحديث الحضور', 'success');
    this.renderAttendanceLogs();
    this.triggerWhatsAppNotification(studentId, newStatus === 'absent' ? 'absence' : 'attendance');
  }

  // ==================== GRADES AND EXAMS RENDERS ====================
  populateGradesDropdowns() {
    if (this.selectedGradesMonth === undefined) {
      this.selectedGradesMonth = new Date().getMonth();
    }

    const groupSelect = document.getElementById('grade-group-select');
    const filterGroupSelect = document.getElementById('filter-grade-group');
    
    const prevGroupVal = groupSelect ? groupSelect.value : '';
    const prevFilterVal = filterGroupSelect ? filterGroupSelect.value : '';

    if (groupSelect) {
      groupSelect.innerHTML = '<option value="">اختر المجموعة...</option>';
      this.db.data.groups.forEach(g => {
        const name = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
        groupSelect.innerHTML += `<option value="${g.id}">${name}</option>`;
      });
      groupSelect.value = prevGroupVal;
    }

    if (filterGroupSelect) {
      filterGroupSelect.innerHTML = '<option value="">كل المجموعات</option>';
      this.db.data.groups.forEach(g => {
        const name = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
        filterGroupSelect.innerHTML += `<option value="${g.id}">${name}</option>`;
      });
      filterGroupSelect.value = prevFilterVal;
    }

    const dateInput = document.getElementById('grade-exam-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().substring(0, 10);
    }

    // Month filter tabs
    const monthContainer = document.getElementById('grades-month-filter');
    if (monthContainer) {
      monthContainer.innerHTML = '';
      const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = `btn btn-sm ${this.selectedGradesMonth === null ? 'btn-primary active' : 'btn-secondary'}`;
      allBtn.textContent = 'الكل';
      allBtn.style.padding = '4px 12px';
      allBtn.style.fontSize = '12px';
      allBtn.onclick = () => {
        this.selectedGradesMonth = null;
        this.populateGradesDropdowns();
        this.renderGradesTable();
      };
      monthContainer.appendChild(allBtn);

      arMonths.forEach((mName, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-sm ${this.selectedGradesMonth === idx ? 'btn-primary active' : 'btn-secondary'}`;
        btn.textContent = mName;
        btn.style.padding = '4px 12px';
        btn.style.fontSize = '12px';
        btn.onclick = () => {
          this.selectedGradesMonth = idx;
          this.populateGradesDropdowns();
          this.renderGradesTable();
        };
        monthContainer.appendChild(btn);
      });
    }
  }

  populateGradesStudentsList(groupId) {
    const container = document.getElementById('grade-students-list-container');
    const tbody = document.getElementById('grade-students-table-body');
    if (!container || !tbody) return;

    if (!groupId) {
      container.style.display = 'none';
      tbody.innerHTML = '';
      return;
    }

    tbody.innerHTML = '';
    const students = this.db.data.students.filter(s => s.groupId === groupId);

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">لا يوجد طلاب مسجلين في هذه المجموعة</td></tr>';
    } else {
      students.forEach(s => {
        tbody.innerHTML += `
          <tr>
            <td style="text-align: right;"><strong>${s.name}</strong></td>
            <td><code>${s.id}</code></td>
            <td>
              <input type="number" class="grade-student-input form-input" data-student-id="${s.id}" min="0" style="width:100px; margin:0 auto; text-align:center;" placeholder="0">
            </td>
          </tr>
        `;
      });
    }
    container.style.display = 'block';
  }

  submitGroupGradesRecord() {
    const groupId = document.getElementById('grade-group-select').value;
    const examTitle = document.getElementById('grade-exam-title').value.trim();
    const examType = document.getElementById('grade-exam-type').value;
    const totalMarks = parseFloat(document.getElementById('grade-total-marks').value);
    const examDate = document.getElementById('grade-exam-date').value;

    if (!groupId || !examTitle || isNaN(totalMarks)) {
      this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    const inputs = document.querySelectorAll('.grade-student-input');
    let validated = true;
    let scores = [];

    inputs.forEach(input => {
      const scoreVal = parseFloat(input.value);
      if (!isNaN(scoreVal)) {
        if (scoreVal > totalMarks) {
          this.showToast(`درجة الطالب لا يمكن أن تتعدى الدرجة الكلية (${totalMarks})!`, 'error');
          validated = false;
        }
        scores.push({
          studentId: input.dataset.studentId,
          score: scoreVal
        });
      }
    });

    if (!validated) return;

    if (scores.length === 0) {
      this.showToast('يرجى إدخال درجة واحدة على الأقل لأحد الطلاب', 'error');
      return;
    }

    scores.forEach(item => {
      const newGrade = {
        id: 'g' + Date.now().toString().substring(7) + Math.floor(Math.random() * 100),
        studentId: item.studentId,
        title: examTitle,
        type: examType,
        totalMarks: totalMarks,
        score: item.score,
        date: examDate,
        notes: ''
      };
      this.db.data.grades.unshift(newGrade);
      this.triggerWhatsAppNotification(item.studentId, 'grades', { score: item.score, total: totalMarks, title: examTitle });
    });

    this.db.save();
    this.showToast('Grades recorded / تم تسجيل الدرجات بنجاح', 'success');

    // Reset Form
    document.getElementById('grade-exam-title').value = '';
    document.getElementById('grade-total-marks').value = '';
    document.getElementById('grade-group-select').value = '';
    document.getElementById('grade-students-list-container').style.display = 'none';
    document.getElementById('grade-students-table-body').innerHTML = '';

    this.renderGradesTable();
  }

  renderGradesTable() {
    const tbody = document.getElementById('grades-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filterGroup = document.getElementById('filter-grade-group') ? document.getElementById('filter-grade-group').value : '';
    let gradesList = this.db.data.grades;

    // Filter by group
    if (filterGroup) {
      gradesList = gradesList.filter(g => {
        const student = this.db.data.students.find(s => s.id === g.studentId);
        return student && student.groupId === filterGroup;
      });
    }

    // Filter by month
    if (this.selectedGradesMonth !== null && this.selectedGradesMonth !== undefined) {
      gradesList = gradesList.filter(g => {
        const d = new Date(g.date);
        return !isNaN(d.getTime()) && d.getMonth() === this.selectedGradesMonth;
      });
    }

    if (gradesList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);">لا يوجد درجات مسجلة في هذا الشهر / No grades registered</td></tr>';
      return;
    }

    gradesList.forEach(g => {
      const student = this.db.data.students.find(s => s.id === g.studentId);
      if (!student) return;

      const groupObj = this.db.data.groups.find(grp => grp.id === student.groupId);
      const groupName = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : '-';
      const pct = ((g.score / g.totalMarks) * 100).toFixed(0);

      tbody.innerHTML += `
        <tr class="fade-in">
          <td style="text-align: right;"><strong>${student.name}</strong></td>
          <td>${student.id}</td>
          <td>${student.phone}</td>
          <td>${groupName}</td>
          <td>${g.title}</td>
          <td>${g.type}</td>
          <td><strong style="color:var(--primary);">${g.score}</strong></td>
          <td>${g.totalMarks}</td>
          <td><span style="font-weight:700;">${pct}%</span></td>
          <td>${g.date}</td>
          <td>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px; color:var(--danger);" onclick="window.appInstance.deleteGrade('${g.id}')">حذف</button>
          </td>
        </tr>
      `;
    });
  }

  async deleteGrade(id) {
    if (!await this.confirmAction('هل أنت متأكد من حذف هذه الدرجة؟ / Are you sure?')) return;
    this.db.data.grades = this.db.data.grades.filter(g => g.id !== id);
    this.db.save();
    this.showToast('Grade deleted / تم حذف الدرجة', 'success');
    this.renderGradesTable();
  }

  // ==================== FINANCIAL MANAGEMENT RENDERS ====================
  populateFinanceDropdowns() {
    if (this.selectedFinanceMonth === undefined) {
      this.selectedFinanceMonth = new Date().getMonth();
    }
    if (this.selectedFinanceGroup === undefined) {
      this.selectedFinanceGroup = null;
    }

    const selectTx = document.getElementById('finance-tx-student');
    if (selectTx) {
      selectTx.innerHTML = '<option value="">لا يوجد / None (طالب عام)</option>';
      this.db.data.students.forEach(s => {
        selectTx.innerHTML += `<option value="${s.id}">${s.name}</option>`;
      });
    }

    // Populate month buttons
    const monthContainer = document.getElementById('finance-month-filter');
    if (monthContainer) {
      monthContainer.innerHTML = '';
      const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      
      arMonths.forEach((mName, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-sm ${this.selectedFinanceMonth === idx ? 'btn-primary active' : 'btn-secondary'}`;
        btn.textContent = mName;
        btn.style.padding = '4px 12px';
        btn.style.fontSize = '12px';
        btn.onclick = () => {
          this.selectedFinanceMonth = idx;
          this.populateFinanceDropdowns();
          this.renderFinanceStudentsTable();
        };
        monthContainer.appendChild(btn);
      });
    }

    // Populate group buttons
    const groupContainer = document.getElementById('finance-group-filter');
    if (groupContainer) {
      groupContainer.innerHTML = '';
      this.db.data.groups.forEach(g => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-sm ${this.selectedFinanceGroup === g.id ? 'btn-primary active' : 'btn-secondary'}`;
        btn.textContent = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
        btn.style.padding = '4px 12px';
        btn.style.fontSize = '12px';
        btn.onclick = () => {
          this.selectedFinanceGroup = g.id;
          this.populateFinanceDropdowns();
          this.renderFinanceStudentsTable();
        };
        groupContainer.appendChild(btn);
      });
    }
  }

  submitFinanceTransaction() {
    const type = document.getElementById('finance-tx-type').value;
    const studentId = document.getElementById('finance-tx-student').value;
    const category = document.getElementById('finance-tx-category').value;
    const amount = parseFloat(document.getElementById('finance-tx-amount').value);
    const desc = document.getElementById('finance-tx-desc').value;

    const newTx = {
      id: 'TX' + Date.now().toString().substring(7),
      type: type,
      amount: amount,
      category: category,
      date: new Date().toISOString().substring(0, 10),
      studentId: type === 'income' ? studentId : '',
      desc: desc
    };

    this.db.data.transactions.unshift(newTx);
    this.db.save();

    this.showToast('Transaction logged / تم حفظ المعاملة المالية', 'success');
    document.getElementById('finance-tx-amount').value = '';
    document.getElementById('finance-tx-desc').value = '';
    
    this.renderFinanceTable();
    
    if (type === 'income' && studentId) {
      this.triggerWhatsAppNotification(studentId, 'payment', { amount: amount });
    }
  }

  renderFinanceTable() {
    const tbodyTx = document.getElementById('transactions-table-body');
    tbodyTx.innerHTML = '';

    this.db.data.transactions.forEach(tx => {
      const typeLabel = tx.type === 'income' 
        ? `<span class="badge badge-present">${this.i18n.translate('income')}</span>` 
        : `<span class="badge badge-absent">${this.i18n.translate('expense')}</span>`;
      
      tbodyTx.innerHTML += `
        <tr class="fade-in">
          <td><code>${tx.id}</code></td>
          <td>${typeLabel}</td>
          <td><strong style="color: ${tx.type === 'income' ? 'var(--success)' : 'var(--danger)'};">${tx.amount} ${this.i18n.translate('currency')}</strong></td>
          <td>${this.i18n.translate(tx.category) || tx.category}</td>
          <td>${tx.date}</td>
          <td>${tx.desc}</td>
          <td>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px; color:var(--danger);" onclick="window.appInstance.deleteTransaction('${tx.id}')">حذف</button>
          </td>
        </tr>
      `;
    });

    this.renderFinanceStudentsTable();
  }

  renderFinanceStudentsTable() {
    const container = document.getElementById('finance-students-container');
    const tbody = document.getElementById('finance-students-table-body');
    if (!container || !tbody) return;

    if (this.selectedFinanceMonth === null || this.selectedFinanceMonth === undefined || !this.selectedFinanceGroup) {
      container.style.display = 'none';
      tbody.innerHTML = '';
      return;
    }

    tbody.innerHTML = '';
    const students = this.db.data.students.filter(s => s.groupId === this.selectedFinanceGroup);
    const currentYear = new Date().getFullYear();

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">لا يوجد طلاب مسجلين في هذه المجموعة</td></tr>';
    } else {
      students.forEach(s => {
        const paymentTx = this.db.data.transactions.find(tx => 
          tx.type === 'income' && 
          tx.studentId === s.id && 
          tx.category === 'monthly-fees' && 
          new Date(tx.date).getMonth() === this.selectedFinanceMonth && 
          new Date(tx.date).getFullYear() === currentYear
        );

        let statusBadge = '';
        let actionBtn = '';

        if (paymentTx) {
          statusBadge = `<span class="badge" style="background-color: var(--success-light); color: var(--success); font-weight:700; padding:6px 12px; font-size:11px;">تم الدفع ✔</span>`;
          actionBtn = `<button class="btn btn-secondary" style="padding:6px 12px; font-size:11.5px; color:var(--danger); font-weight:700;" onclick="window.appInstance.toggleFinancePayment('${s.id}', false, '${paymentTx.id}')">إلغاء الدفع ✖</button>`;
        } else {
          statusBadge = `<span class="badge" style="background-color: var(--danger-light); color: var(--danger); font-weight:700; padding:6px 12px; font-size:11px;">لم يتم الدفع ✖</span>`;
          actionBtn = `<button class="btn btn-success" style="padding:6px 12px; font-size:11.5px; font-weight:700;" onclick="window.appInstance.toggleFinancePayment('${s.id}', true)">تسجيل دفع ✔</button>`;
        }

        tbody.innerHTML += `
          <tr>
            <td style="text-align: right; font-weight: 600;">${s.name}</td>
            <td><code>${s.id}</code></td>
            <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary); font-size:10.5px;">${s.subscriptionType === 'monthly' ? 'شهري' : 'بالحصة'} - ${s.monthlyFee} ج.م</span></td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
          </tr>
        `;
      });
    }

    container.style.display = 'block';
    lucide.createIcons();
  }

  async toggleFinancePayment(studentId, isPaying, txId = null) {
    const student = this.db.data.students.find(s => s.id === studentId);
    if (!student) return;

    if (isPaying) {
      const groupObj = this.db.data.groups.find(g => g.id === student.groupId);
      const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const selectedMonthName = monthNamesAr[this.selectedFinanceMonth];

      const newTx = {
        id: 'TX' + Date.now().toString().substring(7) + Math.floor(Math.random() * 100),
        type: 'income',
        amount: student.monthlyFee || (groupObj ? groupObj.fee : 300),
        category: 'monthly-fees',
        date: new Date(new Date().getFullYear(), this.selectedFinanceMonth, 15).toISOString().substring(0, 10),
        studentId: studentId,
        desc: `سداد اشتراك شهر ${selectedMonthName} - الطالب ${student.name}`
      };

      this.db.data.transactions.unshift(newTx);
      this.db.save();

      this.showToast(`تم تسجيل دفعة بقيمة ${newTx.amount} ج.م للطالب ${student.name}`, 'success');
      this.triggerWhatsAppNotification(studentId, 'payment', { amount: newTx.amount });
    } else {
      if (!await this.confirmAction(`هل أنت متأكد من إلغاء دفعة الاشتراك هذه وحذف المعاملة من الدفتر؟`)) return;
      this.db.data.transactions = this.db.data.transactions.filter(t => t.id !== txId);
      this.db.save();
      this.showToast(`تم إلغاء دفعة الاشتراك وحذف المعاملة بنجاح`, 'info');
    }

    this.renderFinanceTable();
  }

  async deleteTransaction(id) {
    if (!await this.confirmAction('هل أنت متأكد من حذف هذه المعاملة المالية؟ / Are you sure?')) return;
    this.db.data.transactions = this.db.data.transactions.filter(t => t.id !== id);
    this.db.save();
    this.showToast('Transaction deleted / تم حذف المعاملة', 'success');
    this.renderFinanceTable();
  }

  // ==================== WHATSAPP GATEWAY LOGS ====================
  renderWhatsAppLogs() {
    const tbody = document.getElementById('whatsapp-logs-table-body');
    tbody.innerHTML = '';

    if (this.db.data.whatsappLogs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">سجل الرسائل فارغ / No messages sent</td></tr>';
      return;
    }

    this.db.data.whatsappLogs.forEach(log => {
      const student = this.db.data.students.find(s => s.id === log.studentId);
      const name = student ? student.name : '-';
      
      let displayDate = log.date;
      try {
        const parts = log.date.split(' ');
        if (parts.length >= 2) {
          const datePart = parts[0];
          const timePart = parts[1];
          
          let parsedDate = new Date(datePart);
          if (isNaN(parsedDate.getTime())) {
            const subParts = datePart.split('/');
            if (subParts.length === 3) {
              parsedDate = new Date(`${subParts[2]}-${subParts[1]}-${subParts[0]}`);
            }
          }
          
          if (!isNaN(parsedDate.getTime())) {
            const dayName = parsedDate.toLocaleDateString('ar-EG', { weekday: 'long' });
            const rest = parsedDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
            displayDate = `${dayName}، ${rest} (${timePart})`;
          }
        }
      } catch (err) {
        console.error(err);
      }

      tbody.innerHTML += `
        <tr class="fade-in">
          <td><code>${log.recipient}</code></td>
          <td><strong>${name}</strong></td>
          <td style="white-space:normal; font-size:12.5px;">${log.message}</td>
          <td>${displayDate}</td>
          <td><span class="badge badge-present">${this.i18n.translate(log.status)}</span></td>
        </tr>
      `;
    });
  }

  sendWhatsAppTestMessage() {
    const phone = document.getElementById('whatsapp-test-phone').value;
    const msg = document.getElementById('whatsapp-test-message').value;

    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      id: 'MSG' + Date.now(),
      studentId: '',
      recipient: phone,
      type: 'test-broadcast',
      message: msg,
      date: `${dateStr} ${timeStr}`,
      status: 'delivered'
    };

    this.db.data.whatsappLogs.unshift(newLog);
    this.db.save();

    this.showToast('Test Broadcast Dispatched / تم إرسال رسالة البث التجريبية', 'success');
    document.getElementById('whatsapp-test-message').value = '';
    this.renderWhatsAppLogs();
  }

  // ==================== PARENT PORTAL INTERFACES ====================
  initParentPortal() {
    const select = document.getElementById('parent-student-select');
    if (!select) return;
    select.innerHTML = '';

    const parent = this.db.data.parents.find(p => p.id === this.currentUser.username) || this.db.data.parents[0];
    const sIds = parent.studentIds || (parent.studentId ? [parent.studentId] : []);
    
    if (sIds.length === 0) {
      document.getElementById('parent-portal-greeting').innerHTML = `مرحباً بك ولي الأمر. لم يتم ربط طلاب بحسابك بعد.`;
      return;
    }

    let firstStudentId = sIds[0];
    let optionsHtml = '';
    
    sIds.forEach(sId => {
      const student = this.db.data.students.find(s => s.id === sId);
      if (student) {
        optionsHtml += `<option value="${student.id}">${student.name}</option>`;
      }
    });
    
    select.innerHTML = optionsHtml;
    
    const firstStudent = this.db.data.students.find(s => s.id === firstStudentId);
    if (firstStudent) {
      document.getElementById('parent-portal-greeting').innerHTML = `${this.i18n.translate('parentWelcome')} <strong style="color:var(--primary);">${firstStudent.name}</strong>`;
      this.renderParentStudentPanel(firstStudentId);
    }
    this.renderParentNotifications();
  }

  renderParentNotifications() {
    const parent = this.db.data.parents.find(p => p.id === this.currentUser.username) || this.db.data.parents[0];
    const sIds = parent.studentIds || (parent.studentId ? [parent.studentId] : []);
    
    if (!this.db.data.parentNotifications) this.db.data.parentNotifications = [];
    
    // Filter notifications for this parent's students
    const myNotifications = this.db.data.parentNotifications.filter(n => sIds.includes(n.studentId));
    
    const badge = document.getElementById('parent-notification-badge');
    const unreadCount = myNotifications.filter(n => !n.read).length;
    
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    // Update inline badge removed

    // Helper to build notification item HTML
    const buildNotifItem = (n, isInline) => {
      const student = this.db.data.students.find(s => s.id === n.studentId);
      const studentName = student ? student.name : 'طالب';
      let icon = '🔔';
      let typeColor = 'var(--primary)';
      if (n.type === 'attendance') { icon = '✅'; typeColor = 'var(--success)'; }
      if (n.type === 'absence')    { icon = '❌'; typeColor = 'var(--danger)'; }
      if (n.type === 'grades')     { icon = '📈'; typeColor = 'var(--warning)'; }
      if (n.type === 'payment')    { icon = '💳'; typeColor = 'var(--primary)'; }

      if (isInline) {
        return `
          <div style="padding:14px 16px; border-radius: var(--border-radius-md); border:1px solid var(--border-main);
            background: ${n.read ? 'var(--bg-card)' : 'var(--primary-light)'}; 
            border-right: 4px solid ${typeColor};
            transition: background 0.3s; font-size:13px; text-align: right; display:flex; gap:12px; align-items:flex-start;">
            <div style="font-size:22px; line-height:1; flex-shrink:0;">${icon}</div>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <span style="font-weight:700; font-size:13px;">${n.title} <span style="font-weight:400; color:var(--text-muted); font-size:12px;">(${studentName})</span></span>
                <span style="font-size:11px; color:var(--text-muted);">${n.date}</span>
              </div>
              <p style="color:var(--text-main); font-size:12.5px; line-height:1.6; margin:0;">${n.message}</p>
            </div>
            ${!n.read ? `<span style="width:8px;height:8px;background:var(--danger);border-radius:50%;flex-shrink:0;margin-top:4px;"></span>` : ''}
          </div>
        `;
      } else {
        return `
          <div style="padding:10px; border-radius: var(--border-radius-md); border:1px solid var(--border-main); background: ${n.read ? 'transparent' : 'var(--primary-light)'}; transition: background 0.3s; font-size:12px; text-align: right;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-weight:700;">
              <span>${icon} ${n.title} (${studentName})</span>
              <span style="font-size:10px; color:var(--text-muted); font-weight:normal;">${n.date}</span>
            </div>
            <p style="color:var(--text-main); font-size:11.5px; line-height:1.4; margin-top: 4px;">${n.message}</p>
          </div>
        `;
      }
    };

    // ---- Populate dropdown list ----
    const list = document.getElementById('parent-notifications-list');
    if (list) {
      list.innerHTML = '';
      if (myNotifications.length === 0) {
        list.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:12px 0;">لا توجد إشعارات حالياً</div>`;
      } else {
        myNotifications.forEach(n => { list.innerHTML += buildNotifItem(n, false); });
      }
    }

    // ---- Populate inline in-page list (Removed per request) ----
  }

  markParentNotificationsAsRead() {
    const parent = this.db.data.parents.find(p => p.id === this.currentUser.username) || this.db.data.parents[0];
    const sIds = parent.studentIds || (parent.studentId ? [parent.studentId] : []);
    
    if (!this.db.data.parentNotifications) this.db.data.parentNotifications = [];
    
    this.db.data.parentNotifications.forEach(n => {
      if (sIds.includes(n.studentId)) {
        n.read = true;
      }
    });
    
    this.db.save();
    this.renderParentNotifications();
  }

  renderParentStudentPanel(studentId) {
    const student = this.db.data.students.find(s => s.id === studentId);
    if (!student) return;

    // ── Info card ──────────────────────────────────────────────────────────
    const infoCard = document.getElementById('parent-student-info-card');
    const groupObj = this.db.data.groups.find(g => g.id === student.groupId);
    const groupName = groupObj
      ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn)
      : 'Unassigned';

    infoCard.innerHTML = `
      <img src="${student.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'}" alt="" class="teacher-avatar">
      <div class="teacher-info" style="flex:1;">
        <h4 style="font-size:16px;">${student.name}</h4>
        <p>${this.i18n.translate('academicLevel')}: <strong>${student.academicLevel}</strong>
           | ${this.i18n.translate('assignedGroup')}: <strong>${groupName}</strong></p>
        <p style="font-size:11px; margin-top:4px; color:var(--text-muted);">
          🏆 الجوائز: ${student.awards && student.awards.length ? student.awards.join(' - ') : 'لا يوجد حالياً'}
        </p>
      </div>
      <div style="text-align:right;">
        <span style="font-size:11px; color:var(--text-muted);">${this.i18n.translate('studentId')}: <code>${student.id}</code></span>
        <div style="font-size:20px; font-weight:800; color:var(--primary); margin-top:4px;">${student.monthlyFee} ج.م</div>
      </div>
    `;

    // ── Collect raw data ───────────────────────────────────────────────────
    const allAtt  = this.db.data.attendance.filter(a => a.studentId === student.id);
    const allGrd  = this.db.data.grades.filter(g => g.studentId === student.id);
    const allPay  = this.db.data.transactions.filter(tx => tx.studentId === student.id && tx.type === 'income');

    // ── Build month set (YYYY-MM strings) ─────────────────────────────────
    const monthSet = new Set();
    const nowYM = new Date().toISOString().substring(0, 7);
    monthSet.add(nowYM); // always include current month

    allAtt.forEach(a => monthSet.add(a.date.substring(0, 7)));
    allGrd.forEach(g => monthSet.add(g.date.substring(0, 7)));
    allPay.forEach(p => monthSet.add(p.date.substring(0, 7)));

    // Sort months newest → oldest
    const months = [...monthSet].sort((a, b) => b.localeCompare(a));

    // ── Arabic month/year label helper ─────────────────────────────────────
    const monthLabel = (ym) => {
      const [y, m] = ym.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    };

    // ── Render timeline ────────────────────────────────────────────────────
    const timeline = document.getElementById('parent-monthly-timeline');
    if (!timeline) return;
    timeline.innerHTML = '';
    
    // Set grid layout for the timeline container
    timeline.style.display = 'grid';
    timeline.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
    timeline.style.gap = '20px';

    months.forEach((ym, idx) => {
      const isCurrent = ym === nowYM;

      // Data for this month
      const attMonth = allAtt.filter(a => a.date.substring(0, 7) === ym)
                              .sort((a, b) => b.date.localeCompare(a.date));
      const grdMonth = allGrd.filter(g => g.date.substring(0, 7) === ym)
                              .sort((a, b) => b.date.localeCompare(a.date));
      const payMonth = allPay.filter(p => p.date.substring(0, 7) === ym);

      const presentCount = attMonth.filter(a => a.status === 'present' || a.status === 'late').length;
      const absentCount  = attMonth.filter(a => a.status === 'absent').length;
      const isPaid       = payMonth.length > 0;
      const paidTx       = payMonth[0]; // latest payment this month

      // ── Header pills ─────────────────────────────────────────────────────
      let pillsHtml = '';
      if (attMonth.length > 0) {
        if (presentCount > 0) pillsHtml += `<span class="month-pill month-pill-present">✅ ${presentCount} حضور</span>`;
        if (absentCount  > 0) pillsHtml += `<span class="month-pill month-pill-absent">❌ ${absentCount} غياب</span>`;
      } else {
        pillsHtml += `<span class="month-pill" style="background:var(--bg-main); color:var(--text-muted);">لا يوجد حضور</span>`;
      }
      pillsHtml += isPaid
        ? `<span class="month-pill month-pill-paid">💳 مدفوع</span>`
        : `<span class="month-pill month-pill-unpaid">⚠️ غير مدفوع</span>`;
      if (grdMonth.length > 0) {
        pillsHtml += `<span class="month-pill month-pill-grades">📈 ${grdMonth.length} اختبار</span>`;
      }

      // ── Attendance rows ───────────────────────────────────────────────────
      let attRows = '';
      if (attMonth.length === 0) {
        attRows = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:12px;">لا يوجد سجل حضور لهذا الشهر</td></tr>`;
      } else {
        attMonth.forEach(a => {
          let badgeClass = 'badge-absent'; let statusIcon = '❌';
          if (a.status === 'present') { badgeClass = 'badge-present'; statusIcon = '✅'; }
          if (a.status === 'late')    { badgeClass = 'badge-late';    statusIcon = '⏰'; }
          const dayName = new Date(a.date).toLocaleDateString('ar-EG', { weekday: 'long' });
          attRows += `
            <tr>
              <td>${a.date}</td>
              <td style="color:var(--text-muted); font-size:11px;">${dayName}</td>
              <td>${a.time || '-'}</td>
              <td><span class="badge ${badgeClass}">${statusIcon} ${this.i18n.translate(a.status)}</span></td>
            </tr>`;
        });
      }

      // ── Payment block ─────────────────────────────────────────────────────
      let payHtml = '';
      if (isPaid) {
        const payDate = paidTx ? paidTx.date : '';
        const payAmt  = paidTx ? paidTx.amount : student.monthlyFee;
        const payDesc = paidTx ? paidTx.desc : '';
        payHtml = `
          <div class="payment-status-block paid">
            <span class="pay-icon">✅</span>
            <div class="pay-info">
              <div class="pay-label">تم السداد — ${payAmt} ج.م</div>
              <div class="pay-meta">${payDesc || 'اشتراك شهري'} ${payDate ? '· بتاريخ ' + payDate : ''}</div>
            </div>
          </div>`;
        // Also show extra payments if more than one
        if (payMonth.length > 1) {
          payMonth.slice(1).forEach(p => {
            payHtml += `
              <div class="payment-status-block paid" style="margin-top:6px;">
                <span class="pay-icon">✅</span>
                <div class="pay-info">
                  <div class="pay-label">دفعة إضافية — ${p.amount} ج.م</div>
                  <div class="pay-meta">${p.desc || ''} ${p.date ? '· ' + p.date : ''}</div>
                </div>
              </div>`;
          });
        }
      } else {
        payHtml = `
          <div class="payment-status-block unpaid">
            <span class="pay-icon">⚠️</span>
            <div class="pay-info">
              <div class="pay-label">لم يتم السداد</div>
              <div class="pay-meta">الاشتراك المستحق: ${student.monthlyFee} ج.م</div>
            </div>
          </div>`;
      }

      // ── Grades rows ───────────────────────────────────────────────────────
      let grdRows = '';
      if (grdMonth.length === 0) {
        grdRows = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:12px;">لا توجد اختبارات مسجلة لهذا الشهر</td></tr>`;
      } else {
        grdMonth.forEach(g => {
          const pct = Math.round((g.score / g.totalMarks) * 100);
          let barColor = '#f43f5e';
          if (pct >= 85) barColor = 'var(--success)';
          else if (pct >= 60) barColor = 'var(--warning)';
          grdRows += `
            <tr>
              <td><strong>${g.title}</strong><span style="font-size:10px; color:var(--text-muted); margin-right:4px;">(${g.type || '-'})</span></td>
              <td><strong style="color:var(--primary);">${g.score}</strong></td>
              <td>${g.totalMarks}</td>
              <td>
                <div class="grade-bar-wrap">
                  <div class="grade-bar-track">
                    <div class="grade-bar-fill" style="width:${pct}%; background:${barColor};"></div>
                  </div>
                  <strong style="color:${barColor}; font-size:12px; min-width:34px;">${pct}%</strong>
                </div>
              </td>
              <td>${g.notes || '-'}</td>
            </tr>`;
        });
      }

      // ── Assemble grid card ────────────────────────────────────────────────
      const cardId = `month-card-${ym.replace('-', '')}`;

      const card = document.createElement('div');
      card.className = `month-grid-card`;
      card.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-main);
        border-radius: var(--border-radius-lg);
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 12px;
      `;
      card.id = cardId;
      
      // Store the details HTML in a data attribute to be injected into the modal
      const detailsHTML = `
        <div class="month-card-body" style="display:block; padding:0;">
          <!-- ATTENDANCE -->
          <div class="month-section">
            <div class="month-section-title">🗓️ سجل الحضور والغياب</div>
            <div class="table-responsive">
              <table class="custom-table" style="font-size:12.5px;">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>اليوم</th>
                    <th>الوقت</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>${attRows}</tbody>
              </table>
            </div>
          </div>

          <!-- PAYMENT -->
          <div class="month-section">
            <div class="month-section-title">💳 حالة الاشتراك الشهري</div>
            ${payHtml}
          </div>

          <!-- GRADES -->
          <div class="month-section">
            <div class="month-section-title">📈 نتائج الاختبارات والدرجات</div>
            <div class="table-responsive">
              <table class="custom-table" style="font-size:12.5px;">
                <thead>
                  <tr>
                    <th>الاختبار</th>
                    <th>الدرجة</th>
                    <th>النهائية</th>
                    <th>الأداء</th>
                    <th>التقييم</th>
                  </tr>
                </thead>
                <tbody>${grdRows}</tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      
      // We will encode it so it safely lives in the attribute
      card.setAttribute('data-details', encodeURIComponent(detailsHTML));
      card.setAttribute('data-title', `تفاصيل شهر ${monthLabel(ym)}`);

      card.innerHTML = `
        <div style="font-size: 24px; color: var(--primary);">📅</div>
        <h3 style="font-size: 16px; margin:0; color: var(--text-main); font-weight:700;">
          ${monthLabel(ym)}
        </h3>
        ${isCurrent ? '<span class="badge badge-present" style="font-size:10px;">الشهر الحالي</span>' : ''}
        <div class="month-pills" style="display:flex; flex-wrap:wrap; justify-content:center; gap:6px;">
          ${pillsHtml}
        </div>
      `;

      card.addEventListener('click', () => {
        document.getElementById('month-details-title').textContent = card.getAttribute('data-title');
        document.getElementById('month-details-body').innerHTML = decodeURIComponent(card.getAttribute('data-details'));
        document.getElementById('modal-month-details').style.display = 'flex';
      });

      // Add hover effect via JS since inline styles are used
      card.onmouseenter = () => {
        card.style.transform = 'translateY(-4px)';
        card.style.shadowBox = 'var(--shadow-md)';
        card.style.borderColor = 'var(--primary)';
      };
      card.onmouseleave = () => {
        card.style.transform = 'translateY(0)';
        card.style.shadowBox = 'var(--shadow-sm)';
        card.style.borderColor = 'var(--border-main)';
      };

      timeline.appendChild(card);
    });
  }

  toggleMonthCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.toggle('is-open');
  }



  // Settings Loader
  loadSettingsPage() {
    const settings = this.db.data.siteSettings || {
      teacherName: 'أ. محمد مطاوع',
      teacherTitle: 'مدرس أول رياضيات',
      teacherPhone: '01021229847',
      teacherEmail: 'motawea.math@gmail.com',
      teacherBio: 'مدرس رياضيات ذو خبرة طويلة في تدريس الرياضيات بمختلف المراحل الدراسية وتأسيس الطلاب.',
      centerNameAr: 'أكاديمية محمد مطاوع للرياضيات',
      centerNameEn: 'Mohamed Motawea Math Academy',
      academicYear: '2026-2027'
    };

    document.getElementById('settings-teacher-name').value = settings.teacherName;
    document.getElementById('settings-teacher-title').value = settings.teacherTitle;
    document.getElementById('settings-teacher-phone').value = settings.teacherPhone;
    document.getElementById('settings-teacher-email').value = settings.teacherEmail || '';
    document.getElementById('settings-center-name-ar').value = settings.centerNameAr;
    document.getElementById('settings-center-name-en').value = settings.centerNameEn;
    document.getElementById('settings-acad-year').value = settings.academicYear || this.db.data.settings.academicYear || '2026-2027';
    document.getElementById('settings-teacher-bio').value = settings.teacherBio || '';
  }

  saveBrandingSettings() {
    const settings = this.db.data.siteSettings || {};
    
    settings.teacherName = document.getElementById('settings-teacher-name').value;
    settings.teacherTitle = document.getElementById('settings-teacher-title').value;
    settings.teacherPhone = document.getElementById('settings-teacher-phone').value;
    settings.teacherEmail = document.getElementById('settings-teacher-email').value;
    settings.centerNameAr = document.getElementById('settings-center-name-ar').value;
    settings.centerNameEn = document.getElementById('settings-center-name-en').value;
    settings.academicYear = document.getElementById('settings-acad-year').value;
    settings.teacherBio = document.getElementById('settings-teacher-bio').value;

    this.db.data.siteSettings = settings;
    this.db.data.settings.academicYear = settings.academicYear;
    this.db.save();

    this.showToast('Branding updated / تم تحديث بيانات الهوية بنجاح', 'success');
    this.updateBrandingDOM();
  }

  exportDatabaseBackup() {
    const dataStr = JSON.stringify(this.db.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `backup_motawea_math_erp_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Backup saved / تم تصدير النسخة الاحتياطية بنجاح', 'success');
  }

  importDatabaseBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && parsed.students && parsed.transactions) {
          this.db.saveData(parsed);
          this.db.data = parsed;
          this.showToast('Backup Restored / تم استيراد البيانات بنجاح!', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          this.showToast('ملف النسخة الاحتياطية غير صالح / Invalid backup format', 'error');
        }
      } catch (err) {
        this.showToast('فشل قراءة الملف / Failed reading backup file', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Update all branding elements dynamically in DOM
  updateBrandingDOM() {
    const settings = this.db.data.siteSettings;
    if (!settings) return;

    // Sidebar Branding
    const logoTexts = document.querySelectorAll('.logo-text h3');
    logoTexts.forEach(el => el.textContent = this.i18n.currentLang === 'ar' ? settings.centerNameAr : settings.centerNameEn);
    
    const sidebarTeacherName = document.querySelector('.teacher-profile-card .teacher-info h4');
    if (sidebarTeacherName) sidebarTeacherName.textContent = settings.teacherName;

    const sidebarTeacherPhone = document.querySelector('.teacher-profile-card .teacher-info span');
    if (sidebarTeacherPhone) sidebarTeacherPhone.textContent = settings.teacherPhone;

    // Header logo text
    const navLogoText = document.querySelector('.top-navbar strong');
    if (navLogoText) navLogoText.textContent = this.i18n.currentLang === 'ar' ? settings.centerNameAr : settings.centerNameEn;

    // Login Branding
    const loginSubtitle = document.querySelector('.login-header p');
    if (loginSubtitle) loginSubtitle.textContent = this.i18n.currentLang === 'ar' ? `المنصة التعليمية للرياضيات - ${settings.teacherName}` : `Math Academy - ${settings.teacherName}`;

    // Home Page Branding
    const homeTitle = document.getElementById('home-title');
    if (homeTitle) homeTitle.textContent = this.i18n.currentLang === 'ar' ? `المنصة التعليمية للرياضيات` : `Mathematics Portal`;

    const homeSubtitle = document.getElementById('home-subtitle');
    if (homeSubtitle) homeSubtitle.textContent = this.i18n.currentLang === 'ar' ? `${settings.centerNameAr} - ${settings.teacherName}` : `${settings.centerNameEn} - ${settings.teacherName}`;

    const homeTeacherName = document.getElementById('home-teacher-name');
    if (homeTeacherName) homeTeacherName.textContent = settings.teacherName;

    const homeTeacherTitle = document.getElementById('home-teacher-title');
    if (homeTeacherTitle) homeTeacherTitle.textContent = settings.teacherTitle;

    const homeTeacherBio = document.getElementById('home-teacher-bio');
    if (homeTeacherBio) homeTeacherBio.textContent = settings.teacherBio;

    const homeTeacherPhone = document.getElementById('home-teacher-phone');
    if (homeTeacherPhone) homeTeacherPhone.textContent = settings.teacherPhone;

    const homeTeacherEmail = document.getElementById('home-teacher-email');
    if (homeTeacherEmail) homeTeacherEmail.textContent = settings.teacherEmail;
  }

  // Home Page Content Renderer
  renderHomeContent() {
    this.updateBrandingDOM();

    // Fill posts list
    const postsList = document.getElementById('home-posts-list');
    if (!postsList) return;
    postsList.innerHTML = '';

    const posts = this.db.data.posts || [];
    if (posts.length === 0) {
      postsList.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">لا يوجد منشورات حالياً</div>`;
      return;
    }

    posts.forEach(post => {
      let imageHtml = '';
      if (post.image) {
        imageHtml = `
          <div style="width:100%; border-radius:8px; margin-top:10px; overflow:hidden; background-color:var(--bg-sidebar); border:1px solid var(--border-main); display:flex; justify-content:center; align-items:center;">
            <img src="${post.image}" style="width:100%; max-height:500px; object-fit:contain; display:block;">
          </div>
        `;
      }

      let actionsHtml = '';
      if (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'teacher')) {
        actionsHtml = `
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11.5px;" onclick="window.appInstance.editPost('${post.id}')">تعديل</button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11.5px; color:var(--danger);" onclick="window.appInstance.deletePost('${post.id}')">حذف</button>
          </div>
        `;
      }

      postsList.innerHTML += `
        <div style="padding:16px; border:1px solid var(--border-main); border-radius:var(--border-radius-md); background:var(--bg-card); display:flex; flex-direction:column; gap:8px; text-align:right;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h4 style="font-size:14.5px; font-weight:700; color:var(--text-main);">${post.title}</h4>
            <span style="font-size:11px; color:var(--text-muted);">${post.date}</span>
          </div>
          <p style="font-size:12.5px; line-height:1.5; color:var(--text-muted); white-space:pre-line;">${post.content}</p>
          ${imageHtml}
          ${actionsHtml}
        </div>
      `;
    });
    
    // Create icons in dynamically generated posts
    lucide.createIcons();
    this.configureSidebarPermissions();
  }

  // Save Add/Edit Post Form
  savePostForm() {
    const action = document.getElementById('post-form-action').value;
    const id = document.getElementById('post-form-id').value;
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const imageInput = document.getElementById('post-image');
    const imageCleared = document.getElementById('post-image-cleared') && document.getElementById('post-image-cleared').value === 'true';

    const saveObj = (imgDataUrl) => {
      const newPost = {
        id: action === 'add' ? 'post_' + Date.now() : id,
        title: title,
        content: content,
        date: new Date().toISOString().substring(0, 10),
        image: imgDataUrl || ''
      };

      if (!this.db.data.posts) this.db.data.posts = [];

      if (action === 'add') {
        this.db.data.posts.unshift(newPost);
        this.showToast('تم نشر المنشور بنجاح', 'success');
      } else {
        const idx = this.db.data.posts.findIndex(p => p.id === id);
        if (idx !== -1) {
          newPost.date = this.db.data.posts[idx].date;
          if (imageCleared) {
            newPost.image = '';
          } else if (!imgDataUrl) {
            newPost.image = this.db.data.posts[idx].image;
          }
          this.db.data.posts[idx] = newPost;
          this.showToast('تم تحديث المنشور بنجاح', 'success');
        }
      }

      this.db.save();
      document.getElementById('modal-post').style.display = 'none';
      this.renderHomeContent();
    };

    if (imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => saveObj(e.target.result);
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      saveObj(null);
    }
  }

  // Edit post loader
  editPost(postId) {
    const post = this.db.data.posts.find(p => p.id === postId);
    if (!post) return;

    document.getElementById('post-form-action').value = 'edit';
    document.getElementById('post-form-id').value = post.id;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
    document.getElementById('post-modal-title').textContent = 'تعديل المنشور';

    const imageClearedEl = document.getElementById('post-image-cleared');
    if (imageClearedEl) imageClearedEl.value = 'false';
    const postImageInput = document.getElementById('post-image');
    if (postImageInput) postImageInput.value = '';

    const previewContainer = document.getElementById('post-image-preview-container');
    const previewImg = document.getElementById('post-image-preview');
    if (post.image) {
      previewImg.src = post.image;
      previewContainer.style.display = 'block';
    } else {
      previewContainer.style.display = 'none';
    }

    document.getElementById('modal-post').style.display = 'flex';
  }

  // Delete post
  async deletePost(postId) {
    if (!await this.confirmAction('هل أنت متأكد من حذف هذا المنشور نهائياً؟')) return;
    this.db.data.posts = this.db.data.posts.filter(p => p.id !== postId);
    this.db.save();
    this.showToast('تم حذف المنشور', 'success');
    this.renderHomeContent();
  }

  // Save Teacher Bio Form
  saveTeacherBioForm() {
    const settings = this.db.data.siteSettings;
    settings.teacherName = document.getElementById('bio-name').value;
    settings.teacherTitle = document.getElementById('bio-title').value;
    settings.teacherBio = document.getElementById('bio-text').value;
    settings.teacherPhone = document.getElementById('bio-phone').value;
    settings.teacherEmail = document.getElementById('bio-email').value;

    this.db.save();
    document.getElementById('modal-teacher-bio').style.display = 'none';
    this.showToast('تم تحديث بيانات المعلم والمنصة', 'success');
    this.renderHomeContent();
  }

  // Helper to format date with weekday name in Arabic
  formatDateWithDay(dateString) {
    if (!dateString) return '-';
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return dateString;
      return dateObj.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  }

  showDashboardGroupsDetail() {
    const title = document.getElementById('dashboard-details-title');
    const thead = document.getElementById('dashboard-details-thead');
    const tbody = document.getElementById('dashboard-details-tbody');
    
    title.textContent = 'قائمة المجموعات وتوزيع الطلاب';
    
    thead.innerHTML = `
      <tr>
        <th>اسم المجموعة</th>
        <th>المرحلة</th>
        <th>موعد الحصة</th>
        <th>السعر</th>
        <th>السعة القصوى</th>
        <th>المسجلون فعلياً</th>
      </tr>
    `;
    
    tbody.innerHTML = '';
    this.db.data.groups.forEach(g => {
      const enrolled = this.db.data.students.filter(s => s.groupId === g.id).length;
      const groupName = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
      const levelsList = Array.isArray(g.level) ? g.level.join(', ') : g.level;
      
      tbody.innerHTML += `
        <tr>
          <td><strong>${groupName}</strong></td>
          <td><span class="badge" style="background-color:var(--primary-light); color:var(--primary);">${levelsList}</span></td>
          <td><code>${g.timeSlot}</code></td>
          <td><strong>${g.fee} ج.م</strong></td>
          <td>${g.maxStudents}</td>
          <td><span style="font-weight:700; color:${enrolled >= g.maxStudents ? 'var(--danger)' : 'var(--success)'};">${enrolled} / ${g.maxStudents}</span></td>
        </tr>
      `;
    });
    
    document.getElementById('modal-dashboard-details').style.display = 'flex';
  }

  showDashboardDailyIncomeDetail() {
    const title = document.getElementById('dashboard-details-title');
    const thead = document.getElementById('dashboard-details-thead');
    const tbody = document.getElementById('dashboard-details-tbody');
    
    title.textContent = 'تفاصيل إيرادات اليوم';
    
    thead.innerHTML = `
      <tr>
        <th>الطالب</th>
        <th>المجموعة</th>
        <th>البيان</th>
        <th>المبلغ</th>
        <th>التاريخ واليوم</th>
      </tr>
    `;
    
    tbody.innerHTML = '';
    const todayStr = new Date().toISOString().substring(0, 10);
    const dailyTx = this.db.data.transactions.filter(tx => tx.type === 'income' && tx.date === todayStr);
    
    if (dailyTx.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-muted); padding:20px;">لا يوجد إيرادات مسجلة اليوم</td></tr>`;
    } else {
      dailyTx.forEach(tx => {
        const student = this.db.data.students.find(s => s.id === tx.studentId);
        const sName = student ? student.name : 'طالب عام';
        const groupObj = student ? this.db.data.groups.find(g => g.id === student.groupId) : null;
        const gName = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : '-';
        
        tbody.innerHTML += `
          <tr>
            <td><strong>${sName}</strong></td>
            <td>${gName}</td>
            <td>${tx.desc}</td>
            <td><strong style="color:var(--success);">${tx.amount} ج.م</strong></td>
            <td>${this.formatDateWithDay(tx.date)}</td>
          </tr>
        `;
      });
    }
    
    document.getElementById('modal-dashboard-details').style.display = 'flex';
  }

  showDashboardWeeklyIncomeDetail() {
    const title = document.getElementById('dashboard-details-title');
    const thead = document.getElementById('dashboard-details-thead');
    const tbody = document.getElementById('dashboard-details-tbody');
    
    title.textContent = 'تفاصيل إيرادات الأسبوع';
    
    thead.innerHTML = `
      <tr>
        <th>الطالب</th>
        <th>المجموعة</th>
        <th>البيان</th>
        <th>المبلغ</th>
        <th>التاريخ واليوم</th>
      </tr>
    `;
    
    tbody.innerHTML = '';
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyTx = this.db.data.transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.type === 'income' && txDate >= oneWeekAgo;
    });
    
    if (weeklyTx.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-muted); padding:20px;">لا يوجد إيرادات مسجلة هذا الأسبوع</td></tr>`;
    } else {
      weeklyTx.forEach(tx => {
        const student = this.db.data.students.find(s => s.id === tx.studentId);
        const sName = student ? student.name : 'طالب عام';
        const groupObj = student ? this.db.data.groups.find(g => g.id === student.groupId) : null;
        const gName = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : '-';
        
        tbody.innerHTML += `
          <tr>
            <td><strong>${sName}</strong></td>
            <td>${gName}</td>
            <td>${tx.desc}</td>
            <td><strong style="color:var(--success);">${tx.amount} ج.م</strong></td>
            <td>${this.formatDateWithDay(tx.date)}</td>
          </tr>
        `;
      });
    }
    
    document.getElementById('modal-dashboard-details').style.display = 'flex';
  }

  showDashboardExpensesDetail() {
    const title = document.getElementById('dashboard-details-title');
    const thead = document.getElementById('dashboard-details-thead');
    const tbody = document.getElementById('dashboard-details-tbody');
    
    title.textContent = 'كشف المصروفات التفصيلي';
    
    thead.innerHTML = `
      <tr>
        <th>البيان / الوصف</th>
        <th>التصنيف</th>
        <th>المبلغ</th>
        <th>التاريخ واليوم</th>
        <th>الوقت</th>
      </tr>
    `;
    
    tbody.innerHTML = '';
    const expenses = this.db.data.transactions.filter(tx => tx.type === 'expense');
    
    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-muted); padding:20px;">لا يوجد مصروفات مسجلة</td></tr>`;
    } else {
      expenses.forEach(tx => {
        tbody.innerHTML += `
          <tr>
            <td><strong>${tx.desc}</strong></td>
            <td><span class="badge" style="background-color:var(--danger-light); color:var(--danger);">${this.i18n.translate(tx.category) || tx.category}</span></td>
            <td><strong style="color:var(--danger);">${tx.amount} ج.م</strong></td>
            <td>${this.formatDateWithDay(tx.date)}</td>
            <td>${tx.time || '12:00 م'}</td>
          </tr>
        `;
      });
    }
    
    document.getElementById('modal-dashboard-details').style.display = 'flex';
  }

  updateSelectedMonthStats(monthIdx) {
    const currentYear = new Date().getFullYear();
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const monthName = this.i18n.currentLang === 'ar' ? monthNamesAr[monthIdx] : monthNamesEn[monthIdx];
    document.getElementById('selected-month-label').textContent = monthName;

    // Filter transactions for this month and year
    let income = 0;
    let expense = 0;
    this.db.data.transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (d.getFullYear() === currentYear && d.getMonth() === monthIdx) {
        if (tx.type === 'income') {
          income += tx.amount;
        } else {
          expense += tx.amount;
        }
      }
    });

    const profit = income - expense;
    document.getElementById('m-stat-income').textContent = `${income} ج.م`;
    document.getElementById('m-stat-expense').textContent = `${expense} ج.م`;
    
    const profitEl = document.getElementById('m-stat-profit');
    profitEl.textContent = `${profit} ج.م`;
    profitEl.style.color = profit >= 0 ? 'var(--success)' : 'var(--danger)';

    // Attendance rate for this month
    let presentCount = 0;
    let totalAttendance = 0;
    this.db.data.attendance.forEach(att => {
      const d = new Date(att.date);
      if (d.getFullYear() === currentYear && d.getMonth() === monthIdx) {
        totalAttendance++;
        if (att.status === 'present' || att.status === 'late') {
          presentCount++;
        }
      }
    });
    const attRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(0) : 100;
    document.getElementById('m-stat-attendance').textContent = `${attRate}%`;

    // Billing/Collection rate for this month
    const totalStudents = this.db.data.students.length;
    let paidStudentsCount = 0;
    if (totalStudents > 0) {
      this.db.data.students.forEach(s => {
        const hasPaid = this.db.data.transactions.some(tx => 
          tx.type === 'income' && 
          tx.studentId === s.id && 
          tx.category === 'monthly-fees' && 
          new Date(tx.date).getMonth() === monthIdx && 
          new Date(tx.date).getFullYear() === currentYear
        );
        if (hasPaid) paidStudentsCount++;
      });
    }
    const billingRate = totalStudents > 0 ? ((paidStudentsCount / totalStudents) * 100).toFixed(0) : 100;
    document.getElementById('m-stat-billing').textContent = `${billingRate}%`;
  }

  showStudentDetails(studentId) {
    const s = this.db.data.students.find(x => x.id === studentId);
    if (!s) return;

    const groupObj = this.db.data.groups.find(g => g.id === s.groupId);
    const groupName = groupObj ? (this.i18n.currentLang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';

    // Populate standard textual details
    document.getElementById('det-st-name').textContent = s.name;
    document.getElementById('det-st-id').textContent = s.id;
    document.getElementById('det-st-level').textContent = s.academicLevel;
    document.getElementById('det-st-group').textContent = groupName;
    document.getElementById('det-st-fee').textContent = `${s.subscriptionType === 'monthly' ? 'شهري' : 'بالحصة'} - ${s.monthlyFee} ج.م`;
    document.getElementById('det-st-phone').textContent = s.studentPhone || '-';
    document.getElementById('det-st-parent-phone').textContent = s.parentPhone || s.fatherPhone || '-';

    // Populate card details
    const settings = this.db.data.siteSettings;
    document.getElementById('det-card-logo').textContent = settings ? (this.i18n.currentLang === 'ar' ? settings.centerNameAr : settings.centerNameEn) : 'Math Center';
    document.getElementById('det-card-name').textContent = s.name;
    document.getElementById('det-card-level').textContent = s.academicLevel;
    document.getElementById('det-card-id').textContent = s.id;
    document.getElementById('det-card-group').textContent = groupObj ? groupObj.nameEn : 'Unassigned';
    document.getElementById('det-card-phone').textContent = s.studentPhone || s.parentPhone || s.fatherPhone || '-';
    document.getElementById('det-card-barcode').textContent = s.barcode;
    document.getElementById('det-card-img').src = s.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150';
    document.getElementById('det-card-teacher-name').textContent = settings ? settings.teacherName : 'أ. محمد مطاوع';
    document.getElementById('det-card-teacher-phone').textContent = settings ? `📞 ${settings.teacherPhone}` : '';

    // Generate QR Code
    const qrBox = document.getElementById('det-card-qr-box');
    qrBox.innerHTML = '';
    new QRCode(qrBox, {
      text: s.id, // QR code contains student ID
      width: 75,
      height: 75,
      colorDark: '#0f172a',
      colorLight: '#ffffff'
    });

    // Action buttons inside Details Modal
    const btnEdit = document.getElementById('btn-det-edit');
    btnEdit.onclick = () => {
      document.getElementById('modal-student-details').style.display = 'none';
      this.loadStudentIntoModal(s.id);
    };

    const btnDelete = document.getElementById('btn-det-delete');
    btnDelete.onclick = () => {
      document.getElementById('modal-student-details').style.display = 'none';
      this.deleteStudent(s.id);
    };

    const btnPdf = document.getElementById('btn-det-pdf');
    btnPdf.onclick = () => {
      this.convertStudentCardToPDF(s.id);
    };

    // Configure role actions visibility inside details modal
    if (this.currentUser.role === 'admin' || this.currentUser.role === 'teacher') {
      document.getElementById('btn-det-edit').style.display = '';
      document.getElementById('btn-det-delete').style.display = this.currentUser.role === 'admin' ? '' : 'none';
    } else {
      document.getElementById('btn-det-edit').style.display = 'none';
      document.getElementById('btn-det-delete').style.display = 'none';
    }

    // Show Details Modal
    document.getElementById('modal-student-details').style.display = 'flex';
  }

  loadStudentIntoModal(studentId) {
    const s = this.db.data.students.find(x => x.id === studentId);
    if (!s) return;

    document.getElementById('student-form-action').value = 'edit';
    document.getElementById('student-form-id').value = s.id;
    document.getElementById('st-name').value = s.name;
    document.getElementById('st-gender').value = s.gender;
    document.getElementById('st-level').value = s.academicLevel;
    
    this.populateStudentGroupOptions(s.academicLevel, 'st-group');
    document.getElementById('st-group').value = s.groupId;
    
    document.getElementById('st-sessions').value = s.sessionCount || 8;
    document.getElementById('st-subtype').value = s.subscriptionType || 'monthly';
    document.getElementById('st-fee').value = s.monthlyFee || 300;
    document.getElementById('st-barcode').value = s.barcode;
    document.getElementById('st-phone').value = s.studentPhone || '';
    document.getElementById('st-parent-phone').value = s.parentPhone || s.fatherPhone || '';

    // تهيئة الصورة الشخصية ومعاينتها للتعديل
    document.getElementById('st-avatar').value = '';
    document.getElementById('st-avatar-cleared').value = 'false';
    const preview = document.getElementById('st-avatar-preview');
    const container = document.getElementById('st-avatar-preview-container');
    if (s.avatar) {
      preview.src = s.avatar;
      container.style.display = 'block';
    } else {
      preview.src = '';
      container.style.display = 'none';
    }

    document.getElementById('student-modal-title').textContent = 'تعديل بيانات الطالب';
    document.getElementById('modal-student').style.display = 'flex';
  }

  saveStudentForm() {
    const action = document.getElementById('student-form-action').value;
    const id = document.getElementById('student-form-id').value;
    const s = this.db.data.students.find(x => x.id === id);

    const buildStudentObj = (avatarDataUrl) => {
      const isCleared = document.getElementById('st-avatar-cleared').value === 'true';
      let finalAvatar = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150';
      if (s) {
        finalAvatar = s.avatar;
      }
      if (avatarDataUrl) {
        finalAvatar = avatarDataUrl;
      } else if (isCleared) {
        finalAvatar = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150';
      }

      const studentObj = {
        id: action === 'add' ? 's' + String(this.db.data.students.length + 1).padStart(5, '0') : id,
        name: document.getElementById('st-name').value,
        gender: document.getElementById('st-gender').value,
        academicLevel: document.getElementById('st-level').value,
        subject: 'Mathematics',
        groupId: document.getElementById('st-group').value,
        sessionCount: parseInt(document.getElementById('st-sessions').value),
        subscriptionType: document.getElementById('st-subtype').value,
        monthlyFee: parseFloat(document.getElementById('st-fee').value),
        barcode: document.getElementById('st-barcode').value,
        studentPhone: document.getElementById('st-phone').value,
        parentPhone: document.getElementById('st-parent-phone').value,
        avatar: finalAvatar,
        registrationDate: action === 'add' ? new Date().toISOString().substring(0, 10) : s.registrationDate
      };

      if (action === 'add') {
        this.db.data.students.push(studentObj);
        this.showToast('Student added / تم إضافة الطالب بنجاح', 'success');
      } else {
        const idx = this.db.data.students.findIndex(x => x.id === id);
        if (idx !== -1) {
          this.db.data.students[idx] = studentObj;
          this.showToast('Student updated / تم تعديل البيانات بنجاح', 'success');
        }
      }

      this.db.save();
      document.getElementById('modal-student').style.display = 'none';
      this.renderStudentsList();
    };

    const avatarInput = document.getElementById('st-avatar');
    if (avatarInput.files && avatarInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => buildStudentObj(e.target.result);
      reader.readAsDataURL(avatarInput.files[0]);
    } else {
      buildStudentObj(null);
    }
  }

  convertStudentCardToPDF(studentId) {
    const s = this.db.data.students.find(x => x.id === studentId);
    if (!s) return;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    const cardElement = document.getElementById('det-id-card-view').outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Smart Card - ${s.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&family=Outfit:wght@400;700&display=swap');
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #ffffff;
              direction: rtl;
              font-family: 'Cairo', 'Outfit', sans-serif;
            }
            .student-id-card {
              width: 320px;
              height: 480px;
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              overflow: hidden;
              position: relative;
              display: flex;
              flex-direction: column;
            }
            .student-id-card-pattern {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 120px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              clip-path: ellipse(80% 60% at 50% 0%);
              opacity: 0.15;
            }
            .student-id-card-header {
              height: 60px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 16px;
              color: white;
              z-index: 2;
            }
            .id-header-logo {
              font-size: 13px;
              font-weight: 800;
            }
            .id-header-title {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.9;
            }
            .student-id-card-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 16px;
              z-index: 2;
            }
            .student-id-card-body img {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #2563eb;
              margin-bottom: 10px;
            }
            .student-id-name {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .student-id-level {
              font-size: 11px;
              color: #2563eb;
              background: rgba(37, 99, 235, 0.1);
              padding: 3px 8px;
              border-radius: 99px;
              font-weight: 700;
              margin-bottom: 12px;
            }
            .student-id-details {
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 4px;
              font-size: 11px;
              color: #475569;
              border-top: 1px dashed #e2e8f0;
              padding-top: 10px;
              margin-bottom: 12px;
            }
            .student-id-details div {
              display: flex;
              justify-content: space-between;
            }
            .student-id-qr {
              margin-top: auto;
            }
            .student-id-qr img {
              width: 75px !important;
              height: 75px !important;
              border: none !important;
              border-radius: 0 !important;
            }
            .student-id-card-footer {
              height: 40px;
              background: #f1f5f9;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 16px;
              font-size: 10px;
              color: #475569;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          ${cardElement}
          <script>
            const qrBox = document.getElementById('det-card-qr-box');
            qrBox.innerHTML = '';
            const parentImg = window.opener.document.querySelector('#det-card-qr-box img');
            if (parentImg) {
              const img = document.createElement('img');
              img.src = parentImg.src;
              img.style.width = '75px';
              img.style.height = '75px';
              qrBox.appendChild(img);
            }
            
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  showAccountDetails(type, id) {
    let account = null;
    let roleName = '';
    let detailsHtml = '';

    if (type === 'teacher') {
      account = this.db.data.teachers.find(t => t.id === id);
      roleName = 'معلم / Teacher';
      if (account) {
        detailsHtml = `
          <div><strong>الاسم بالكامل:</strong> ${account.nameAr} / ${account.nameEn}</div>
          <div><strong>اسم المستخدم للدخول:</strong> <code>${account.username}</code></div>
          <div><strong>كلمة المرور:</strong> <code>${account.password}</code></div>
          <div><strong>المادة الدراسية:</strong> ${account.subjectAr} / ${account.subjectEn}</div>
          <div><strong>رقم الهاتف:</strong> ${account.phone}</div>
          <div><strong>البريد الإلكتروني:</strong> ${account.email}</div>
          <div><strong>حالة الحساب:</strong> <span class="badge ${account.active ? 'badge-present' : 'badge-absent'}">${account.active ? 'نشط' : 'معطل'}</span></div>
        `;
      }
    } else if (type === 'parent') {
      account = this.db.data.parents.find(p => p.id === id);
      roleName = 'ولي أمر / Parent';
      if (account) {
        const sIds = account.studentIds || (account.studentId ? [account.studentId] : []);
        const studentNames = sIds.map(stId => {
          const st = this.db.data.students.find(s => s.id === stId);
          return st ? `${st.name} (${stId})` : stId;
        }).join(', ');
        detailsHtml = `
          <div><strong>الاسم بالكامل:</strong> ${account.name}</div>
          <div><strong>اسم المستخدم للدخول:</strong> <code>${account.username}</code></div>
          <div><strong>كلمة المرور:</strong> <code>${account.password}</code></div>
          <div><strong>الطلاب المرتبطون:</strong> ${studentNames || 'لا يوجد'}</div>
          <div><strong>رقم الهاتف:</strong> ${account.phone}</div>
          <div><strong>حالة الحساب:</strong> <span class="badge ${account.active ? 'badge-present' : 'badge-absent'}">${account.active ? 'نشط' : 'معطل'}</span></div>
        `;
      }
    } else if (type === 'admin') {
      account = this.db.data.admins.find(a => a.id === id);
      roleName = 'مدير / Admin';
      if (account) {
        detailsHtml = `
          <div><strong>الاسم بالكامل:</strong> ${account.name}</div>
          <div><strong>اسم المستخدم للدخول:</strong> <code>${account.username}</code></div>
          <div><strong>كلمة المرور:</strong> <code>${account.password}</code></div>
          <div><strong>رقم الهاتف:</strong> ${account.phone || '-'}</div>
          <div><strong>البريد الإلكتروني:</strong> ${account.email || '-'}</div>
          <div><strong>حالة الحساب:</strong> <span class="badge ${account.active ? 'badge-present' : 'badge-absent'}">${account.active ? 'نشط' : 'معطل'}</span></div>
        `;
      }
    }

    if (!account) return;

    document.getElementById('account-details-title').textContent = `تفاصيل حساب: ${account.name || account.nameAr}`;
    document.getElementById('account-details-content').innerHTML = detailsHtml;

    const settings = this.db.data.siteSettings;
    document.getElementById('acc-card-logo').textContent = settings ? (this.i18n.currentLang === 'ar' ? settings.centerNameAr : settings.centerNameEn) : 'Math Center';
    document.getElementById('acc-card-name').textContent = account.name || account.nameAr;
    document.getElementById('acc-card-role').textContent = roleName;
    document.getElementById('acc-card-username').textContent = account.username;
    document.getElementById('acc-card-id').textContent = account.id;
    document.getElementById('acc-card-phone').textContent = account.phone || '-';
    document.getElementById('acc-card-barcode').textContent = account.id;
    document.getElementById('acc-card-img').src = account.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';

    const qrBox = document.getElementById('acc-card-qr-box');
    qrBox.innerHTML = '';
    new QRCode(qrBox, {
      text: account.id,
      width: 75,
      height: 75,
      colorDark: '#0f172a',
      colorLight: '#ffffff'
    });

    const btnEdit = document.getElementById('btn-acc-edit');
    btnEdit.onclick = () => {
      document.getElementById('modal-account-details').style.display = 'none';
      if (type === 'teacher') {
        this.openTeacherModal(account.id);
      } else if (type === 'parent') {
        this.openParentModal(account.id);
      } else if (type === 'admin') {
        this.openAdminModal(account.id);
      }
    };

    const btnDelete = document.getElementById('btn-acc-delete');
    if (account.id === 'a00001' || account.id === 't00101') {
      btnDelete.style.display = 'none';
    } else {
      btnDelete.style.display = '';
      btnDelete.onclick = () => {
        document.getElementById('modal-account-details').style.display = 'none';
        if (type === 'teacher') {
          this.deleteTeacher(account.id);
        } else if (type === 'parent') {
          this.deleteParent(account.id);
        } else if (type === 'admin') {
          this.deleteAdmin(account.id);
        }
      };
    }

    const btnPdf = document.getElementById('btn-acc-pdf');
    btnPdf.onclick = () => {
      this.convertAccountCardToPDF(type, account.id);
    };

    document.getElementById('modal-account-details').style.display = 'flex';
  }

  convertAccountCardToPDF(type, accountId) {
    let account = null;
    let roleName = '';
    if (type === 'teacher') {
      account = this.db.data.teachers.find(t => t.id === accountId);
      roleName = 'معلم / Teacher';
    } else if (type === 'parent') {
      account = this.db.data.parents.find(p => p.id === accountId);
      roleName = 'ولي أمر / Parent';
    } else if (type === 'admin') {
      account = this.db.data.admins.find(a => a.id === accountId);
      roleName = 'مدير / Admin';
    }

    if (!account) return;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    const cardElement = document.getElementById('acc-id-card-view').outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Smart Identity Card - ${account.name || account.nameAr}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&family=Outfit:wght@400;700&display=swap');
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #ffffff;
              direction: rtl;
              font-family: 'Cairo', 'Outfit', sans-serif;
            }
            .student-id-card {
              width: 320px;
              height: 480px;
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              overflow: hidden;
              position: relative;
              display: flex;
              flex-direction: column;
            }
            .student-id-card-pattern {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 120px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              clip-path: ellipse(80% 60% at 50% 0%);
              opacity: 0.15;
            }
            .student-id-card-header {
              height: 60px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 16px;
              color: white;
              z-index: 2;
            }
            .id-header-logo {
              font-size: 13px;
              font-weight: 800;
            }
            .id-header-title {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.9;
            }
            .student-id-card-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 16px;
              z-index: 2;
            }
            .student-id-card-body img {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #2563eb;
              margin-bottom: 10px;
            }
            .student-id-name {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .student-id-level {
              font-size: 11px;
              color: #2563eb;
              background: rgba(37, 99, 235, 0.1);
              padding: 3px 8px;
              border-radius: 99px;
              font-weight: 700;
              margin-bottom: 12px;
            }
            .student-id-details {
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 4px;
              font-size: 11px;
              color: #475569;
              border-top: 1px dashed #e2e8f0;
              padding-top: 10px;
              margin-bottom: 12px;
            }
            .student-id-details div {
              display: flex;
              justify-content: space-between;
            }
            .student-id-qr {
              margin-top: auto;
            }
            .student-id-qr img {
              width: 75px !important;
              height: 75px !important;
              border: none !important;
              border-radius: 0 !important;
            }
            .student-id-card-footer {
              height: 40px;
              background: #f1f5f9;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 16px;
              font-size: 10px;
              color: #475569;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          ${cardElement}
          <script>
            const qrBox = document.getElementById('acc-card-qr-box');
            qrBox.innerHTML = '';
            const parentImg = window.opener.document.querySelector('#acc-card-qr-box img');
            if (parentImg) {
              const img = document.createElement('img');
              img.src = parentImg.src;
              img.style.width = '75px';
              img.style.height = '75px';
              qrBox.appendChild(img);
            }
            
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  setQuickAttendance(studentId, status, dateStr) {
    const student = this.db.data.students.find(s => s.id === studentId);
    if (!student) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Find if record exists for this student on this date
    let record = this.db.data.attendance.find(a => a.studentId === studentId && a.date === dateStr);
    
    if (record) {
      record.status = status;
      record.time = status === 'absent' ? '' : timeStr;
      this.showToast(`تم تحديث التحضير: ${student.name} (${status === 'present' ? 'حاضر' : status === 'late' ? 'متأخر' : 'غائب'})`, 'info');
    } else {
      record = {
        id: 'ATT' + Date.now().toString().substring(7),
        studentId: studentId,
        groupId: student.groupId,
        date: dateStr,
        time: status === 'absent' ? '' : timeStr,
        status: status,
        scanMethod: 'Manual'
      };
      this.db.data.attendance.push(record);
      this.showToast(`تم تسجيل التحضير: ${student.name} (${status === 'present' ? 'حاضر' : status === 'late' ? 'متأخر' : 'غائب'})`, 'success');
      this.playBeep();
    }
    
    this.db.save();
    
    // Trigger notification
    if (status === 'present' || status === 'late') {
      this.triggerWhatsAppNotification(studentId, 'attendance');
    } else if (status === 'absent') {
      this.triggerWhatsAppNotification(studentId, 'absence');
    }
    
    this.renderAttendanceStudentsGrid();
    this.renderAttendanceLogs();
  }

  renderAttendanceStudentsGrid() {
    const groupSelect = document.getElementById('attendance-group-select');
    const dateSelect = document.getElementById('attendance-date-select');
    
    if (!groupSelect || !dateSelect) return;
    
    const groupId = groupSelect.value;
    const dateStr = dateSelect.value;
    const wrapper = document.getElementById('attendance-students-list-wrapper');
    const grid = document.getElementById('attendance-students-grid');
    
    if (!groupId) {
      if (wrapper) wrapper.style.display = 'none';
      return;
    }
    
    if (wrapper) wrapper.style.display = 'block';
    if (grid) grid.innerHTML = '';
    
    const students = this.db.data.students.filter(s => s.groupId === groupId);
    
    const statsPill = document.getElementById('attendance-group-stats-pill');
    if (statsPill) {
      statsPill.textContent = `عدد الطلاب: ${students.length}`;
    }
    
    if (students.length === 0) {
      if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:20px;">لا يوجد طلاب مسجلين في هذه المجموعة</div>';
      return;
    }
    
    // Get all attendance records for today/selected date
    const attendanceRecords = this.db.data.attendance.filter(a => a.groupId === groupId && a.date === dateStr);
    
    students.forEach(s => {
      const record = attendanceRecords.find(a => a.studentId === s.id);
      const status = record ? record.status : '';
      
      let dotColor = 'var(--text-muted)';
      if (status === 'present') dotColor = 'var(--success)';
      else if (status === 'late') dotColor = 'var(--warning)';
      else if (status === 'absent') dotColor = 'var(--danger)';
      
      const card = document.createElement('div');
      card.className = 'attendance-student-row';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.padding = '12px';
      card.style.background = 'var(--bg-card)';
      card.style.border = '1px solid var(--border-main)';
      card.style.borderRadius = 'var(--border-radius-md)';
      card.style.boxShadow = 'var(--shadow-sm)';
      card.style.transition = 'all 0.2s';
      
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor};"></div>
          <span style="font-weight: 700; font-size: 13px; color: var(--text-main);">${s.name}</span>
        </div>
        <div class="attendance-student-actions" style="display: flex; gap: 6px;">
          <button class="btn btn-sm ${status === 'present' ? 'btn-success' : 'btn-outline'}" data-status="present" style="padding: 4px 10px; font-size: 11px;">حاضر</button>
          <button class="btn btn-sm ${status === 'late' ? 'btn-warning' : 'btn-outline'}" data-status="late" style="padding: 4px 10px; font-size: 11px;">متأخر</button>
          <button class="btn btn-sm ${status === 'absent' ? 'btn-danger' : 'btn-outline'}" data-status="absent" style="padding: 4px 10px; font-size: 11px;">غائب</button>
        </div>
      `;
      
      // Bind event listeners to buttons
      const buttons = card.querySelectorAll('.attendance-student-actions button');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const newStatus = btn.getAttribute('data-status');
          this.setQuickAttendance(s.id, newStatus, dateStr);
        });
      });
      
      if (grid) grid.appendChild(card);
    });
  }

  openAddNotificationModal() {
    const modal = document.getElementById('modal-notification-add');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Clear student selection box
    document.getElementById('notification-selected-student-box').style.display = 'none';
    document.getElementById('btn-send-custom-notification').style.display = 'none';
    document.getElementById('notification-message-text').value = '';
    
    const accordionContainer = document.getElementById('notification-groups-accordion');
    accordionContainer.innerHTML = '';
    
    // Group students by group
    this.db.data.groups.forEach(g => {
      const groupStudents = this.db.data.students.filter(s => s.groupId === g.id);
      if (groupStudents.length === 0) return;
      
      const groupName = this.i18n.currentLang === 'ar' ? g.nameAr : g.nameEn;
      
      const groupElement = document.createElement('div');
      groupElement.className = 'notification-accordion-group';
      groupElement.style.border = '1px solid var(--border-main)';
      groupElement.style.borderRadius = 'var(--border-radius-md)';
      groupElement.style.overflow = 'hidden';
      groupElement.style.marginBottom = '8px';
      
      const header = document.createElement('div');
      header.style.padding = '10px 14px';
      header.style.background = 'var(--soft-gray-200)';
      header.style.cursor = 'pointer';
      header.style.fontWeight = '700';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.fontSize = '13px';
      header.innerHTML = `<span>${groupName}</span> <span style="font-size:11px; font-weight:normal; color:var(--text-muted);">${groupStudents.length} طالب</span>`;
      
      const listContainer = document.createElement('div');
      listContainer.style.display = 'none';
      listContainer.style.flexDirection = 'column';
      listContainer.style.borderTop = '1px solid var(--border-main)';
      listContainer.style.maxHeight = '200px';
      listContainer.style.overflowY = 'auto';
      
      groupStudents.forEach(s => {
        const studentRow = document.createElement('div');
        studentRow.style.padding = '8px 16px';
        studentRow.style.cursor = 'pointer';
        studentRow.style.fontSize = '12.5px';
        studentRow.style.borderBottom = '1px solid var(--border-main)';
        studentRow.style.transition = 'background 0.2s';
        studentRow.textContent = s.name;
        
        studentRow.addEventListener('mouseover', () => {
          studentRow.style.background = 'var(--primary-light)';
        });
        studentRow.addEventListener('mouseout', () => {
          studentRow.style.background = 'transparent';
        });
        
        studentRow.addEventListener('click', () => {
          // Select this student
          document.getElementById('notification-target-student-id').value = s.id;
          document.getElementById('notification-target-student-name').textContent = s.name;
          document.getElementById('notification-target-parent-phone').textContent = s.fatherPhone || s.motherPhone || s.studentPhone || 'لا يوجد هاتف';
          
          document.getElementById('notification-selected-student-box').style.display = 'block';
          document.getElementById('btn-send-custom-notification').style.display = 'inline-flex';
          
          // Smooth scroll to form box
          document.getElementById('notification-selected-student-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        
        listContainer.appendChild(studentRow);
      });
      
      header.addEventListener('click', () => {
        const isCollapsed = listContainer.style.display === 'none';
        listContainer.style.display = isCollapsed ? 'flex' : 'none';
        header.style.background = isCollapsed ? 'var(--primary-light)' : 'var(--soft-gray-200)';
      });
      
      groupElement.appendChild(header);
      groupElement.appendChild(listContainer);
      accordionContainer.appendChild(groupElement);
    });
    
    lucide.createIcons();
  }

  sendCustomNotification() {
    const studentId = document.getElementById('notification-target-student-id').value;
    const text = document.getElementById('notification-message-text').value.trim();
    
    if (!studentId) {
      this.showToast('يرجى اختيار طالب أولاً', 'error');
      return;
    }
    if (!text) {
      this.showToast('يرجى كتابة نص الرسالة', 'error');
      return;
    }
    
    const student = this.db.data.students.find(s => s.id === studentId);
    if (!student) return;
    
    let phone = student.fatherPhone || student.motherPhone || student.studentPhone;
    if (!phone) {
      this.showToast('لا يوجد هاتف مسجل لهذا الطالب لإرسال الإشعار', 'error');
      return;
    }
    
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add log entry
    const newLog = {
      id: 'MSG' + Date.now(),
      studentId: studentId,
      recipient: phone,
      type: 'custom',
      message: text,
      date: `${dateStr} ${timeStr}`,
      status: 'sent'
    };
    this.db.data.whatsappLogs.unshift(newLog);
    
    if (!this.db.data.parentNotifications) this.db.data.parentNotifications = [];
    this.db.data.parentNotifications.unshift({
      id: 'NOT' + Date.now() + Math.random().toString().substring(2, 6),
      studentId: studentId,
      type: 'custom',
      title: 'رسالة خاصة من المستر',
      message: text,
      date: `${dateStr} ${timeStr}`,
      read: false
    });
    
    this.db.save();
    this.showToast('🔔 تم إرسال الإشعار لولي الأمر بنجاح', 'success');
    
    // Close modal
    document.getElementById('modal-notification-add').style.display = 'none';
    
    // Refresh Logs table if visible
    if (this.activeView === 'whatsapp') {
      this.renderWhatsAppLogs();
    }
  }
}

// Instantiate App
window.addEventListener('DOMContentLoaded', () => {
  const app = new ERPApp();
  window.appInstance = app;
});
