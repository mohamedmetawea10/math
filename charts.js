// charts.js - Chart.js implementations for Educational Center ERP Dashboard

class ERPCharts {
  constructor() {
    this.instances = {};
  }

  // Helper to destroy existing chart instances before drawing new ones
  destroyChart(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  }

  drawAnnualRevenueChart(canvasId, transactions) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = this.getThemeColors();
    const currentYear = new Date().getFullYear();

    // Initialize 12 months array
    const monthlyIncome = Array(12).fill(0);
    const monthlyExpense = Array(12).fill(0);

    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        if (t.type === 'income') {
          monthlyIncome[monthIdx] += t.amount;
        } else {
          monthlyExpense[monthIdx] += t.amount;
        }
      }
    });

    const labelsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const labelsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = document.documentElement.lang === 'ar' ? labelsAr : labelsEn;

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: document.documentElement.lang === 'ar' ? 'الإيرادات' : 'Income',
            data: monthlyIncome,
            backgroundColor: colors.primary,
            borderRadius: 4,
          },
          {
            label: document.documentElement.lang === 'ar' ? 'المصروفات' : 'Expenses',
            data: monthlyExpense,
            backgroundColor: colors.danger,
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit', size: 10 } }
          },
          y: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          }
        }
      }
    });
  }

  // Color helper based on theme
  getThemeColors() {
    const isDark = document.body.classList.contains('dark-mode');
    return {
      text: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? '#242f47' : '#e2e8f0',
      primary: '#2563eb',
      primaryLight: 'rgba(37, 99, 235, 0.2)',
      success: '#10b981',
      successLight: 'rgba(16, 185, 129, 0.2)',
      warning: '#8b5cf6',
      warningLight: 'rgba(139, 92, 246, 0.2)',
      danger: '#f43f5e',
      dangerLight: 'rgba(244, 63, 94, 0.2)',
      colors: ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#38bdf8', '#ec4899', '#14b8a6', '#f43f5e']
    };
  }

  // Draw revenue comparison: Revenue vs. Expenses over past months
  drawRevenueChart(canvasId, transactions) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = this.getThemeColors();
    
    // Group payments and expenses by month
    const monthlyData = {};
    transactions.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expense += t.amount;
      }
    });

    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
      const parts = m.split('-');
      const date = new Date(parts[0], parts[1] - 1);
      return date.toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', year: '2-digit' });
    });
    
    const incomeData = sortedMonths.map(m => monthlyData[m].income);
    const expenseData = sortedMonths.map(m => monthlyData[m].expense);

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [
          {
            label: window.i18nInstance.translate('income'),
            data: incomeData.length ? incomeData : [0],
            backgroundColor: colors.primary,
            borderRadius: 6,
          },
          {
            label: window.i18nInstance.translate('statTotalExpenses'),
            data: expenseData.length ? expenseData : [0],
            backgroundColor: colors.danger,
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          },
          y: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          }
        }
      }
    });
  }

  // Draw attendance chart (Present vs. Absent vs. Late)
  drawAttendanceChart(canvasId, attendanceRecords) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = this.getThemeColors();

    let present = 0;
    let absent = 0;
    let late = 0;

    attendanceRecords.forEach(r => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late') late++;
    });

    const total = present + absent + late;
    const data = total > 0 ? [present, absent, late] : [1, 0, 0]; // default showing 100% present if empty
    
    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          window.i18nInstance.translate('present'),
          window.i18nInstance.translate('absent'),
          window.i18nInstance.translate('late')
        ],
        datasets: [{
          data: data,
          backgroundColor: [colors.success, colors.danger, colors.warning],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          }
        }
      }
    });
  }

  // Draw students distribution by academic levels
  drawLevelsChart(canvasId, students) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = this.getThemeColors();
    const levelCounts = {};

    students.forEach(s => {
      const level = s.academicLevel;
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    const labels = Object.keys(levelCounts);
    const data = Object.values(levelCounts);

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: labels.length ? labels : ['No Students'],
        datasets: [{
          data: data.length ? data : [0],
          backgroundColor: colors.colors.slice(0, Math.max(labels.length, 1)).map(c => c + '88'), // opacity
          borderColor: colors.colors.slice(0, Math.max(labels.length, 1)),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          }
        },
        scales: {
          r: {
            ticks: { display: false },
            grid: { color: colors.grid }
          }
        }
      }
    });
  }

  // Draw student headcount per group
  drawGroupsChart(canvasId, groups, students) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = this.getThemeColors();
    
    // Calculate counts
    const groupStudentCounts = {};
    groups.forEach(g => {
      groupStudentCounts[g.id] = {
        name: document.documentElement.lang === 'ar' ? g.nameAr : g.nameEn,
        count: 0
      };
    });

    students.forEach(s => {
      if (groupStudentCounts[s.groupId]) {
        groupStudentCounts[s.groupId].count++;
      }
    });

    const labels = Object.values(groupStudentCounts).map(v => v.name);
    const data = Object.values(groupStudentCounts).map(v => v.count);

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Groups'],
        datasets: [{
          label: window.i18nInstance.translate('student'),
          data: data.length ? data : [0],
          backgroundColor: colors.warning,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { stepSize: 1, color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          }
        }
      }
    });
  }

  // Draw specific student grades trends
  drawStudentPerformanceChart(canvasId, grades, studentId) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = this.getThemeColors();
    const studentGrades = grades.filter(g => g.studentId === studentId).sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = studentGrades.map(g => g.title);
    const dataPercentages = studentGrades.map(g => (g.score / g.totalMarks) * 100);

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['No Exams yet'],
        datasets: [{
          label: 'Score %',
          data: dataPercentages.length ? dataPercentages : [0],
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          },
          y: {
            grid: { color: colors.grid },
            min: 0,
            max: 100,
            ticks: { color: colors.text, font: { family: document.documentElement.lang === 'ar' ? 'Cairo' : 'Outfit' } }
          }
        }
      }
    });
  }
}

const erpCharts = new ERPCharts();
window.erpChartsInstance = erpCharts; // Expose globally
