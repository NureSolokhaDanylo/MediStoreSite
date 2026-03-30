export const messages = {
  en: {
    common: {
      appName: 'MediStore',
      adminPanel: 'Admin Panel',
      logout: 'Logout',
      language: 'Language',
    },
    languages: {
      uk: 'Ukrainian',
      en: 'English',
    },
    navigation: {
      dashboard: 'Dashboard',
      medicines: 'Medicines',
      batches: 'Batches',
      sensors: 'Sensors',
      users: 'Users',
      settings: 'Settings',
    },
    layout: {
      defaultTitle: 'MediStore Admin',
    },
    login: {
      title: 'MediStore Admin',
      subtitle: 'Administrator panel',
      labels: {
        login: 'Login',
        password: 'Password',
      },
      placeholders: {
        login: 'admin',
        password: '••••••••',
      },
      button: {
        signIn: 'Sign in',
        signingIn: 'Signing in...',
      },
      footer: 'Only administrators are allowed',
      errors: {
        invalidCredentials: 'Invalid login or password',
        forbidden: 'Access denied',
        adminOnly: 'Access denied. Only administrators can sign in to this panel.',
        invalidResponse: 'Invalid server response format',
        default: 'Login failed. Please try again later.',
      },
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Welcome to MediStore Admin Dashboard',
      stats: {
        totalMedicines: 'Total medicines',
        activeBatches: 'Active batches',
        activeSensors: 'Active sensors',
        activeAlerts: 'Active alerts',
      },
    },
    pages: {
      comingSoon: 'Content coming soon...',
      medicinesTitle: 'Medicines',
      medicinesSubtitle: 'Medicine management coming soon...',
      medicineDetailsTitle: 'Medicine details',
      batchesTitle: 'Batches',
      batchDetailsTitle: 'Batch details',
      sensorsTitle: 'Sensors',
      usersTitle: 'Users',
      settingsTitle: 'Settings',
      notFoundTitle: 'Page not found',
    },
    roles: {
      admin: 'Admin',
      observer: 'Observer',
      user: 'User',
    },
    debug: {
      title: 'Auth Debug Page',
      authState: 'Auth Store State',
      localStorage: 'LocalStorage',
      goToDashboard: 'Go to Dashboard',
    },
  },
  uk: {
    common: {
      appName: 'MediStore',
      adminPanel: 'Панель адміністратора',
      logout: 'Вийти',
      language: 'Мова',
    },
    languages: {
      uk: 'Українська',
      en: 'Англійська',
    },
    navigation: {
      dashboard: 'Дашборд',
      medicines: 'Ліки',
      batches: 'Партії',
      sensors: 'Сенсори',
      users: 'Користувачі',
      settings: 'Налаштування',
    },
    layout: {
      defaultTitle: 'MediStore Admin',
    },
    login: {
      title: 'MediStore Admin',
      subtitle: 'Панель адміністратора',
      labels: {
        login: 'Логін',
        password: 'Пароль',
      },
      placeholders: {
        login: 'admin',
        password: '••••••••',
      },
      button: {
        signIn: 'Увійти',
        signingIn: 'Вхід...',
      },
      footer: 'Тільки для адміністраторів',
      errors: {
        invalidCredentials: 'Невірний логін або пароль',
        forbidden: 'Доступ заборонено',
        adminOnly: 'Доступ заборонено. Тільки адміністратори можуть увійти в цю панель.',
        invalidResponse: 'Невірний формат відповіді сервера',
        default: 'Помилка входу. Спробуйте пізніше.',
      },
    },
    dashboard: {
      title: 'Дашборд',
      subtitle: 'Ласкаво просимо до адмін-панелі MediStore',
      stats: {
        totalMedicines: 'Усього ліків',
        activeBatches: 'Активні партії',
        activeSensors: 'Активні сенсори',
        activeAlerts: 'Активні сповіщення',
      },
    },
    pages: {
      comingSoon: 'Контент скоро буде доступний...',
      medicinesTitle: 'Ліки',
      medicinesSubtitle: 'Керування ліками незабаром...',
      medicineDetailsTitle: 'Деталі ліків',
      batchesTitle: 'Партії',
      batchDetailsTitle: 'Деталі партії',
      sensorsTitle: 'Сенсори',
      usersTitle: 'Користувачі',
      settingsTitle: 'Налаштування',
      notFoundTitle: 'Сторінку не знайдено',
    },
    roles: {
      admin: 'Адміністратор',
      observer: 'Спостерігач',
      user: 'Користувач',
    },
    debug: {
      title: 'Сторінка діагностики авторизації',
      authState: 'Стан Auth Store',
      localStorage: 'LocalStorage',
      goToDashboard: 'Перейти на дашборд',
    },
  },
} as const

