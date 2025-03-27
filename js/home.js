/**
 * Power ToDo - Sistem Manajemen Produktivitas
 */

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    // Menampilkan tanggal hari ini
    updateDateDisplay();
    
    // Memuat tugas dari penyimpanan lokal
    loadTasks();
    
    // Inisialisasi fitur grafik
    initializeCharts();
    
    // Menangani formulir penambahan tugas
    document.getElementById('task-form').addEventListener('submit', addTask);
    
    // Menangani filter tugas
    document.getElementById('filter-category').addEventListener('change', filterTasks);
    document.getElementById('filter-status').addEventListener('change', filterTasks);
    
    // Inisialisasi tema
    initializeTheme();
    
    // Menangani toggle tema
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
    
    // Inisialisasi scrolling yang ditingkatkan
    initializeEnhancedScrolling();
    
    // Cek dan tampilkan modal username jika diperlukan
    initializeUsername();
    
    // Inisialisasi tombol edit username
    document.getElementById('edit-username-btn').addEventListener('click', showUsernameModal);
});

/**
 * Menampilkan tanggal hari ini dalam format Indonesia
 */
function updateDateDisplay() {
    const dateElem = document.querySelector('.date-display');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    
    dateElem.textContent = today.toLocaleDateString('id-ID', options);
}

/**
 * Kelas untuk manajemen tugas
 */
class PowerTodoList {
    constructor() {
        this.tasks = [];
        this.loadFromStorage();
    }
    
    // Menambahkan tugas baru
    addTask(taskDetails) {
        const newTask = {
            id: Date.now().toString(),
            title: taskDetails.title,
            description: taskDetails.description || '',
            category: taskDetails.category,
            priority: taskDetails.priority,
            deadline: taskDetails.deadline,
            estimatedTime: taskDetails.estimatedTime,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(newTask);
        this.saveToStorage();
        return newTask;
    }
    
    // Menghapus tugas
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveToStorage();
    }
    
    // Mengubah status penyelesaian tugas
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            return task;
        }
        return null;
    }
    
    // Mendapatkan tugas berdasarkan filter
    getTasks(filter = {}) {
        let filteredTasks = [...this.tasks];
        
        if (filter.category && filter.category !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === filter.category);
        }
        
        if (filter.status && filter.status !== 'all') {
            const completed = filter.status === 'completed';
            filteredTasks = filteredTasks.filter(task => task.completed === completed);
        }
        
        return filteredTasks;
    }
    
    // Mendapatkan ringkasan statistik
    getStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        const tasksByCategory = {
            professional: this.tasks.filter(task => task.category === 'professional').length,
            personal: this.tasks.filter(task => task.category === 'personal').length,
            academic: this.tasks.filter(task => task.category === 'academic').length
        };
        
        const tasksByPriority = {
            low: this.tasks.filter(task => task.priority === 'low').length,
            medium: this.tasks.filter(task => task.priority === 'medium').length,
            high: this.tasks.filter(task => task.priority === 'high').length,
            urgent: this.tasks.filter(task => task.priority === 'urgent').length
        };
        
        // Buat data harian untuk grafik
        const dailyData = this.getDailyTaskData();
        
        return {
            total,
            completed,
            pending,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
            tasksByCategory,
            tasksByPriority,
            dailyData
        };
    }
    
    // Untuk mendapatkan data harian untuk grafik
    getDailyTaskData() {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const dailyCompleted = {};
        const dailyCreated = {};
        
        last7Days.forEach(day => {
            dailyCompleted[day] = 0;
            dailyCreated[day] = 0;
        });
        
        this.tasks.forEach(task => {
            const taskDate = task.createdAt.split('T')[0];
            if (dailyCreated[taskDate] !== undefined) {
                dailyCreated[taskDate]++;
            }
            
            if (task.completed) {
                const completedDate = task.completedAt ? task.completedAt.split('T')[0] : taskDate;
                if (dailyCompleted[completedDate] !== undefined) {
                    dailyCompleted[completedDate]++;
                }
            }
        });
        
        return {
            labels: last7Days.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('id-ID', { weekday: 'short' });
            }),
            created: Object.values(dailyCreated),
            completed: Object.values(dailyCompleted)
        };
    }
    
    // Menyimpan tugas ke local storage
    saveToStorage() {
        localStorage.setItem('powerTodoTasks', JSON.stringify(this.tasks));
    }
    
    // Memuat tugas dari local storage
    loadFromStorage() {
        const storedTasks = localStorage.getItem('powerTodoTasks');
        this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
    }
}


const todoList = new PowerTodoList();

/**
 * Menambahkan tugas baru
 */
