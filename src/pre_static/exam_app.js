"use strict";

/* ========== 可调参数 ========== */
const PAGE_SIZE = 3;
const REQ_TIMEOUT_MS = 120000;
/* ============================= */

let questions = [];          // 当前试卷题目（仅开始后拉取）
let papers = [];             // /papers/list_open
let answersState = new Map();
let attempt = null;          // { attempt_id, left_sec, duration_sec }
let currentPage = 1;
let timerHandle = null;
let examStarted = false;

/* ---- DOM ---- */
const api = (p)=>`${location.origin}${p}`;
const sel = (id)=>document.getElementById(id);
const who = sel("who");
const paperSelect = sel("paperSelect");
const btnLoad = sel("btnLoad");
const btnStart = sel("btnStart");
const btnSubmit = sel("btnSubmit");
const btnLogout = sel("btnLogout");
const durationMinInput = sel("durationMin");
const qList = sel("qList");
const pager = sel("pager");
const gradeMsg = sel("gradeMsg");
const exportCard = sel("exportCard");
const btnExportMy = sel("btnExportMy");

function auth(){
  try{ return JSON.parse(localStorage.getItem("exam_auth")||"{}"); }catch{ return {}; }
}
function needStudent(){
  const a = auth();
  if(!a?.token){ location.href="./login.html?fresh=1"; return; }
  const role = String(a?.user?.role || '').toLowerCase();
  if (role==='admin' || role==='teacher') { location.href="./admin.html"; return; }
  who.textContent = `已登录：${a.user.username}（学生端）`;
}
function logout(){
  localStorage.removeItem("exam_auth");
  location.href="./login.html?fresh=1";
}

async function fetchAuthed(url, options={}, timeoutMs=REQ_TIMEOUT_MS){
  options.headers = options.headers || {};
  const a = auth(); if(a?.token) options.headers["Authorization"] = "Bearer " + a.token;
  const ctrl = new AbortController(); const id = setTimeout(()=>ctrl.abort("timeout"), timeoutMs);
  try{ return await fetch(url, { ...options, signal: ctrl.signal }); } finally{ clearTimeout(id); }
}
function escapeHtml(s){return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function ensureEl(id){ let el = document.getElementById(id); if(!el){ el=document.createElement('div'); el.id=id; (document.querySelector('.wrap')||document.body).appendChild(el);} return el; }
async function downloadAuthed(url, filename){
  const r = await fetchAuthed(url, { method:"GET" });
  if(!r.ok) throw new Error(`${r.status}`);
  const blob = await r.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename || "download.bin";
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* 修改密码（可选） */
async function changePassword(){
  const oldp = sel("oldp")?.value, newp = sel("newp")?.value;
  if(!newp) return alert("新密码不可为空");
  const j = await (await fetchAuthed(api("/auth/change_password"), {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({old_password:oldp,new_password:newp})})).json();
  if(j.ok){ alert("修改成功，请重新登录"); logout(); } else alert("失败："+(j.detail||JSON.stringify(j)));
}

/* ---------- 只加载试卷，不加载题目（题目在开始后加载） ---------- */
async function loadPapers(){
  const r = await fetchAuthed(api("/papers/list_open"));
  if(!r.ok){
    paperSelect.innerHTML = "";
    ensureEl("qList").innerHTML = `<div class="muted">加载试卷失败，请稍后重试</div>`;
    return;
  }
  papers = await r.json();
  if(!Array.isArray(papers) || papers.length===0){
    paperSelect.innerHTML = "";
    ensureEl("qList").innerHTML = `<div class="muted">暂无可用试卷，请联系管理员创建并发布试卷。</div>`;
    return;
  }
  paperSelect.innerHTML = papers.map(p=>`<option value="${p.paper_id}">${p.title} (${p.paper_id.slice(0,8)})</option>`).join("");
  // 初始不加载题目
  examStarted = false;
  ensureEl("qList").innerHTML = `<div class="muted">请点击“开始作答”按钮后显示题目</div>`;
  ensureEl("pager").innerHTML = "";
}

function cut(arr,start,count){ return arr.slice(start,start+count); }

function renderQuestions(){
  const qList = ensureEl("qList"); const pager = ensureEl("pager");
  qList.innerHTML=""; pager.innerHTML="";
  if(!examStarted){ qList.innerHTML = `<div class="muted">请点击“开始作答”按钮后显示题目</div>`; return; }
  if(!questions.length){ qList.innerHTML=`<div class="muted">未获取到题目</div>`; return; }

  const pages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  currentPage = Math.max(1, Math.min(currentPage, pages));
  const start = (currentPage-1)*PAGE_SIZE;
  const slice = cut(questions, start, PAGE_SIZE);

  slice.forEach((q, idx)=>{
    const type = (q.qtype || "").toLowerCase()==="multi" ? "multi" : "single";
    const inputType = type==="multi" ? "checkbox":"radio";
    const chosen = answersState.get(q.qid) || new Set();

    const div = document.createElement("div");
    div.className = "q";
    div.innerHTML = `
      <div><b>${start+idx+1}. ${escapeHtml(q.stem)}</b> <span class="pill gray">${type==="multi"?"多选":"单选"}</span></div>
      <div class="opt">
        ${q.options.map(opt=>`
          <label>
            <input data-q="${q.qid}" name="q-${q.qid}" value="${opt.label}" type="${inputType}" ${chosen.has(opt.label)?"checked":""}/>
            ${opt.label}. ${escapeHtml(opt.text)}
          </label>`).join("")}
      </div>`;
    qList.appendChild(div);
  });

  qList.querySelectorAll("input[data-q]").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const qid = inp.dataset.q;
      const q = questions.find(x=>x.qid===qid);
      const type = (q.qtype || "").toLowerCase()==="multi" ? "multi":"single";
      const set = answersState.get(qid) || new Set();
      if(type==="single"){
        answersState.set(qid, new Set(inp.checked ? [inp.value] : []));
        document.querySelectorAll(`input[name="q-${qid}"]`).forEach(o=>{ if(o!==inp) o.checked=false; });
      }else{
        if(inp.checked) set.add(inp.value); else set.delete(inp.value);
        answersState.set(qid, set);
      }
    });
  });

  pager.innerHTML = `
    <button id="prevPage" ${currentPage<=1?"disabled":""}>上一页</button>
    <span class="muted">第 ${currentPage} / ${pages} 页</span>
    <button id="nextPage" ${currentPage>=pages?"disabled":""}>下一页</button>`;
  document.getElementById("prevPage").onclick = ()=>{ currentPage=Math.max(1,currentPage-1); renderQuestions(); };
  document.getElementById("nextPage").onclick = ()=>{ currentPage=Math.min(pages,currentPage+1); renderQuestions(); };
}

