let todosByDate = {};
let selectedDateStr = '';
let currentDate = new Date();

// 상수 정의
const priorities = {
    HIGH: { name: '높음', color: '#f44336', icon: '⚡' },
    MEDIUM: { name: '중간', color: '#ff9800', icon: '⭐' },
    LOW: { name: '낮음', color: '#4caf50', icon: '🌱' }
};

// goals를 localStorage에서 가져오도록 수정
let goals = JSON.parse(localStorage.getItem('goals')) || {
    daily: { count: 3, reward: '🌟' },
    weekly: { count: 15, reward: '🏆' },
    monthly: { count: 50, reward: '👑' }
};

// 공휴일 데이터
const holidays = {
    '1-1': '신정',
    '3-1': '삼일절',
    '5-5': '어린이날',
    '6-6': '현충일',
    '8-15': '광복절',
    '10-3': '개천절',
    '10-9': '한글날',
    '12-25': '크리스마스'
};

// 2024년 음력 공휴일
const lunarHolidays2024 = {
    '2-9': '설날',
    '2-10': '설날',
    '2-11': '설날',
    '5-15': '부처님오신날',
    '9-16': '추석',
    '9-17': '추석',
    '9-18': '추석'
};

// 요일 배열
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

// 페이지 로드 시 이벤트 리스너 수정
window.addEventListener('load', () => {
    console.log('Page loaded');
    const today = new Date();
    currentDate = today;
    selectedDateStr = formatDate(today);
    
    // localStorage에서 저장된 데이터 로드
    const storedData = localStorage.getItem('todosByDate');
    if (storedData) {
        console.log('Found stored data:', storedData);
        todosByDate = JSON.parse(storedData);
    }
    
    selectDate(today);
    renderCalendar();
    updateCalendarDots();
    updateStats();
    
    // 엔터키 이벤트 리스너 수정
    document.getElementById('todoInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {  // 입력값이 있을 때만 처리
            e.preventDefault();
            addTodo();
        }
    });
    
    initDragAndDrop();
    cleanupTodos();
});

// 나머지 JavaScript 함수들...
// 원본 JavaScript 코드의 나머지 함수들을 여기에 추가

function isHoliday(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateKey = `${month}-${day}`;
    
    if (holidays[dateKey]) return true;
    if (date.getFullYear() === 2024 && lunarHolidays2024[dateKey]) return true;
    
    return false;
}