function addTask(e) {
    e.preventDefault();
    
    const taskTitle = document.getElementById('task-title').value.trim();
    const taskCategory = document.getElementById('task-category').value;
    const taskPriority = document.getElementById('task-priority').value;
    const taskDeadline = document.getElementById('task-deadline').value;
    const taskEstimate = document.getElementById('task-estimate').value;
    const taskDescription = document.getElementById('task-description').value.trim();
    
    if (!taskTitle || !taskCategory || !taskPriority) {
        alert('Judul, kategori, dan prioritas harus diisi!');
        return;
    }
    
    const newTask = todoList.addTask({
        title: taskTitle,
        description: taskDescription,
        category: taskCategory,
        priority: taskPriority,
        deadline: taskDeadline,
        estimatedTime: taskEstimate
    });
    
    renderTask(newTask);
    updateStatistics();
    
    // Tampilkan notifikasi tugas berhasil ditambahkan
    showSuccessNotification(taskTitle);
    
    // Reset formulir
    document.getElementById('task-form').reset();
}

/**
 * Menampilkan notifikasi sukses dengan animasi modern
 * @param {string} taskTitle - Judul tugas yang berhasil ditambahkan
 */
function showSuccessNotification(taskTitle) {
    const popup = document.getElementById('task-added-popup');
    const taskTitleElement = popup.querySelector('.notification-task-title');
    
    // Set judul tugas yang baru ditambahkan
    taskTitleElement.textContent = `"${taskTitle}"`;
    
    // Reset animasi progress bar
    const progressBar = popup.querySelector('.progress-bar');
    progressBar.style.animation = 'none';
    void progressBar.offsetWidth; // Memaksa reflow
    progressBar.style.animation = 'progress-shrink 5s linear forwards';
    
    // Tampilkan popup
    popup.classList.remove('hide');
    popup.classList.add('show');
    
    // Set timer untuk menghilangkan popup
    const hideTimeout = setTimeout(() => {
        hideNotification(popup);
    }, 5000); // Sesuai dengan durasi animasi progress bar
    
    // Tambahkan event listener untuk tombol close
    const closeButton = popup.querySelector('.notification-close');
    closeButton.onclick = () => {
        clearTimeout(hideTimeout);
        hideNotification(popup);
    };
}

/**
 * Menyembunyikan notifikasi dengan animasi
 * @param {HTMLElement} popup - Elemen popup yang akan disembunyikan
 */
function hideNotification(popup) {
    popup.classList.add('hide');
    popup.classList.remove('show');
    
    // Hapus kelas hide setelah animasi selesai
    setTimeout(() => {
        popup.classList.remove('hide');
    }, 500);
}

/**
 * Memuat tugas dari storage dan menampilkan di UI
 */
function loadTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    
    const filter = {
        category: document.getElementById('filter-category').value,
        status: document.getElementById('filter-status').value
    };
    
    const tasks = todoList.getTasks(filter);
    
    if (tasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-task-message';
        emptyMessage.textContent = 'Tidak ada tugas yang ditemukan';
        taskList.appendChild(emptyMessage);
    } else {
        tasks.forEach(task => renderTask(task));
    }
    
    updateStatistics();
    
    // Cek scrolling setelah tugas dimuat
    setTimeout(() => {
        if (typeof initializeEnhancedScrolling === 'function') {
            initializeEnhancedScrolling();
        }
    }, 100);
}

/**
 * Menampilkan tugas di UI
 */
function renderTask(task) {
    const taskList = document.getElementById('task-list');
    const taskTemplate = document.getElementById('task-template');
    const taskNode = document.importNode(taskTemplate.content, true);
    
    const taskItem = taskNode.querySelector('.task-item');
    taskItem.dataset.id = task.id;
    taskItem.classList.add(`priority-${task.priority}`);
    if (task.completed) {
        taskItem.classList.add('task-completed');
    }
    
    // Mengisi data tugas
    taskNode.querySelector('.task-title').textContent = task.title;
    taskNode.querySelector('.task-description').textContent = task.description;
    
    // Menampilkan kategori
    const categoryElem = taskNode.querySelector('.task-category');
    categoryElem.textContent = getCategoryLabel(task.category);
    
    // Menampilkan deadline jika ada
    const deadlineElem = taskNode.querySelector('.task-deadline');
    if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        deadlineElem.textContent = `Deadline: ${deadlineDate.toLocaleDateString('id-ID')}`;
    } else {
        deadlineElem.remove();
    }
    
    // Menangani checkbox
    const checkbox = taskNode.querySelector('.task-complete-checkbox');
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
        const updatedTask = todoList.toggleTaskCompletion(task.id);
        if (updatedTask.completed) {
            updatedTask.completedAt = new Date().toISOString();
            taskItem.classList.add('task-completed');
        } else {
            taskItem.classList.remove('task-completed');
        }
        updateStatistics();
    });
    
    // Menangani tombol hapus
    taskNode.querySelector('.btn-delete').addEventListener('click', () => {
        showDeleteConfirmation(task);
    });
    
    // Animasi
    taskItem.classList.add('fade-in');
    
    // Tambahkan smooth scroll ke tugas baru yang ditambahkan
    setTimeout(() => {
        const taskItem = document.querySelector(`[data-id="${task.id}"]`);
        if (taskItem) {
            taskItem.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        }
    }, 100);
    
    taskList.appendChild(taskNode);
}