function setTimer(sec){
  const m = String(Math.floor(sec/60)).padStart(2,'0'); const s = String(sec%60).padStart(2,'0');
  sel("timer").textContent = sec>0 ? `剩余时间：${m}:${s}` : "未开始";
}

async function startExam(){
  const pid = paperSelect.value;
  if(!pid) return alert("请选择试卷");
  btnStart.disabled = true;
  try{
    const durMin = parseInt(durationMinInput.value||"10",10);
    const j = await (await fetchAuthed(api("/exam/start"), {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({paper_id:pid,duration_sec:durMin*60})
    })).json();
    if(!j.ok) throw new Error(j.detail||"创建会话失败");
    attempt = {attempt_id:j.attempt_id, left_sec:j.left_sec, duration_sec:j.duration_sec};

    // ★ 开始后才拉题目
    const r = await fetchAuthed(api(`/papers/view?paper_id=${encodeURIComponent(pid)}`));
    if(!r.ok) throw new Error("拉取题目失败");
    const view = await r.json();
    questions = Array.isArray(view.items) ? view.items : [];
    answersState = new Map(questions.map(q=>[q.qid,new Set()]));
    examStarted = true;
    currentPage = 1;
    renderQuestions();

    // 倒计时
    setTimer(attempt.left_sec);
    if(timerHandle) clearInterval(timerHandle);
    timerHandle = setInterval(async ()=>{
      attempt.left_sec -= 1;
      if(attempt.left_sec<=0){
        setTimer(0); clearInterval(timerHandle);
        if(!btnSubmit.disabled){ alert("时间到，自动提交"); await submitExam(true); }
      }else setTimer(attempt.left_sec);
    },1000);

    // 锁定控件
    paperSelect.disabled = true;
    btnLoad.disabled = true;
    durationMinInput.disabled = true;
    btnSubmit.disabled = false;
    gradeMsg.textContent = "已开始作答";
  }catch(e){
    alert("开始失败："+e); btnStart.disabled = false;
  }
}

function collectAnswers(){
  const out=[];
  for(const q of questions){
    const set = answersState.get(q.qid)||new Set();
    const arr = Array.from(set);
    // ⚠️ 与后端保持一致：chosen_labels
    if(arr.length>0) out.push({ qid:q.qid, chosen_labels: arr });
  }
  return out;
}

function renderGrade(report){
  const items = Array.isArray(report?.items) ? report.items : [];
  const n = items.length || 0;
  const maxScore = Math.max(1, n);
  const total = Number(report?.total_score || 0);
  const pct = Math.max(0, Math.min(100, Math.round((total / maxScore) * 100)));
  const cells = items.map((it, i) => {
    const idx = i+1; const score = Number(it?.score || 0);
    let cls="bad", icon="❌", title=`第${idx}题：错误，得分 ${score}`;
    if(it?.is_correct){ cls="ok"; icon="✅"; title=`第${idx}题：正确，得分 ${score}`; }
    else if(score>0){ cls="partial"; icon="🟡"; title=`第${idx}题：部分得分 ${score}`; }
    return `<div class="qcell ${cls}" title="${title}">${icon} ${idx}</div>`;
  }).join("");
  return `
    <div class="score-card">
      <div class="score-row">
        <div class="score-big">${total.toFixed(2)} / ${maxScore}</div>
        <div class="progress" title="${pct}%"><span style="width:${pct}%"></span></div>
        <div class="muted">${pct}%</div>
      </div>
      <div class="legend">
        <span class="lg ok">✅ 正确</span><span class="lg partial">🟡 部分得分</span><span class="lg bad">❌ 错误</span>
      </div>
      <div class="q-grid">${cells}</div>
    </div>`;
}