function formatDateWithDay(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 요일 계산 수정
    let dayIndex = date.getDay();  // 0(일) ~ 6(토)
    // 월요일부터 시작하는 순서로 변경
    dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;  // 0(월) ~ 6(일)로 변환
    const dayOfWeek = WEEKDAYS[dayIndex];
    
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addTodo() {
    const todoInput = document.getElementById('todoInput');
    const todoText = todoInput.value.trim();
    
    if (todoText) {
        const todoList = document.getElementById('todoList');
        const li = document.createElement('li');
        li.draggable = true;
        
        li.innerHTML = `
            <div class="todo-item">
                <div class="todo-content">
                    <span class="smile-icon"></span>
                    <span class="todo-text">${todoText}</span>
                </div>
                <div class="todo-actions">
                    <button class="icon-btn complete-btn" onclick="toggleComplete(this)" title="완료">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="icon-btn edit-btn" onclick="editTodo(this)" title="변경">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn cancel-btn" onclick="toggleCancel(this)" title="취소">
                        <i class="fas fa-ban"></i>
                    </button>
                    <button class="icon-btn delete-btn" onclick="deleteTodo(this)" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        todoList.appendChild(li);
        todoInput.value = '';
        saveTodos();
        updateStats();
    } else {
        alert('할 일을 입력해주세요.');
        todoInput.focus();
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('monthDisplay').textContent = 
        `${year}년 ${month + 1}월`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 월요일을 1, 일요일을 7로 변환
    let startingDay = firstDay.getDay();
    startingDay = startingDay === 0 ? 6 : startingDay - 1;
    
    const totalDays = lastDay.getDate();
    const prevLastDay = new Date(year, month, 0);
    const prevLastDate = prevLastDay.getDate();
    
    const calendarBody = document.getElementById('calendarBody');
    calendarBody.innerHTML = '';
    
    let date = 1;
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');
        
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            
            if (i === 0 && j < startingDay) {
                // 이전 달 날짜
                const prevDate = prevLastDate - startingDay + j + 1;
                cell.textContent = prevDate;
                cell.classList.add('other-month');
                
                const prevMonth = month === 0 ? 11 : month - 1;
                const prevYear = month === 0 ? year - 1 : year;
                const clickDate = new Date(prevYear, prevMonth, prevDate);
                
                cell.addEventListener('click', () => {
                    currentDate = new Date(prevYear, prevMonth, 1);
                    selectDate(clickDate);
                    renderCalendar();
                });
                
            } else if (date > totalDays) {
                // 다음 달 날짜
                const nextDate = date - totalDays;
                cell.textContent = nextDate;
                cell.classList.add('other-month');
                
                const nextMonth = month === 11 ? 0 : month + 1;
                const nextYear = month === 11 ? year + 1 : year;
                const clickDate = new Date(nextYear, nextMonth, nextDate);
                
                cell.addEventListener('click', () => {
                    currentDate = new Date(nextYear, nextMonth, 1);
                    selectDate(clickDate);
                    renderCalendar();
                });
                
                date++;
            } else {
                // 현재 달 날짜
                cell.textContent = date;
                const clickDate = new Date(year, month, date);
                
                if (isHoliday(clickDate)) {
                    cell.classList.add('holiday');
                }
                
                cell.addEventListener('click', () => {
                    selectDate(clickDate);
                });
                
                if (date === today.getDate() && 
                    month === today.getMonth() && 
                    year === today.getFullYear()) {
                    cell.classList.add('today');
                }
                
                if (date === new Date(selectedDateStr).getDate() && 
                    month === new Date(selectedDateStr).getMonth() && 
                    year === new Date(selectedDateStr).getFullYear()) {
                    cell.classList.add('selected');
                }
                
                date++;
            }
            
            row.appendChild(cell);
        }
        
        calendarBody.appendChild(row);
        if (date > totalDays && i !== 0) break;
    }
    
    updateCalendarDots();
}

function selectDate(date) {
    const dateStr = formatDate(date);
    selectedDateStr = dateStr;
    
    document.getElementById('selectedDate').textContent = formatDateWithDay(date);
    
    // 날짜 선택 시 해당 날짜의 할 일 목록 로드
    loadTodos(dateStr);
    renderCalendar();
    updateWeeklyView(date);
    updateStats();  // 날짜 변경 시 통계 업데이트
}

function loadTodos(dateStr) {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    
    if (todosByDate[dateStr]) {
        todosByDate[dateStr].forEach(todoHTML => {
            const li = document.createElement('li');
            li.draggable = true; // 드래그 가능하도록 설정
            li.innerHTML = todoHTML;
            todoList.appendChild(li);
        });
    }
    
    checkAllTodosComplete();
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    updateCalendarDots();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    updateCalendarDots();
}

function updateCalendarDots() {
    const cells = document.querySelectorAll('.calendar td');
    cells.forEach(cell => {
        cell.classList.remove('has-todos');
        
        if (cell.textContent) {
            const date = new Date(currentDate.getFullYear(), 
                               currentDate.getMonth(), 
                               parseInt(cell.textContent));
            const dateStr = formatDate(date);
            
            if (todosByDate[dateStr] && todosByDate[dateStr].length > 0) {
                cell.classList.add('has-todos');
            }
        }
    });
}

function saveTodos() {
    const todoList = document.getElementById('todoList');
    const todos = Array.from(todoList.children).map(li => li.innerHTML);
    
    // 현재 선택된 날짜의 할 일 목록 저장
    todosByDate[selectedDateStr] = todos;
    
    // localStorage에 전체 데이터 저장
    localStorage.setItem('todosByDate', JSON.stringify(todosByDate));
    
    // UI 업데이트
    updateCalendarDots();
    updateWeeklyView(new Date(selectedDateStr));
    updateStats();  // 통계 업데이트
}

function toggleComplete(button) {
    const todoItem = button.closest('.todo-item');
    const smileIcon = todoItem.querySelector('.smile-icon');
    const icon = button.querySelector('i');
    
    // 완료 상태 토글
    if (smileIcon.textContent === '') {
        // 완료 상태로 변경
        smileIcon.textContent = '😊';
        icon.classList.remove('fa-check-circle');
        icon.classList.add('fa-times-circle');
        button.title = '완료취소';
        
        // 경험치 추가
        characterSystem.addExp(10);
        characterSystem.showPraise('잘했어! 계속 힘내자! 💪');
    } else {
        // 미완료 상태로 변경
        smileIcon.textContent = '';
        icon.classList.remove('fa-times-circle');
        icon.classList.add('fa-check-circle');
        button.title = '완료';
        
        // 경험치 차감
        characterSystem.removeExp(10);
    }
    
    // 변경사항 저장 및 UI 업데이트
    saveTodos();
    checkAllTodosComplete();
    updateCalendarDots();
    updateWeeklyView(new Date(selectedDateStr));
    updateStats();
}

function editTodo(button) {
    const todoItem = button.closest('.todo-item');
    const todoText = todoItem.querySelector('.todo-text');
    const icon = button.querySelector('i');
    
    if (!todoItem.classList.contains('edit-mode')) {
        todoItem.classList.add('edit-mode');
        const currentText = todoText.textContent;
        todoText.innerHTML = `<input type="text" class="edit-input" value="${currentText}" 
            onkeypress="if(event.keyCode==13) { saveTodoEdit(this); return false; }">`;
        icon.classList.remove('fa-edit');
        icon.classList.add('fa-times');
        button.title = '취소';
        
        const input = todoText.querySelector('.edit-input');
        input.focus();
        input.selectionStart = input.value.length;
    } else {
        cancelEdit(todoItem);
    }
}

function saveTodoEdit(input) {
    const todoItem = input.closest('.todo-item');
    const todoText = todoItem.querySelector('.todo-text');
    const editButton = todoItem.querySelector('.edit-btn');
    const icon = editButton.querySelector('i');
    
    const newText = input.value.trim();
    if (newText) {
        todoText.textContent = newText;
        todoItem.classList.remove('edit-mode');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-edit');
        editButton.title = '변경';
        saveTodos();
        updateStats();
    }
}

function cancelEdit(todoItem) {
    const todoText = todoItem.querySelector('.todo-text');
    const editButton = todoItem.querySelector('.edit-btn');
    const icon = editButton.querySelector('i');
    const input = todoItem.querySelector('.edit-input');
    
    todoText.textContent = input.defaultValue;
    todoItem.classList.remove('edit-mode');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-edit');
    editButton.title = '변경';
}

function toggleCancel(button) {
    const todoItem = button.closest('.todo-item');
    const todoText = todoItem.querySelector('.todo-text');
    const icon = button.querySelector('i');
    
    if (icon.classList.contains('fa-ban')) {
        todoText.classList.add('canceled-text');
        icon.classList.remove('fa-ban');
        icon.classList.add('fa-undo');
        button.title = '취소해제';
    } else {
        todoText.classList.remove('canceled-text');
        icon.classList.remove('fa-undo');
        icon.classList.add('fa-ban');
        button.title = '취소';
    }
    
    saveTodos();
    updateStats();
}

function deleteTodo(button) {
    const li = button.closest('li');
    li.remove();
    saveTodos();
    checkAllTodosComplete();
    updateStats();
}

function checkAllTodosComplete() {
    const todoItems = document.querySelectorAll('.todo-item');
    const todayCell = document.querySelector('.today');
    const today = formatDate(new Date());  // 오늘 날짜 문자열
    
    if (!todoItems.length) return;
    
    // 오늘 날짜의 할 일만 크
    if (selectedDateStr === today) {
        const allComplete = Array.from(todoItems).every(item => 
            item.querySelector('.smile-icon').textContent === '😊'
        );
        
        if (todayCell) {
            let smileIcon = todayCell.querySelector('.calendar-smile');
            if (allComplete) {
                if (!smileIcon) {
                    smileIcon = document.createElement('span');
                    smileIcon.className = 'calendar-smile';
                    smileIcon.textContent = '😊';
                    todayCell.appendChild(smileIcon);
                }
            } else {
                if (smileIcon) {
                    smileIcon.remove();
                }
            }
        }
    }
}

function updateWeeklyView(selectedDate) {
    const weeklyTodos = document.getElementById('weeklyTodos');
    const row = document.createElement('tr');
    
    const monday = new Date(selectedDate);
    const day = selectedDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    
    const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const dateStr = formatDate(currentDate);
        
        const cell = document.createElement('td');
        // 오늘 날짜 강조 표시 제거
        // if (formatDate(selectedDate) === dateStr) {
        //     cell.classList.add('today-cell');
        // }
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'weekly-date';
        dateDiv.textContent = `${currentDate.getDate()}일(${weekdays[i]})`;
        cell.appendChild(dateDiv);
        
        const todoList = document.createElement('ul');
        todoList.className = 'weekly-todos';
        
        if (todosByDate[dateStr]) {
            todosByDate[dateStr].forEach(todoHTML => {
                const li = document.createElement('li');
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = todoHTML;
                
                const smileIcon = tempDiv.querySelector('.smile-icon');
                const isCompleted = smileIcon && smileIcon.textContent === '😊';
                
                // 체크박스 추가
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'weekly-checkbox';
                checkbox.checked = isCompleted;
                checkbox.disabled = true; // 읽기 전용
                
                const todoText = tempDiv.querySelector('.todo-text').textContent;
                const isCanceled = tempDiv.querySelector('.todo-text').classList.contains('canceled-text');
                
                if (isCanceled) {
                    li.style.textDecoration = 'line-through';
                    li.style.color = '#888';
                }
                
                li.appendChild(checkbox);
                if (isCompleted) {
                    const weeklySmile = document.createElement('span');
                    weeklySmile.className = 'weekly-smile-icon';
                    weeklySmile.textContent = '😊';
                    li.appendChild(weeklySmile);
                }
                li.appendChild(document.createTextNode(todoText));
                
                todoList.appendChild(li);
            });
        }
        
        cell.appendChild(todoList);
        row.appendChild(cell);
    }
    
    weeklyTodos.innerHTML = '';
    weeklyTodos.appendChild(row);
}

function updateStats() {
    const statsContent = document.getElementById('statsContent');
    const today = new Date();
    const todayStr = formatDate(today);

    // 통계 초기화
    let stats = {
        total: 0,
        completed: 0,
        daily: {
            total: 0,
            completed: 0
        },
        weekly: {
            total: 0,
            completed: 0
        },
        lastWeek: {  // 지난주 통계 가
            total: 0,
            completed: 0
        },
        monthly: {
            total: 0,
            completed: 0
        }
    };

    // 모든 할 일 순회하며 통계 계산
    Object.entries(todosByDate).forEach(([dateStr, todos]) => {
        if (!todos || !Array.isArray(todos)) return;

        const date = new Date(dateStr);
        const completedTodos = todos.filter(todo => todo.includes('😊'));

        // 전체 통계
        stats.total += todos.length;
        stats.completed += completedTodos.length;

        // 오늘의 할 일
        if (dateStr === todayStr) {
            stats.daily.total = todos.length;
            stats.daily.completed = completedTodos.length;
        }

        // 이번 주 할 일
        if (isSameWeek(date, today)) {
            stats.weekly.total += todos.length;
            stats.weekly.completed += completedTodos.length;
        }

        // 지난주 할 일
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        if (isSameWeek(date, lastWeek)) {
            stats.lastWeek.total += todos.length;
            stats.lastWeek.completed += completedTodos.length;
        }

        // 이번 달 할 일
        if (date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear()) {
            stats.monthly.total += todos.length;
            stats.monthly.completed += completedTodos.length;
        }
    });

    // 통계 표시
    statsContent.innerHTML = `
        <div class="stat-item">
            <h3>전체 완료율</h3>
            <p>${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${stats.total ? (stats.completed / stats.total * 100) : 0}%"></div>
            </div>
        </div>
        <div class="stat-item">
            <h3>오늘의 달성</h3>
            <p>${stats.daily.completed}/${stats.daily.total}</p>
            <div class="achievement">
                <span class="achievement-icon">
                    ${stats.daily.completed >= stats.daily.total ? '🌟' : '🎯'}
                </span>
                <span>오늘의 목표</span>
            </div>
        </div>
        <div class="stat-item">
            <h3>이번 주 달성</h3>
            <p>${stats.weekly.completed}/${stats.weekly.total}</p>
            <div class="achievement">
                <span class="achievement-icon">
                    ${stats.weekly.completed >= stats.weekly.total ? '🏆' : '🎯'}
                </span>
                <span>주간 목표</span>
            </div>
        </div>
        <div class="stat-item">
            <h3>지난주 달성</h3>
            <p>${stats.lastWeek.completed}/${stats.lastWeek.total}</p>
            <div class="achievement">
                <span class="achievement-icon">
                    ${stats.lastWeek.completed >= stats.lastWeek.total ? '🏆' : '🎯'}
                </span>
                <span>지난주 목표</span>
            </div>
        </div>
        <div class="stat-item">
            <h3>이번 달 달성</h3>
            <p>${stats.monthly.completed}/${stats.monthly.total}</p>
            <div class="achievement">
                <span class="achievement-icon">
                    ${stats.monthly.completed >= stats.monthly.total ? '👑' : '🎯'}
                </span>
                <span>월간 목표</span>
            </div>
        </div>
    `;
}

// 같은 주인지 확인하는 헬퍼 함수
function isSameWeek(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // 월요일을 기준으로 주의 시일 구하기
    const day1 = d1.getDay();
    const day2 = d2.getDay();
    
    const monday1 = new Date(d1.setDate(d1.getDate() - (day1 === 0 ? 6 : day1 - 1)));
    const monday2 = new Date(d2.setDate(d2.getDate() - (day2 === 0 ? 6 : day2 - 1)));
    
    return monday1.toDateString() === monday2.toDateString();
}

// 통계 토글 함수
function toggleStats() {
    const statsContent = document.getElementById('statsContent');
    statsContent.style.display = statsContent.style.display === 'none' ? 'grid' : 'none';
}

function resetAllTodos() {
    // localStorage 초기화
    localStorage.removeItem('todosByDate');
    todosByDate = {};
    
    // UI 초기화
    document.getElementById('todoList').innerHTML = '';
    
    // 캘린 및 통계 업이트
    renderCalendar();
    updateCalendarDots();
    updateWeeklyView(new Date(selectedDateStr));
    updateStats();
}

function showGoalSettings() {
    const modal = document.getElementById('goalSettingsModal');
    document.getElementById('dailyGoal').value = goals.daily.count;
    document.getElementById('weeklyGoal').value = goals.weekly.count;
    document.getElementById('monthlyGoal').value = goals.monthly.count;
    modal.style.display = 'block';
}

function closeGoalSettings() {
    document.getElementById('goalSettingsModal').style.display = 'none';
}

function saveGoals() {
    goals = {
        daily: { 
            count: parseInt(document.getElementById('dailyGoal').value), 
            reward: '🌟' 
        },
        weekly: { 
            count: parseInt(document.getElementById('weeklyGoal').value), 
            reward: '🏆' 
        },
        monthly: { 
            count: parseInt(document.getElementById('monthlyGoal').value), 
            reward: '👑' 
        }
    };
    
    // 목표 저장
    localStorage.setItem('goals', JSON.stringify(goals));
    
    // UI 업데이트
    updateStats();
    closeGoalSettings();
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('goalSettingsModal');
    if (event.target === modal) {
        closeGoalSettings();
    }
}

function printWeeklyTodos() {
    const printWindow = window.open('', '_blank');
    const today = new Date(selectedDateStr);
    const monday = new Date(today);
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);

    // 인쇄할 HTML 내용 생성
    printWindow.document.write(`
        <html>
        <head>
            <title>주간 할 일 목록</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 1.5cm;
                }
                
                body {
                    font-family: 'Noto Sans KR', sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #333;
                    position: relative;
                }
                
                body::after {
                    content: '';
                    position: fixed;
                    bottom: 50px;
                    right: 50px;
                    width: 300px;
                    height: 300px;
                    background: url('./images/brawl.svg') no-repeat center center;
                    background-size: contain;
                    opacity: 0.1;
                    z-index: -1;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding: 20px 0;
                    border-bottom: 2px solid #333;
                }
                
                .print-header h2 {
                    margin: 0;
                    font-size: 24px;
                    color: #1a73e8;
                }
                
                .weekly-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .weekly-table td {
                    border: 1px solid #666;
                    padding: 10px;
                    vertical-align: top;
                    height: 120px;
                    width: 14.28%;
                }
                
                .weekly-date {
                    font-weight: bold;
                    padding: 8px;
                    margin: -10px -10px 10px -10px;
                    background-color: #f8f9fa;
                    border-bottom: 1px solid #666;
                    text-align: center;
                    font-size: 14px;
                }
                
                /* 요일별 색상 */
                .weekly-date.sat {
                    color: #035efc;
                }
                
                .weekly-date.sun {
                    color: #fc5603;
                }
                
                .weekly-todos {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .weekly-todos li {
                    margin: 8px 0;
                    padding: 5px;
                    border-bottom: 1px dashed #ddd;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .weekly-checkbox {
                    margin-right: 5px;
                }
                
                .completed-todo {
                    text-decoration: line-through;
                    color: #888;
                }
                
                .footer {
                    position: fixed;
                    bottom: 20px;
                    width: 100%;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h2>${monday.getFullYear()}년 ${monday.getMonth() + 1}월 주간 할 일 목록</h2>
                <p style="margin: 10px 0 0 0; color: #666;">
                    ${formatDate(monday)} ~ ${formatDate(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000))}
                </p>
            </div>
            ${document.querySelector('.weekly-table').outerHTML}
            <div class="footer">
                ${new Date().toLocaleDateString()} 출력
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    
    // 폰트와 이미지 로딩을 위한 시간 지연
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 500);
}

function initDragAndDrop() {
    const todoList = document.getElementById('todoList');
    
    // 드래그 시작
    todoList.addEventListener('dragstart', (e) => {
        const dragItem = e.target.closest('li');
        if (!dragItem) return;
        
        dragItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    // 드래그 종료
    todoList.addEventListener('dragend', (e) => {
        const dragItem = e.target.closest('li');
        if (!dragItem) return;
        
        dragItem.classList.remove('dragging');
        saveTodos(); // 순서 변경 후 저장
        updateWeeklyView(new Date(selectedDateStr)); // 주간 뷰 업데이트
    });
    
    // 드래그 오버
    todoList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragItem = document.querySelector('.dragging');
        if (!dragItem) return;
        
        const list = todoList;
        const afterElement = getDragAfterElement(list, e.clientY);
        
        if (afterElement) {
            list.insertBefore(dragItem, afterElement);
        } else {
            list.appendChild(dragItem);
        }
    });
}

// 드래그 위 계산
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 기존 할 일에서 카테고리 제거
function cleanupTodos() {
    Object.keys(todosByDate).forEach(dateStr => {
        if (todosByDate[dateStr]) {
            todosByDate[dateStr] = todosByDate[dateStr].map(todoHTML => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = todoHTML;
                
                // 카테고리 태그 제거
                const categorySpan = tempDiv.querySelector('.todo-category');
                if (categorySpan) {
                    categorySpan.remove();
                }
                
                return tempDiv.innerHTML;
            });
        }
    });
    
    // 저장 및 업데이트
    localStorage.setItem('todosByDate', JSON.stringify(todosByDate));
    loadTodos(selectedDateStr);
    updateWeeklyView(new Date(selectedDateStr));
    updateStats();
}

/* 나머지 모든 함수들... */
/* 원본 파일 모든 JavaScript 함수를 여기에 추가 */

// 할 일 데이터 구조 개선
const Todo = {
    id: String,           // 고유 ID
    text: String,         // 할 일 내용
    date: String,         // 날짜
    completed: Boolean,   // 완료 
    canceled: Boolean,    // 취소 여부
    createdAt: Date,      // 생성일시
    updatedAt: Date       // 수정일시
};

// 데이터 저장소 클래스
class TodoStorage {
    constructor() {
        this.todos = new Map();
    }

    // 할 일 추가
    addTodo(todo) {
        const todoObj = {
            id: crypto.randomUUID(),
            text: todo,
            date: selectedDateStr,
            completed: false,
            canceled: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        if (!this.todos.has(selectedDateStr)) {
            this.todos.set(selectedDateStr, []);
        }
        this.todos.get(selectedDateStr).push(todoObj);
        this.save();
        
        return todoObj;
    }

    // 할 일 수정
    updateTodo(id, updates) {
        for (let [date, todos] of this.todos) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                Object.assign(todo, updates, { updatedAt: new Date() });
                this.save();
                return todo;
            }
        }
        return null;
    }

    // 할 일 삭제
    deleteTodo(id) {
        for (let [date, todos] of this.todos) {
            const index = todos.findIndex(t => t.id === id);
            if (index !== -1) {
                todos.splice(index, 1);
                this.save();
                return true;
            }
        }
        return false;
    }

    // 날짜별 할 일 조회
    getTodosByDate(date) {
        return this.todos.get(date) || [];
    }

    // localStorage에 저장
    save() {
        const data = JSON.stringify(Array.from(this.todos.entries()));
        localStorage.setItem('todos', data);
    }

    // localStorage에서 로드
    load() {
        const data = localStorage.getItem('todos');
        if (data) {
            this.todos = new Map(JSON.parse(data));
        }
    }
}

