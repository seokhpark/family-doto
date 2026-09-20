const members = ['재준','세인','엄마','아빠'];
// Firebase 웹 설정값은 비밀 키가 아니며, 이 가족 앱의 공유 Firestore에 연결할 때 사용합니다.
const firebaseConfig = {
  apiKey: 'AIzaSyCIhIyuL0Skd9-h8j9e9ZbB7cI3gjkHFAT4',
  authDomain: 'family-to-do-a5f6a.firebaseapp.com',
  projectId: 'family-to-do-a5f6a',
  storageBucket: 'family-to-do-a5f6a.firebasestorage.app',
  messagingSenderId: '576401971676',
  appId: '1:576401971676:web:3b21fb79c296cf1de89719'
};
const holidays2026 = {
  '2026-01-01': '신정',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-03-02': '삼일절 대체공휴일',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '부처님오신날 대체공휴일',
  '2026-06-03': '전국동시지방선거',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '광복절 대체공휴일',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-05': '개천절 대체공휴일',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절'
};
function holidayName(date) { return holidays2026[iso(date)] || ''; }
let activeMember = '재준';
let activeView = 'day';
let cursor = new Date();
let followsToday = true;
const seed = [
  {id:1,member:'엄마',text:'마트에서 장보기',date:'2026-09-09',done:false},
  {id:2,member:'엄마',text:'세탁기 돌리기',date:'2026-09-09',done:false},
  {id:3,member:'엄마',text:'저녁 메뉴 정하기',date:'2026-09-09',done:true},
  {id:4,member:'엄마',text:'화분 물 주기',date:'2026-09-11',done:false},
  {id:5,member:'아빠',text:'분리수거 하기',date:'2026-09-09',done:false},
  {id:6,member:'재준',text:'영어 숙제 하기',date:'2026-09-10',done:false},
  {id:7,member:'세인',text:'책 20분 읽기',date:'2026-09-09',done:false},
];
let todos = JSON.parse(localStorage.getItem('family-todos') || 'null') || seed;
let firestore = null;
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const koreanDate = d => `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${['일','월','화','수','목','금','토'][d.getDay()]}요일`;
function save(todo){
  localStorage.setItem('family-todos', JSON.stringify(todos));
  if (firestore && todo) firestore.setDoc(firestore.doc(firestore.db, 'todos', String(todo.id)), todo).catch(reportSyncError);
}

function reportSyncError(error){
  console.error('Firebase 동기화 오류:', error);
}

async function enableSharedTodos(){
  try {
    const [appModule, firestoreModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js')
    ]);
    const db = firestoreModule.getFirestore(appModule.initializeApp(firebaseConfig));
    firestore = { db, ...firestoreModule };
    const setupDoc = firestoreModule.doc(db, 'meta', 'family-todo');

    // 처음 접속한 기기의 기존 목록을 한 번만 공용 목록으로 옮깁니다.
    await firestoreModule.runTransaction(db, async transaction => {
      const setup = await transaction.get(setupDoc);
      if (setup.exists()) return;
      todos.forEach(todo => transaction.set(firestoreModule.doc(db, 'todos', String(todo.id)), todo));
      transaction.set(setupDoc, { initializedAt: firestoreModule.serverTimestamp() });
    });

    firestoreModule.onSnapshot(firestoreModule.collection(db, 'todos'), snapshot => {
      todos = snapshot.docs.map(item => item.data());
      localStorage.setItem('family-todos', JSON.stringify(todos));
      render();
    }, reportSyncError);
  } catch (error) {
    reportSyncError(error);
  }
}
function startOfWeek(d){const copy=new Date(d);copy.setDate(copy.getDate()-copy.getDay());return copy}
function isSameDay(a,b){return iso(a)===iso(b)}
function title(){ return activeView==='day' ? '오늘의 할 일' : activeView==='week' ? '이번 주 할 일' : '이번 달 할 일'; }
function inRange(todo){const date=new Date(todo.date+'T00:00:00'); if(activeView==='day')return isSameDay(date,cursor); if(activeView==='week'){const start=startOfWeek(cursor),end=new Date(start);end.setDate(end.getDate()+6);return date>=start&&date<=end} return date.getFullYear()===cursor.getFullYear()&&date.getMonth()===cursor.getMonth()}
function renderCalendar(){const calendar=$('#calendar');if(activeView==='day'){calendar.innerHTML=`<div class="day-card"><div class="day-left"><span class="date-badge">${cursor.getDate()}</span><div><b>${koreanDate(cursor)}</b><p>오늘의 계획을 차근차근 해봐요.</p></div></div><span>🌿</span></div>`;return}
 const weekdays=['일','월','화','수','목','금','토'];let dates=[];if(activeView==='week'){const start=startOfWeek(cursor);dates=Array.from({length:7},(_,i)=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+i));}else{const first=new Date(cursor.getFullYear(),cursor.getMonth(),1);const start=startOfWeek(first);dates=Array.from({length:42},(_,i)=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+i));}
 calendar.className=activeView==='week'?'calendar week-grid':'calendar month-grid';calendar.innerHTML=dates.map((d,i)=>{const dow=d.getDay(),has=todos.some(t=>t.member===activeMember&&t.date===iso(d)&&!t.done);const holiday=dow===0?'일요일':(d.getMonth()===8&&d.getDate()===28?'추석':'');return `<div class="week-day ${isSameDay(d,cursor)?'selected':''}"><div class="weekday ${dow===0?'sunday':dow===6?'saturday':''}">${activeView==='week'?weekdays[dow]:i<7?weekdays[dow]:''}</div><div class="date-num ${dow===0?'sunday':dow===6?'saturday':''}" style="${activeView==='month'&&d.getMonth()!==cursor.getMonth()?'opacity:.3':''}">${d.getDate()}</div>${holiday?`<div class="holiday">${holiday}</div>`:''}${has?'<div class="event-dot"></div>':''}</div>`}).join('');}