/**
 * Menampilkan popup konfirmasi hapus tugas
 * @param {Object} task - Tugas yang akan dihapus
 */
function showDeleteConfirmation(task) {
    const modal = document.getElementById('delete-modal-overlay');
    const cancelButton = document.getElementById('cancel-delete-btn');
    const confirmButton = document.getElementById('confirm-delete-btn');
    const taskTitleElement = modal.querySelector('.delete-task-title');
    
    // Tampilkan judul tugas dalam konfirmasi
    taskTitleElement.textContent = task.title;
    
    // Tampilkan modal
    modal.classList.add('show');
    
    // Nonaktifkan scrolling pada body
    document.body.style.overflow = 'hidden';
    
    // Tambahkan event untuk tombol batal
    cancelButton.onclick = () => {
        hideDeleteConfirmation(modal);
    };
    
    // Tambahkan event untuk tombol konfirmasi hapus
    confirmButton.onclick = () => {
        // Lakukan penghapusan
        const taskItem = document.querySelector(`[data-id="${task.id}"]`);
        todoList.deleteTask(task.id);
        
        hideDeleteConfirmation(modal);
        
        // Animasi menghilangkan tugas
        taskItem.classList.add('fade-out');
        setTimeout(() => {
            taskItem.remove();
            updateStatistics();
            
            // Tampilkan notifikasi penghapusan berhasil
            showDeletedNotification(task.title);
        }, 300);
    };
    
    // Tambahkan event untuk menutup modal dengan klik di luar
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideDeleteConfirmation(modal);
        }
    };
    
    // Tambahkan event untuk tombol ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            hideDeleteConfirmation(modal);
        }
    });
    
    // Tambahkan efek shake setelah modal muncul
    setTimeout(() => {
        const modalContainer = modal.querySelector('.modal-container');
        modalContainer.classList.add('shake');
        setTimeout(() => {
            modalContainer.classList.remove('shake');
        }, 600);
    }, 100);
}

/**
 * Menyembunyikan popup konfirmasi hapus
 * @param {HTMLElement} modal - Elemen modal yang akan disembunyikan
 */