/* 交卷后：查看每题答案与解析 */
function renderReview(data){
  if(!data || !data.items) return "<div class='card'><h3>答案与解析</h3><div class='muted'>无数据</div></div>";
  const rows = data.items.map((it, idx) => {
    const opts = (it.options || []).map(o => {
      const isCorrect = (it.correct_labels || []).includes(o.label);
      const icon = isCorrect ? "✅" : "";
      return `<li class="${isCorrect ? 'corr' : ''}"><span class="ol">${o.label}.</span> <span>${escapeHtml(o.text||'')}</span> ${icon}</li>`;
    }).join("");
    const statusTag = it.analysis_status === "approved" ? `<span class="badge ok">已审核</span>`
                    : it.analysis_status === "rejected" ? `<span class="badge bad">已驳回</span>`
                    : `<span class="badge muted">草稿</span>`;
    const correctness = it.is_correct === true ? ` <span class="pill ok">作答：正确</span>`
                     : it.is_correct === false ? ` <span class="pill bad">作答：错误</span>` : ``;
    return `<div class="review-q">
      <div class="stem"><b>${idx+1}.</b> ${escapeHtml(it.stem||'')}</div>
      <ul class="opts">${opts}</ul>
      <div class="meta">${statusTag}${correctness}<span class="pill">${it.qtype === "multi" ? "多选题" : "单选题"}</span></div>
      <div class="analysis"><div class="alabel">解析：</div><div>${escapeHtml(it.analysis||'').replace(/\n/g,'<br>')}</div></div>
    </div>`;
  }).join("");
  return `<div class="card"><h3>答案与解析</h3><div class="review-wrap">${rows}</div></div>`;
}
async function loadReview(attemptId){
  try{
    const j = await (await fetchAuthed(api(`/exam/review?attempt_id=${encodeURIComponent(attemptId)}`))).json();
    if(!j.ok) throw new Error("服务返回失败");
    ensureEl("reviewOut").innerHTML = renderReview(j);
    exportCard.style.display = "block"; // 交卷后显示导出按钮
  }catch(e){
    ensureEl("reviewOut").innerHTML = `<div class="card"><h3>答案与解析</h3><div class="muted">加载失败：${e}</div></div>`;
  }
}

async function submitExam(auto=false){
  if(!attempt) return alert("请先开始作答");
  const answers = collectAnswers();
  const unanswered = questions.length - answers.length;
  if(!auto){
    if(!confirm(`确认提交？${unanswered>0?`尚有 ${unanswered} 题未作答。`:''}`)) return;
  }
  btnSubmit.disabled = true; gradeMsg.textContent = "提交中...";
  try{
    const j = await (await fetchAuthed(api("/exam/submit"), {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({attempt_id:attempt.attempt_id, answers})})).json();
    ensureEl("gradeOut").innerHTML = renderGrade(j);
    gradeMsg.textContent = "评分完成";
    if (attempt && attempt.attempt_id){ await loadReview(attempt.attempt_id); }
  }catch(e){
    gradeMsg.textContent = "提交失败："+e; btnSubmit.disabled = false;
  }finally{
    if(timerHandle) clearInterval(timerHandle);
  }
}

/* 新增：导出我的成绩报告（DOCX）—— 调用 /student/export_my_report_docx */
async function exportMy(){
  if(!attempt || !attempt.attempt_id) return alert("尚未提交或缺少会话信息");
  const fd = new FormData();
  fd.append("attempt_id", attempt.attempt_id); // 后端仅需 attempt_id
  const j = await (await fetchAuthed(api("/student/export_my_report_docx"), { method:"POST", body: fd })).json();
  if(!j.ok) return alert("导出失败："+(j.detail||""));
  const filename = (j.path || "").split("/").pop() || "我的成绩报告.docx";
  await downloadAuthed(api(j.download_url), filename);
}

/* 事件 */
btnLoad.onclick = loadPapers;      // 仅刷新试卷列表，不加载题目
btnStart.onclick = startExam;      // 开始后才加载并显示题目
btnSubmit.onclick = ()=>submitExam(false);
btnLogout.onclick = logout;
if (btnExportMy) btnExportMy.onclick = exportMy;

/* 启动 */
needStudent();
loadPapers().catch(()=>{ /* ignore */ });
