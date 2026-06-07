/* ══════════════════════════════════════════════
   TODO APP — JAVASCRIPT
   
   Data Flow:
   1. tasks array mein saara data hai
   2. localStorage mein save hota hai (page reload safe)
   3. Render function tasks array se HTML banata hai
   4. Har action: array update → save → re-render
══════════════════════════════════════════════ */

/* ── STATE ──────────────────────────────────────
   tasks = array of objects: [{id, text, done, priority, createdAt}]
   currentFilter = abhi kaun sa filter active hai
─────────────────────────────────────────────── */
let currentFilter = 'all';

/* ── LOCALSTORAGE HELPERS ───────────────────────
   localStorage = browser ka built-in storage.
   Data page reload ke baad bhi rehta hai.
   Sirf strings store kar sakta hai — isliye JSON use karo.
   JSON.stringify() = Object → String
   JSON.parse()     = String → Object
─────────────────────────────────────────────── */
function loadTasks() {
    const saved = localStorage.getItem('taskflow-tasks');
    /* Agar kuch saved nahi hai to empty array return karo */
    return saved ? JSON.parse(saved) : [];
}

function saveTasks(tasks) {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
}

/* Tasks load karo — page load pe pehle yahi chalega */
let tasks = loadTasks();

/* ── ADD TASK ───────────────────────────────────
   Naya task object banao aur array mein push karo.
   Object ka structure consistent rakhna zaroori hai.
─────────────────────────────────────────────── */
function addTask() {
    const input = document.getElementById('taskInput');
    const sel = document.getElementById('prioritySel');
    const text = input.value.trim(); /* .trim() = spaces remove */

    if (!text) {
        /* Empty input — shake animation dikhao */
        input.style.animation = 'shake 0.3s ease';
        setTimeout(() => input.style.animation = '', 300);
        return;
    }

    /* Naya task object */
    const newTask = {
        id: Date.now(),
        /* Unique ID — current timestamp */
        text: text,
        done: false,
        priority: sel.value,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask); /* unshift = array ke FRONT mein add karo (nayi cheez upar dikhegi) */
    saveTasks(tasks); /* localStorage mein save karo */
    render(); /* UI update karo */

    /* Input clear karo */
    input.value = '';
    input.focus(); /* Cursor wapas input mein */
}

/* ── TOGGLE DONE ────────────────────────────────
   Task ka done status flip karo: true→false ya false→true.
   Array.find() se task dhoondo, property update karo.
─────────────────────────────────────────────── */
function toggleTask(id) {
    const task = tasks.find(t => t.id === id); /* ID se task dhoondo */
    if (task) {
        task.done = !task.done; /* ! = boolean flip */
        saveTasks(tasks);
        render();
    }
}

/* ── DELETE TASK ───────────────────────────────
   Array.filter() = matching items RAKHO, baaki hatao.
   Iska opposite nahi — sirf wahi tasks jinki ID match nahi karti.
─────────────────────────────────────────────── */
function deleteTask(id) {
    /* Animation pehle dikhao, phir actually delete karo */
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
        el.classList.add('removing');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id); /* ID wala hata do */
            saveTasks(tasks);
            render();
        }, 250); /* Animation time = 250ms */
    }
}

/* ── CLEAR COMPLETED ────────────────────────────
   Sare done tasks ek saath delete karo.
─────────────────────────────────────────────── */
document.getElementById('clearDoneBtn').addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done); /* Sirf incomplete tasks rakho */
    saveTasks(tasks);
    render();
});

/* ── FILTER LOGIC ────────────────────────────── */
function getFilteredTasks() {
    /* Switch statement — multiple if-else ka cleaner alternative */
    switch (currentFilter) {
        case 'pending':
            return tasks.filter(t => !t.done);
        case 'done':
            return tasks.filter(t => t.done);
        case 'high':
            return tasks.filter(t => t.priority === 'high');
        default:
            return tasks; /* 'all' — sab dikhao */
    }
}

/* ── RENDER FUNCTION ────────────────────────────
   Ye function screen pe kya dikhega ye decide karta hai.
   tasks array ko HTML string mein convert karta hai.
   
   Pattern: State → UI (UI ko directly mutate mat karo)
─────────────────────────────────────────────── */
function render() {
    const list = document.getElementById('taskList');
    const filtered = getFilteredTasks();

    /* Stats update karo */
    const doneCount = tasks.filter(t => t.done).length;
    const pendingCount = tasks.length - doneCount;

    document.getElementById('total-chip').textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    document.getElementById('done-chip').textContent = `${doneCount} done`;
    document.getElementById('pending-chip').textContent = `${pendingCount} pending`;

    /* Empty state */
    if (filtered.length === 0) {
        list.innerHTML = `
      <div class="empty">
        <div class="emoji">${currentFilter === 'done' ? '✅' : '📋'}</div>
        <p>${currentFilter === 'done' ? 'No completed tasks yet.' : 'No tasks here. Add one above!'}</p>
      </div>`;
        return;
    }

    /*
      Array.map() — har task ko HTML string mein convert karo.
      Template literals (backtick `` ) se multiline HTML easy hai.
      .join('') — array of strings ko ek string mein jodo.
    */
    list.innerHTML = filtered.map(task => `
    <div class="task-item ${task.done ? 'done' : ''}"
         data-id="${task.id}"
         data-priority="${task.priority}">

      <button class="check-btn" onclick="toggleTask(${task.id})">
        ${task.done ? '✓' : ''}
      </button>

      <span class="task-text">${escapeHtml(task.text)}</span>

      <span class="priority-badge ${task.priority}">${task.priority}</span>

      <button class="del-btn" onclick="deleteTask(${task.id})" title="Delete">✕</button>
    </div>
  `).join('');
}

/* ── XSS PROTECTION ─────────────────────────────
   User input ko directly HTML mein mat daalo!
   escapeHtml() special characters ko safe banata hai.
   e.g., <script> → &lt;script&gt; (harmless text)
─────────────────────────────────────────────── */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ── EVENT LISTENERS ────────────────────────────  */

/* Add button click */
document.getElementById('addBtn').addEventListener('click', addTask);

/* Enter key press in input */
document.getElementById('taskInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
});

/* Filter tabs */
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        /* Sare tabs se active hato, sirf is tab pe lagao */
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        render();
    });
});

/* ── SHAKE ANIMATION ─────────────────────────── */
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-6px)}
    60%{transform:translateX(6px)}
  }
`;
document.head.appendChild(style);

/* ── INITIAL RENDER ─────────────────────────────
   Page load hote hi render karo — saved tasks dikhenge.
─────────────────────────────────────────────── */
render();