function hideDeleteConfirmation(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

/**
 * Menampilkan notifikasi saat tugas berhasil dihapus
 * @param {string} taskTitle - Judul tugas yang telah dihapus
 */
function showDeletedNotification(taskTitle) {
    const popup = document.getElementById('task-added-popup');
    const taskTitleElement = popup.querySelector('.notification-task-title');
    const notificationIcon = popup.querySelector('.notification-icon');
    const notificationTitle = popup.querySelector('.notification-text h3');
    
    // Ubah warna icon dan judul untuk notifikasi hapus
    notificationIcon.style.background = 'linear-gradient(135deg, var(--danger), #fb7185)';
    notificationIcon.innerHTML = '<i class="fas fa-trash-alt"></i>';
    notificationTitle.textContent = 'Tugas Berhasil Dihapus';
    
    // Set judul tugas yang dihapus
    taskTitleElement.textContent = `"${taskTitle}"`;
    
    // Reset animasi progress bar
    const progressBar = popup.querySelector('.progress-bar');
    progressBar.style.animation = 'none';
    void progressBar.offsetWidth; // Memaksa reflow
    progressBar.style.animation = 'progress-shrink 5s linear forwards';
    
    // Tampilkan popup
    popup.classList.remove('hide');
    popup.classList.add('show');
    
    // Set timer untuk menghilangkan popup
    const hideTimeout = setTimeout(() => {
        hideNotification(popup);
        
        // Reset ke notifikasi tugas ditambahkan (default)
        setTimeout(() => {
            notificationIcon.style.background = 'linear-gradient(135deg, var(--success), #34d399)';
            notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            notificationTitle.textContent = 'Tugas Berhasil Ditambahkan';
        }, 500);
    }, 5000);
    
    // Tambahkan event listener untuk tombol close
    const closeButton = popup.querySelector('.notification-close');
    closeButton.onclick = () => {
        clearTimeout(hideTimeout);
        hideNotification(popup);
        
        // Reset ke notifikasi tugas ditambahkan (default)
        setTimeout(() => {
            notificationIcon.style.background = 'linear-gradient(135deg, var(--success), #34d399)';
            notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            notificationTitle.textContent = 'Tugas Berhasil Ditambahkan';
        }, 500);
    };
}

/**
 * Memperbarui tampilan statistik
 */
function updateStatistics() {
    const stats = todoList.getStatistics();
    
    // Update statistik cepat
    document.querySelector('.stat-number').textContent = stats.total;
    document.querySelectorAll('.stat-number')[1].textContent = stats.completed;
    
    // Update progress bar
    const progressBar = document.querySelector('.progress');
    progressBar.style.width = `${stats.progress}%`;
    
    // Update grafik jika tersedia
    updateCharts(stats);
}

/**
 * Memfilter tugas berdasarkan kategori dan status
 */
function filterTasks() {
    loadTasks();
}

/**
 * Mendapatkan label kategori dalam bahasa Indonesia
 */
function getCategoryLabel(category) {
    switch(category) {
        case 'professional': return 'Profesional';
        case 'personal': return 'Personal';
        case 'academic': return 'Akademik';
        default: return category;
    }
}

/**
 * Inisialisasi tema berdasarkan preferensi pengguna yang tersimpan
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('powerTodoTheme');
    
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
        updateThemeIcon();
    }
}

/**
 * Mengganti tema antara light dan dark
 */
function toggleTheme() {
    const root = document.documentElement;
    const isLightTheme = root.classList.toggle('light-theme');
    
    // Menyimpan preferensi tema
    localStorage.setItem('powerTodoTheme', isLightTheme ? 'light' : 'dark');
    
    // Memperbarui ikon tema
    updateThemeIcon();
    
    // Memperbarui grafik sesuai tema baru
    if (window.weeklyChart && window.categoryChart) {
        updateCharts(todoList.getStatistics());
    }
}

/**
 * Memperbarui ikon tema berdasarkan tema aktif
 */
function updateThemeIcon() {
    const themeToggleButton = document.querySelector('.theme-toggle');
    const isLightTheme = document.documentElement.classList.contains('light-theme');
    
    // Memperbarui teks/ikon
    if (!themeToggleButton.querySelector('.fa-sun')) {
        themeToggleButton.innerHTML = '<i class="fas fa-sun"></i><i class="fas fa-moon"></i>';
    }
}

/**
 * Inisialisasi grafik
 */
function initializeCharts() {
    const stats = todoList.getStatistics();
    
    // Mendapatkan tema saat ini
    const isLightTheme = document.documentElement.classList.contains('light-theme');
    const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
    const gridColor = isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    // Chart mingguan
    const weeklyCtx = document.getElementById('weekly-chart').getContext('2d');
    window.weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: stats.dailyData.labels,
            datasets: [
                {
                    label: 'Tugas Dibuat',
                    data: stats.dailyData.created,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Tugas Selesai',
                    data: stats.dailyData.completed,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: isLightTheme ? '#64748b' : '#94a3b8'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: isLightTheme ? '#64748b' : '#94a3b8'
                    }
                }
            }
        }
    });
    
    // Chart kategori
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    window.categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Profesional', 'Personal', 'Akademik'],
            datasets: [{
                data: [
                    stats.tasksByCategory.professional,
                    stats.tasksByCategory.personal,
                    stats.tasksByCategory.academic
                ],
                backgroundColor: [
                    '#0ea5e9',
                    '#06b6d4',
                    '#22d3ee'
                ],
                borderColor: isLightTheme ? '#ffffff' : '#1e293b',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

/**
 * Memperbarui grafik dengan data terbaru
 */
function updateCharts(stats) {
    // Mendapatkan tema saat ini
    const isLightTheme = document.documentElement.classList.contains('light-theme');
    const textColor = isLightTheme ? '#1e293b' : '#f1f5f9';
    const gridColor = isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    if (window.weeklyChart) {
        window.weeklyChart.data.labels = stats.dailyData.labels;
        window.weeklyChart.data.datasets[0].data = stats.dailyData.created;
        window.weeklyChart.data.datasets[1].data = stats.dailyData.completed;
        
        // Memperbarui opsi untuk tema
        window.weeklyChart.options.plugins.legend.labels.color = textColor;
        window.weeklyChart.options.scales.x.grid.color = gridColor;
        window.weeklyChart.options.scales.y.grid.color = gridColor;
        window.weeklyChart.options.scales.x.ticks.color = isLightTheme ? '#64748b' : '#94a3b8';
        window.weeklyChart.options.scales.y.ticks.color = isLightTheme ? '#64748b' : '#94a3b8';
        
        window.weeklyChart.update();
    }
    
    if (window.categoryChart) {
        window.categoryChart.data.datasets[0].data = [
            stats.tasksByCategory.professional,
            stats.tasksByCategory.personal,
            stats.tasksByCategory.academic
        ];
        
        // Memperbarui opsi untuk tema
        window.categoryChart.data.datasets[0].borderColor = isLightTheme ? '#ffffff' : '#1e293b';
        window.categoryChart.options.plugins.legend.labels.color = textColor;
        
        window.categoryChart.update();
    }
}

/**
 * Inisialisasi scrolling yang ditingkatkan untuk pengalaman pengguna yang lebih baik
 */
function initializeEnhancedScrolling() {
    // Mendapatkan elemen task-list untuk scrolling yang ditingkatkan
    const taskList = document.getElementById('task-list');
    const taskListContainer = document.querySelector('.task-list-container');
    
    // Menambahkan indikator scroll jika konten melebihi area yang dapat dilihat
    const scrollHint = document.createElement('div');
    scrollHint.className = 'scroll-hint';
    scrollHint.innerHTML = '<i class="fas fa-chevron-down"></i>';
    scrollHint.title = 'Scroll untuk melihat lebih banyak tugas';
    taskListContainer.appendChild(scrollHint);
    
    // Memeriksa apakah scrolling dibutuhkan dan menampilkan hint jika perlu
    function checkScrollHint() {
        if (taskList.scrollHeight > taskList.clientHeight) {
            // Hanya tampilkan jika ada konten yang tersembunyi
            scrollHint.style.display = 'block';
            
            // Sembunyikan hint ketika sudah di-scroll ke bawah
            if (taskList.scrollHeight - taskList.scrollTop <= taskList.clientHeight + 20) {
                scrollHint.style.display = 'none';
            }
        } else {
            scrollHint.style.display = 'none';
        }
    }
    
    // Menangani event klik pada scroll hint untuk smooth scroll
    scrollHint.addEventListener('click', () => {
        taskList.scrollBy({
            top: 200,
            behavior: 'smooth'
        });
    });
    
    // Menangani event scroll untuk menyembunyikan hint ketika sudah di-scroll
    taskList.addEventListener('scroll', () => {
        checkScrollHint();
        
        // Tambahkan efek saat scrolling
        taskList.classList.add('scrolling');
        clearTimeout(taskList.scrollTimer);
        taskList.scrollTimer = setTimeout(() => {
            taskList.classList.remove('scrolling');
        }, 300);
    });
    
    // Periksa saat ukuran jendela berubah atau tugas ditambahkan/dihapus
    window.addEventListener('resize', checkScrollHint);
    
    // Jalankan pemeriksaan awal
    checkScrollHint();
    
    // Tambahkan optimasi scroll untuk performa yang lebih baik
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        item.style.willChange = 'transform'; // Optimasi rendering browser
    });
}