// 할 일 렌더링 함수 개선
function renderTodo(todo) {
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = todo.id;
    
    li.innerHTML = `
        <div class="todo-item">
            <div class="todo-content">
                <span class="smile-icon">${todo.completed ? '😊' : ''}</span>
                <span class="todo-text ${todo.canceled ? 'canceled-text' : ''}">${todo.text}</span>
            </div>
            <div class="todo-actions">
                <button class="icon-btn complete-btn" onclick="toggleComplete('${todo.id}')" title="${todo.completed ? '완료취소' : '완료'}">
                    <i class="fas ${todo.completed ? 'fa-times-circle' : 'fa-check-circle'}"></i>
                </button>
                <button class="icon-btn edit-btn" onclick="editTodo('${todo.id}')" title="변경">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn cancel-btn" onclick="toggleCancel('${todo.id}')" title="${todo.canceled ? '취소해제' : '취소'}">
                    <i class="fas ${todo.canceled ? 'fa-undo' : 'fa-ban'}"></i>
                </button>
                <button class="icon-btn delete-btn" onclick="deleteTodo('${todo.id}')" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return li;
}

class CharacterSystem {
    constructor() {
        this.level = 1;
        this.exp = 0;
        this.maxExp = 100;
        this.character = '🤖';
        
        // 레벨별 캐릭터와 칭찬 메시지
        this.characters = {
            1: { emoji: '🤖', message: '시작이 반이야! 잘 할 수 있어!' },
            5: { emoji: '🦸‍♂️', message: '와! 영웅이 되었어!' },
            10: { emoji: '🧙‍♂️', message: '대단해! 마법사가 되었어!' },
            15: { emoji: '🦁', message: '용감한 사자가 되었구나!' },
            20: { emoji: '🐉', message: '전설의 드래곤이 되었어!' }
        };
        
        this.loadProgress();
        this.updateDisplay();
    }

    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.maxExp) {
            this.levelUp();
        }
        this.saveProgress();
        this.updateDisplay();
    }

    levelUp() {
        this.level++;
        this.exp = 0;
        this.maxExp = this.level * 100;
        
        // 레벨업 효과
        this.showLevelUpAnimation();
        this.showPraise(this.characters[this.level]?.message || '레벨업! 정말 대단해! 🎉');
        
        // 캐릭터 변경 체크
        if (this.characters[this.level]) {
            this.character = this.characters[this.level].emoji;
        }
    }

    showPraise(message) {
        const praiseEl = document.getElementById('praiseMessage');
        praiseEl.textContent = message;
        praiseEl.classList.add('show');
        
        setTimeout(() => {
            praiseEl.classList.remove('show');
        }, 3000);
    }

    showLevelUpAnimation() {
        const characterEl = document.getElementById('characterEmoji');
        characterEl.classList.add('level-up');
        setTimeout(() => {
            characterEl.classList.remove('level-up');
        }, 500);
    }

    updateDisplay() {
        document.getElementById('characterEmoji').textContent = this.character;
        document.getElementById('characterLevel').textContent = this.level;
        document.getElementById('currentExp').textContent = this.exp;
        document.getElementById('maxExp').textContent = this.maxExp;
        document.getElementById('expProgress').style.width = `${(this.exp / this.maxExp) * 100}%`;
    }

    saveProgress() {
        localStorage.setItem('character', JSON.stringify({
            level: this.level,
            exp: this.exp,
            character: this.character
        }));
    }

    loadProgress() {
        const saved = localStorage.getItem('character');
        if (saved) {
            const data = JSON.parse(saved);
            this.level = data.level;
            this.exp = data.exp;
            this.character = data.character;
            this.maxExp = this.level * 100;
        }
    }

    removeExp(amount) {
        this.exp -= amount;
        if (this.exp < 0) {
            // 현재 레벨이 1보다 크면 이전 레벨로 돌아감
            if (this.level > 1) {
                this.level--;
                this.maxExp = this.level * 100;
                this.exp = this.maxExp + this.exp; // 음수인 exp를 이전 레벨의 경험치에서 차감
            } else {
                this.exp = 0; // 레벨 1에서는 0 미만으로 내려가지 않음
            }
        }
        this.saveProgress();
        this.updateDisplay();
    }
}

// 전역 캐릭터 시스템 인스턴스 생성
const characterSystem = new CharacterSystem();