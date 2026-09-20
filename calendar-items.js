function calendarTodoMarkup(todo) {
  return `<label class="calendar-todo ${todo.done ? 'completed' : ''}"><input type="checkbox" data-id="${todo.id}" ${todo.done ? 'checked' : ''} aria-label="완료" /><span>${escapeHtml(todo.text)}</span></label>`;
}

function renderCalendar() {
  const calendar = $('#calendar');
  if (activeView === 'day') {
    calendar.className = 'calendar';
    calendar.innerHTML = `<div class="day-card"><div class="day-left"><span class="date-badge">${cursor.getDate()}</span><div><b>${koreanDate(cursor)}</b><p>오늘의 계획을 차근차근 해봐요.</p></div></div><span>🌿</span></div>`;
    return;
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  let dates = [];
  if (activeView === 'week') {
    const start = startOfWeek(cursor);
    dates = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  } else {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    dates = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }

  const gridClass = activeView === 'week' ? 'week-grid' : 'month-grid';
  calendar.className = 'calendar calendar-scroll';
  calendar.innerHTML = `<div class="calendar-scroller" tabindex="0" aria-label="${activeView === 'week' ? '주간' : '월간'} 달력"><div class="calendar-inner"><div class="calendar-weekdays">${weekdays.map((weekday, day) => `<span class="weekday ${day === 0 ? 'sunday' : day === 6 ? 'saturday' : ''}">${weekday}</span>`).join('')}</div><div class="${gridClass}">${dates.map(date => {
    const day = date.getDay();
    const items = todos.filter(todo => todo.member === activeMember && todo.date === iso(date)).sort((a, b) => a.done - b.done);
    const holiday = day === 0 ? '일요일' : (date.getMonth() === 8 && date.getDate() === 28 ? '추석' : '');
    const faded = activeView === 'month' && date.getMonth() !== cursor.getMonth();
    return `<article class="week-day ${isSameDay(date, cursor) ? 'selected' : ''} ${faded ? 'outside-month' : ''}" data-date="${iso(date)}" tabindex="0" role="button" aria-label="${iso(date)} 선택">
      <div class="calendar-date-row"><span class="date-num ${day === 0 ? 'sunday' : day === 6 ? 'saturday' : ''}">${date.getDate()}</span></div>
      ${holiday ? `<span class="holiday">${holiday}</span>` : ''}
      <div class="calendar-todos">${items.map(calendarTodoMarkup).join('')}</div>
    </article>`;
  }).join('')}</div></div></div>`;
}

function render() {
  $('#memberName').textContent = activeMember;
  $('#dateLabel').textContent = koreanDate(cursor);
  renderCalendar();
  renderTodos();
}

$('#calendar').addEventListener('change', event => {
  if (!event.target.matches('input[data-id]')) return;
  const item = todos.find(todo => todo.id === Number(event.target.dataset.id));
  if (!item) return;
  item.done = event.target.checked;
  save(item);
  render();
});

function selectCalendarDate(dateValue) {
  cursor = new Date(`${dateValue}T00:00:00`);
  followsToday = false;
  render();
  const input = $('#quickTodoText');
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => input.focus(), 300);
}

$('#calendar').addEventListener('click', event => {
  if (activeView === 'day' || event.target.closest('input, label')) return;
  const day = event.target.closest('.week-day[data-date]');
  if (day) selectCalendarDate(day.dataset.date);
});

$('#calendar').addEventListener('keydown', event => {
  if ((event.key !== 'Enter' && event.key !== ' ') || activeView === 'day') return;
  const day = event.target.closest('.week-day[data-date]');
  if (!day) return;
  event.preventDefault();
  selectCalendarDate(day.dataset.date);
});

let touchScroller = null;
let touchStartX = 0;
let touchStartScrollLeft = 0;

$('#calendar').addEventListener('touchstart', event => {
  touchScroller = event.target.closest('.calendar-scroller');
  if (!touchScroller) return;
  touchStartX = event.touches[0].clientX;
  touchStartScrollLeft = touchScroller.scrollLeft;
}, { passive: true });

$('#calendar').addEventListener('touchmove', event => {
  if (!touchScroller) return;
  touchScroller.scrollLeft = touchStartScrollLeft + touchStartX - event.touches[0].clientX;
}, { passive: true });

$('#calendar').addEventListener('touchend', () => { touchScroller = null; }, { passive: true });

render();