/**
 * Variabel global untuk melacak perubahan
 */
const profileState = {
    initialLoaded: false,
    imageModified: false,
    originalUsername: '',
    originalImage: '',
    eventListenersInitialized: false
};

/**
 * Inisialisasi nama pengguna dan cek apakah perlu menampilkan modal input
 */
function initializeUsername() {
    try {
        const username = localStorage.getItem('powerTodoUsername');
        const usernameElement = document.querySelector('.username');
        const profileImage = document.querySelector('.user-profile img');
        
        // Cek dan muat gambar profil jika tersedia
        const savedProfileImage = localStorage.getItem('powerTodoProfileImage');
        
        // Simpan state awal
        profileState.originalUsername = username || '';
        profileState.originalImage = savedProfileImage || '';
        profileState.initialLoaded = true;
        
        if (savedProfileImage) {
            // Set default fallback jika gambar gagal dimuat
            profileImage.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=User&background=random`;
                // Hapus gambar yang rusak dari penyimpanan
                localStorage.removeItem('powerTodoProfileImage');
            };
            
            profileImage.src = savedProfileImage;
        }
        
        if (username) {
            // Jika username ada di localStorage, tampilkan
            usernameElement.textContent = username;
            
            // Update profile image API URL untuk user avatar jika tidak ada gambar custom
            if (!savedProfileImage) {
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
                profileImage.src = avatarUrl;
            }
            
            // Tampilkan tombol edit setelah delay singkat
            setTimeout(() => {
                const editButton = document.getElementById('edit-username-btn');
                if (editButton) {
                    editButton.classList.add('show');
                }
            }, 1000);
        } else {
            // Jika belum ada username, tampilkan modal input
            showUsernameModal();
        }
    } catch (error) {
        console.error("Error initializing username:", error);
        // Fallback untuk mencegah kegagalan aplikasi
        const usernameElement = document.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = "User";
        }
    }
}

/**
 * Menampilkan modal input nama pengguna
 */
function showUsernameModal() {
    try {
        const modal = document.getElementById('username-modal-overlay');
        const usernameInput = document.getElementById('username-input');
        const saveButton = document.getElementById('save-username-btn');
        const cancelButton = document.getElementById('cancel-username-btn'); // Tambahkan referensi tombol batal
        const profileUpload = document.getElementById('profile-upload');
        const profilePreview = document.getElementById('profile-preview');
        const previewImage = document.getElementById('preview-image');
        
        if (!modal || !usernameInput || !profileUpload || !profilePreview || !previewImage || !cancelButton) {
            console.error("Required DOM elements not found");
            return;
        }
        
        // Reset state tracking perubahan gambar
        profileState.imageModified = false;
        
        // Reset input dan focus
        const currentUsername = document.querySelector('.username').textContent;
        usernameInput.value = currentUsername !== 'User' ? currentUsername : '';
        
        // Initialize preview image
        const savedProfileImage = localStorage.getItem('powerTodoProfileImage');
        if (savedProfileImage) {
            previewImage.src = savedProfileImage;
        } else {
            // Use default avatar based on username
            previewImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUsername)}&background=random`;
        }
        
        // Set fallback if image fails to load
        previewImage.onerror = function() {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUsername)}&background=random`;
        };
        
        // Setup event listeners only once
        if (!profileState.eventListenersInitialized) {
            // Setup profile image upload interaction
            profilePreview.addEventListener('click', () => {
                profileUpload.click();
            });
            
            profileUpload.addEventListener('change', handleProfileImageUpload);
            
            // Tangani event untuk tombol simpan
            saveButton.addEventListener('click', saveUsername);
            
            // Tangani event untuk tombol Enter
            usernameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveUsername();
                    e.preventDefault();
                }
            });
            
            // Tambahkan efek visual pada input saat focus
            usernameInput.addEventListener('focus', () => {
                const container = usernameInput.parentElement;
                if (container) container.classList.add('input-focused');
            });
            
            usernameInput.addEventListener('blur', () => {
                const container = usernameInput.parentElement;
                if (container) container.classList.remove('input-focused');
            });
            
            // Tambahkan event listener untuk tombol batal
            cancelButton.addEventListener('click', () => closeUsernameModal(modal));
            
            profileState.eventListenersInitialized = true;
        }
        
        // Tampilkan modal
        modal.classList.add('show');
        
        // Focus pada input setelah animasi selesai
        setTimeout(() => {
            usernameInput.focus();
        }, 300);
        
        // Nonaktifkan scrolling pada body
        document.body.style.overflow = 'hidden';
        
        // Animasi elemen dekorasi
        animateDecorations();
    } catch (error) {
        console.error("Error showing username modal:", error);
        alert("Terjadi kesalahan saat menampilkan modal. Silakan muat ulang halaman.");
    }
}

/**
 * Menangani upload gambar profil dengan validasi dan error handling
 * @param {Event} e - Event dari input file
 */
function handleProfileImageUpload(e) {
    try {
        const file = e.target.files[0];
        const previewImage = document.getElementById('preview-image');
        const profilePreview = document.getElementById('profile-preview');
        
        if (!file || !previewImage || !profilePreview) {
            return;
        }
        
        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
            alert('Hanya file gambar yang diperbolehkan.');
            return;
        }
        
        // Validasi ukuran file (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file terlalu besar. Maksimal 2MB.');
            return;
        }
        
        // Tandai bahwa gambar telah dimodifikasi
        profileState.imageModified = true;
        
        // Tambahkan kelas animasi uploading
        profilePreview.classList.add('uploading');
        
        const reader = new FileReader();
        
        // Handler untuk error saat membaca file
        reader.onerror = function() {
            profilePreview.classList.remove('uploading');
            alert('Gagal membaca file gambar.');
            console.error('FileReader error:', reader.error);
        };
        
        reader.onload = function(event) {
            // Simpan source asli untuk pemulihan jika terjadi error
            const originalSrc = previewImage.src;
            
            // Set handler error untuk gambar
            previewImage.onerror = function() {
                alert('Gagal memuat gambar. File mungkin rusak.');
                previewImage.src = originalSrc;
                profilePreview.classList.remove('uploading');
                profileState.imageModified = false;
            };
            
            // Set source baru
            previewImage.src = event.target.result;
            
            // Hapus kelas uploading setelah gambar dimuat
            previewImage.onload = function() {
                setTimeout(() => {
                    profilePreview.classList.remove('uploading');
                }, 1000);
            };
        };
        
        // Mulai membaca file
        reader.readAsDataURL(file);
    } catch (error) {
        console.error("Error handling profile image upload:", error);
        alert("Terjadi kesalahan saat mengunggah gambar.");
        profileState.imageModified = false;
        
        const profilePreview = document.getElementById('profile-preview');
        if (profilePreview) {
            profilePreview.classList.remove('uploading');
        }
    }
}

/**
 * Menyimpan nama pengguna dari modal input dengan penanganan error
 */
function saveUsername() {
    try {
        const modal = document.getElementById('username-modal-overlay');
        const usernameInput = document.getElementById('username-input');
        
        if (!modal || !usernameInput) {
            throw new Error("Required DOM elements not found");
        }
        
        const username = usernameInput.value.trim();
        
        if (username) {
            // Deteksi jenis perubahan secara efisien
            let changeType;
            const isNewUser = !profileState.originalUsername;
            const isNameChanged = username !== profileState.originalUsername;
            
            // Deteksi perubahan berdasarkan state tracking
            if (isNewUser) {
                changeType = 'welcome';
            } else if (isNameChanged && profileState.imageModified) {
                changeType = 'both';
            } else if (isNameChanged) {
                changeType = 'name';
            } else if (profileState.imageModified) {
                changeType = 'image';
            } else {
                changeType = 'none';
            }
            
            // Simpan data baru ke localStorage dengan try-catch untuk menangkap error storage
            try {
                localStorage.setItem('powerTodoUsername', username);
                
                // Simpan gambar profil jika dimodifikasi
                if (profileState.imageModified) {
                    const previewImage = document.getElementById('preview-image');
                    if (previewImage && previewImage.src && !previewImage.src.includes('ui-avatars.com')) {
                        try {
                            localStorage.setItem('powerTodoProfileImage', previewImage.src);
                        } catch (storageError) {
                            // Gambar mungkin terlalu besar untuk localStorage
                            console.error("Failed to save image to localStorage:", storageError);
                            alert("Gagal menyimpan gambar. Gambar mungkin terlalu besar.");
                        }
                    }
                }
            } catch (storageError) {
                console.error("localStorage error:", storageError);
                alert("Gagal menyimpan data profil.");
            }
            
            // Update UI
            updateUserInterface(username, changeType);
            
            // Tampilkan notifikasi sukses jika ada perubahan
            if (changeType !== 'none') {
                showUsernameNotification(username, changeType);
            }
            
            // Perbarui state tracking setelah perubahan
            profileState.originalUsername = username;
            if (profileState.imageModified) {
                const previewImage = document.getElementById('preview-image');
                if (previewImage) {
                    profileState.originalImage = previewImage.src;
                }
            }
            profileState.imageModified = false;
            
            // Sembunyikan modal
            modal.classList.remove('show');
            document.body.style.overflow = '';
        } else {
            // Animasi shake jika input kosong
            const modalContainer = modal.querySelector('.modal-container');
            if (modalContainer) {
                modalContainer.classList.add('shake');
                setTimeout(() => {
                    modalContainer.classList.remove('shake');
                }, 600);
            }
            
            // Focus kembali ke input
            usernameInput.focus();
        }
    } catch (error) {
        console.error("Error saving username:", error);
        alert("Terjadi kesalahan saat menyimpan profil.");
        
        // Memastikan modal ditutup dan body scroll dipulihkan dalam kasus error
        const modal = document.getElementById('username-modal-overlay');
        if (modal) {
            modal.classList.remove('show');
        }
        document.body.style.overflow = '';
    }
}

/**
 * Menutup modal nama pengguna tanpa menyimpan perubahan
 * @param {HTMLElement} modal - Elemen modal yang akan ditutup
 */
function closeUsernameModal(modal) {
    try {
        // Pastikan modal ada
        if (!modal) {
            modal = document.getElementById('username-modal-overlay');
        }
        
        if (modal) {
            // Hapus class show untuk menyembunyikan modal
            modal.classList.remove('show');
            
            // Pulihkan scrolling pada body
            document.body.style.overflow = '';
            
            // Reset state perubahan gambar
            profileState.imageModified = false;
        }
    } catch (error) {
        console.error("Error closing username modal:", error);
        // Pastikan body scroll dipulihkan meskipun terjadi error
        document.body.style.overflow = '';
    }
}

/**
 * Memperbarui elemen UI dengan data pengguna baru dengan penanganan error
 * @param {string} username - Nama pengguna baru
 * @param {string} changeType - Jenis perubahan ('welcome', 'name', 'image', 'both', 'none')
 */
function updateUserInterface(username, changeType) {
    try {
        const usernameElement = document.querySelector('.username');
        const profileImage = document.querySelector('.user-profile img');
        const previewImage = document.getElementById('preview-image');
        
        if (!usernameElement || !profileImage) {
            throw new Error("Required DOM elements not found");
        }
        
        // Animasikan perubahan sesuai jenis perubahan
        if (changeType === 'welcome' || changeType === 'name' || changeType === 'both') {
            // Animasi update username
            usernameElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            usernameElement.style.opacity = '0';
            usernameElement.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                usernameElement.textContent = username;
                usernameElement.style.opacity = '1';
                usernameElement.style.transform = 'translateY(0)';
            }, 300);
        }
        
        if ((changeType === 'welcome' || changeType === 'image' || changeType === 'both') && previewImage) {
            // Set fallback jika gambar gagal dimuat
            profileImage.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
            };
            
            // Animasi update gambar
            profileImage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            profileImage.style.opacity = '0';
            profileImage.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                profileImage.src = previewImage.src;
                profileImage.style.opacity = '1';
                profileImage.style.transform = 'scale(1)';
            }, 300);
        }
        
        // Tampilkan tombol edit
        const editButton = document.getElementById('edit-username-btn');
        if (editButton) {
            editButton.classList.add('show');
        }
    } catch (error) {
        console.error("Error updating user interface:", error);
    }
}

/**
 * Menampilkan notifikasi bahwa data profil berhasil diubah
 * @param {string} username - Nama pengguna
 * @param {string} changeType - Jenis perubahan ('welcome', 'name', 'image', 'both')
 */
function showUsernameNotification(username, changeType) {
    const popup = document.getElementById('task-added-popup');
    const taskTitleElement = popup.querySelector('.notification-task-title');
    const notificationIcon = popup.querySelector('.notification-icon');
    const notificationTitle = popup.querySelector('.notification-text h3');
    
    // Set tampilan notifikasi berdasarkan jenis perubahan
    notificationIcon.style.background = 'linear-gradient(135deg, var(--accent-color), var(--neon-color))';
    
    // Tentukan ikon, judul, dan pesan berdasarkan jenis perubahan
    switch (changeType) {
        case 'welcome':
            notificationIcon.innerHTML = '<i class="fas fa-user-plus"></i>';
            notificationTitle.textContent = 'Selamat Datang di PowerToDo';
            taskTitleElement.textContent = `Halo, ${username}! Profil Anda telah dibuat.`;
            break;
            
        case 'name':
            notificationIcon.innerHTML = '<i class="fas fa-user-edit"></i>';
            notificationTitle.textContent = 'Nama Pengguna Berhasil Diubah';
            taskTitleElement.textContent = `Nama Anda sekarang ${username}!`;
            break;
            
        case 'image':
            notificationIcon.innerHTML = '<i class="fas fa-camera"></i>';
            notificationTitle.textContent = 'Foto Profil Berhasil Diubah';
            taskTitleElement.textContent = `Foto profil Anda telah diperbarui!`;
            break;
            
        case 'both':
            notificationIcon.innerHTML = '<i class="fas fa-user-cog"></i>';
            notificationTitle.textContent = 'Profil Berhasil Diperbarui';
            taskTitleElement.textContent = `Nama dan foto profil telah diperbarui!`;
            break;
    }
    
    // Reset animasi progress bar
    const progressBar = popup.querySelector('.progress-bar');
    progressBar.style.animation = 'none';
    void progressBar.offsetWidth; // Memaksa reflow
    progressBar.style.animation = 'progress-shrink 5s linear forwards';
    
    // Tampilkan popup
    popup.classList.remove('hide');
    popup.classList.add('show');
    
    // Set timer untuk menghilangkan popup
    const hideTimeout = setTimeout(() => {
        hideNotification(popup);
        
        // Reset ke notifikasi default setelah selesai
        setTimeout(() => {
            notificationIcon.style.background = 'linear-gradient(135deg, var(--success), #34d399)';
            notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            notificationTitle.textContent = 'Tugas Berhasil Ditambahkan';
        }, 500);
    }, 5000);
    
    // Tambahkan event listener untuk tombol close
    const closeButton = popup.querySelector('.notification-close');
    closeButton.onclick = () => {
        clearTimeout(hideTimeout);
        hideNotification(popup);
        
        // Reset ke notifikasi default
        setTimeout(() => {
            notificationIcon.style.background = 'linear-gradient(135deg, var(--success), #34d399)';
            notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            notificationTitle.textContent = 'Tugas Berhasil Ditambahkan';
        }, 500);
    };
}

/**
 * Animasi elemen dekorasi untuk modal username
 */
function animateDecorations() {
    const decorations = document.querySelectorAll('.decoration-circle');
    
    decorations.forEach(circle => {
        // Animasi random untuk posisi awal
        const randomX = Math.random() * 20 - 10; // -10 sampai 10px
        const randomY = Math.random() * 20 - 10;
        
        // Animasi bergerak perlahan
        circle.style.animation = `floating ${3 + Math.random() * 2}s ease-in-out infinite alternate`;
        
        // Atur posisi awal yang sedikit berbeda
        circle.style.transform = `translate(${randomX}px, ${randomY}px)`;
    });
}

// Tambahkan keyframe CSS untuk animasi floating
(function addFloatingAnimation() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes floating {
            0% { transform: translate(0, 0); }
            100% { transform: translate(10px, -10px); }
        }
    `;
    document.head.appendChild(styleSheet);
})();