function renderTodos(){const filtered=todos.filter(t=>t.member===activeMember&&inRange(t)).sort((a,b)=>a.done-b.done||a.date.localeCompare(b.date));const left=filtered.filter(t=>!t.done).length;$('#todoList').innerHTML=filtered.length?filtered.map(t=>`<div class="todo-item ${t.done?'completed':''}"><input type="checkbox" data-id="${t.id}" ${t.done?'checked':''} aria-label="완료"><span class="todo-text">${escapeHtml(t.text)}</span><span class="todo-date">${t.date.slice(5).replace('-','.')}</span><button class="todo-delete" type="button" data-delete-id="${t.id}" aria-label="할 일 삭제">×</button></div>`).join(''):'<div class="empty">이 기간에 등록된 할 일이 없어요. ✦</div>';$('#todoHeading').textContent=title();$('#todoSummary').textContent=`${left}개 남음`;members.forEach(m=>document.querySelector(`.member[data-member="${m}"] .count`).textContent=todos.filter(t=>t.member===m&&!t.done).length)}
function escapeHtml(text){return text.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function render(){ $('#memberName').textContent=activeMember;$('#dateLabel').textContent=koreanDate(cursor);renderCalendar();renderTodos(); }
document.querySelectorAll('.member').forEach(btn=>btn.onclick=()=>{activeMember=btn.dataset.member;document.querySelectorAll('.member').forEach(b=>b.classList.toggle('active',b===btn));render()});
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{activeView=btn.dataset.view;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===btn));render()});
$('#todoList').addEventListener('change',e=>{if(!e.target.matches('input'))return;const item=todos.find(t=>t.id===Number(e.target.dataset.id));item.done=e.target.checked;save(item);render()});
$('#todoList').addEventListener('click',e=>{const button=e.target.closest('button[data-delete-id]');if(!button)return;if(!confirm('이 할 일을 삭제할까요?'))return;const id=Number(button.dataset.deleteId);todos=todos.filter(t=>t.id!==id);localStorage.setItem('family-todos', JSON.stringify(todos));if(firestore)firestore.deleteDoc(firestore.doc(firestore.db,'todos',String(id))).catch(reportSyncError);render()});
$('#quickAddForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#quickTodoText');const text=input.value.trim();if(!text)return;const todo={id:Date.now(),member:activeMember,text,date:iso(cursor),done:false};todos.push(todo);save(todo);input.value='';render();input.focus()});
function shift(amount){followsToday=false;if(activeView==='day')cursor.setDate(cursor.getDate()+amount);else if(activeView==='week')cursor.setDate(cursor.getDate()+amount*7);else cursor.setMonth(cursor.getMonth()+amount);render()}
$('#prevDate').onclick=()=>shift(-1);$('#nextDate').onclick=()=>shift(1);$('#todayButton').onclick=()=>{cursor=new Date();followsToday=true;render()};

function scheduleMidnightRefresh(){
  const now=new Date();
  const nextMidnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  setTimeout(()=>{
    if(followsToday){cursor=new Date();render()}
    scheduleMidnightRefresh();
  },nextMidnight-now+1000);
}

scheduleMidnightRefresh();
render();
enableSharedTodos();
