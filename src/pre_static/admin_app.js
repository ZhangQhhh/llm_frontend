"use strict";

/* ========== 可调参数 ========== */
const REQ_TIMEOUT_MS = 12000000
const POLLING_INTERVAL_MS = 2000; // Check task status every 2 seconds
const BATCH_SIZE = 3;
/* ============================= */

let analyses = [];
let questions = [];
let pollingInterval = null; // To keep track of the polling interval

const api = (p) => `${location.origin}${p}`;
const sel = (id) => document.getElementById(id);

const who = sel("who");
const btnUpload = sel("btnUpload");
const btnExplain = sel("btnExplain");
const btnLoad = sel("btnLoad");
const btnCreatePaper = sel("btnCreatePaper");
const btnExportTeacher = sel("btnExportTeacher");
const btnImportTeacher = sel("btnImportTeacher");
const importTeacherFile = sel("importTeacherFile");
const uploadMsg = sel("uploadMsg");
const expMsg = sel("expMsg");
const paperMsg = sel("paperMsg");
const qList = sel("qList");
const paperZipSelect = sel("paperZipSelect");
const btnExportZip = sel("btnExportZip");
const btnExportDocx = sel("btnExportDocx");
const zipMsg = sel("zipMsg");
const btnDownloadTemplate = sel("btnDownloadTemplate");
const btnApproveAll = sel("btnApproveAll");
const statusFilter = sel("statusFilter"); // 下拉筛选

/* -------------------- 新增：状态规范化与归一 -------------------- */
function normalizeStatus(s) {
  const raw = (s || "").toString().trim().toLowerCase();
  // 兼容历史中文与大小写/空格
  if (raw === "通过" || raw === "已通过" || raw === "approve" || raw === "approved") return "approved";
  if (raw === "草稿" || raw === "draft") return "draft";
  if (raw === "驳回" || raw === "已驳回" || raw === "reject" || raw === "rejected") return "rejected";
  if (raw === "异常" || raw === "abnormal") return "abnormal";
  return raw || "none";
}
function getEffectiveStatus(a) {
  if (!a) return "none";
  // 先判断 "已驳回" 再判断异常，再看其它
  const st = normalizeStatus(a.status);
  if (st === "rejected") return "rejected";
  if (a.answer_mismatch === true || st === "abnormal") return "abnormal";
  return st || "none";
}
/* ------------------------------------------------------------ */

function auth() {
    try {
        return JSON.parse(localStorage.getItem("exam_auth") || "{}");
    } catch {
        return {};
    }
}

function needAdmin() {
    const a = auth();
    const role = (a && a.user && a.user.role || '').toLowerCase();
    if (!a || !a.token || !(role === 'admin' || role === 'teacher')) {
        location.href = "./login.html?fresh=1";
    } else {
        who.textContent = `已登录：${a.user.username}（${role === 'admin' ? '管理员' : '教师'}）`;
    }
}

async function fetchAuthed(url, options = {}, timeoutMs = REQ_TIMEOUT_MS) {
    options.headers = options.headers || {};
    const a = auth();
    if (a && a.token) options.headers["Authorization"] = "Bearer " + a.token;
    if (!options.headers["Accept"]) options.headers["Accept"] = "application/json";

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort("timeout"), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
}

function escapeHtml(s) {
    return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

async function downloadWithAuth(url, filenameHint = "download.bin") {
    const r = await fetchAuthed(api(url), { method: "GET" }, 300000);
    if (!r.ok) throw new Error(`下载失败：HTTP ${r.status}`);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filenameHint;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

async function robustNavigateDownload(relativeUrl) {
    const absolute = api(relativeUrl);
    try { window.location.assign(absolute); return true; } catch { }
    try {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = absolute;
        document.body.appendChild(iframe);
        setTimeout(() => { try { document.body.removeChild(iframe); } catch { } }, 15000);
        return true;
    } catch { }
    return false;
}

async function downloadTemplate() {
    try {
        const r = await fetchAuthed(api("/admin/import_template/presign"), { method: "GET" }, 15000);
        const j = await r.json();
        if (!r.ok || !j.ok || !j.url) { alert("获取下载链接失败：" + (j.detail || JSON.stringify(j))); return; }
        const ok1 = await robustNavigateDownload(j.url);
        if (ok1) return;
        const fallbackUrl = j.url.replace("/file_signed", "/file_stream_fallback");
        const ok2 = await robustNavigateDownload(fallbackUrl);
        if (ok2) return;
        try {
            const r2 = await fetch(api(fallbackUrl), { method: "GET" });
            if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
            const blob = await r2.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "import_template.docx";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
        } catch (e) {
            alert("下载失败（浏览器策略限制）：请右键复制链接在新标签打开尝试：\n" + api(fallbackUrl));
        }
    } catch (e) {
        alert("下载失败：" + e.message);
    }
}

async function changePassword() {
    const oldp = sel("oldp").value, newp = sel("newp").value;
    if (!newp) return alert("新密码不可为空");
    const r = await fetchAuthed(api("/auth/change_password"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ old_password: oldp, new_password: newp }) });
    const j = await r.json();
    if (j.ok) {
        alert("修改成功，请重新登录");
        localStorage.removeItem("exam_auth");
        location.href = "./login.html?fresh=1";
    } else {
        alert("失败：" + (j.detail || JSON.stringify(j)));
    }
}

async function resetPassword() {
    const u = sel("ru").value, np = sel("rp").value;
    if (!u || !np) return alert("请输入用户名和新密码");
    const r = await fetchAuthed(api("/auth/reset_password"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, new_password: np }) });
    const j = await r.json();
    if (j.ok) alert("已重置"); else alert("失败：" + (j.detail || JSON.stringify(j)));
}

async function uploadQuestions() {
    const f = sel("qfile").files[0];
    if (!f) { uploadMsg.textContent = "请选择 .docx 文件"; return; }
    if (!/\.docx$/i.test(f.name)) { uploadMsg.textContent = "文件类型不支持，请选择 .docx"; return; }
    btnUpload.disabled = true;
    uploadMsg.textContent = "上传中...";
    try {
        const fd = new FormData();
        fd.append("file", f);
        const r = await fetchAuthed(api("/questions/upload"), { method: "POST", body: fd }, REQ_TIMEOUT_MS);
        let j = {};
        try { j = await r.json(); } catch { j = {}; }
        if (r.ok && j.ok) {
            const fa = (typeof j.found_analyses === "number") ? `；识别解析 ${j.found_analyses} 条` : "";
            uploadMsg.textContent = `解析成功：${j.count} 题${fa}`;
            loadQuestions(); // Refresh after successful upload
        } else {
            uploadMsg.textContent = "解析失败：" + (j.detail || `${r.status}`);
        }
    } catch (e) {
        uploadMsg.textContent = "上传失败：" + e.message;
    } finally {
        btnUpload.disabled = false;
    }
}

function pollTaskStatus(taskId) {
    if (pollingInterval) clearInterval(pollingInterval); // Clear any existing polling

    pollingInterval = setInterval(async () => {
        try {
            const res = await fetchAuthed(api(`/tasks/status/${taskId}`), {}, 5000); // Short timeout for polling
            if (!res.ok) {
                 const errorData = await res.json().catch(() => ({ detail: `HTTP error! status: ${res.status}` }));
                 throw new Error(errorData.detail);
            }
            const data = await res.json();

            expMsg.textContent = `正在生成解析: ${data.progress} / ${data.total} 完成...`;

            if (data.status === 'completed' || data.status === 'failed') {
                clearInterval(pollingInterval);
                pollingInterval = null;
                btnExplain.disabled = false;

                if (data.status === 'completed') {
                    const successCount = data.results.filter(r => r.status === 'success').length;
                    expMsg.textContent = `生成完成！成功 ${successCount} / ${data.total}。`;
                    await loadQuestions();
                } else {
                    expMsg.textContent = `任务失败: ${data.error || '未知错误'}`;
                }
            }
        } catch (error) {
            console.error('Polling task status failed:', error);
            expMsg.textContent = `轮询状态时出错: ${error.message}`;
            clearInterval(pollingInterval);
            pollingInterval = null;
            btnExplain.disabled = false;
        }
    }, POLLING_INTERVAL_MS);
}

async function genExplanations() {
    if (pollingInterval) {
        alert("已有任务正在进行中，请等待其完成。");
        return;
    }
    btnExplain.disabled = true;
    expMsg.textContent = "正在准备生成任务...";

    try {
        const r = await fetchAuthed(api("/questions/explain"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                only_unexplained: true,
                include_rejected: true,
                limit: 0 // Process all applicable questions
            })
        });

        const j = await r.json();

        if (r.ok && j.ok && j.task_id) {
            expMsg.textContent = `任务已启动，正在生成解析...`;
            pollTaskStatus(j.task_id);
        } else {
            throw new Error(j.detail || `HTTP ${r.status}`);
        }
    } catch (e) {
        expMsg.textContent = "启动生成任务失败: " + (e.message || e);
        btnExplain.disabled = false;
    }
}

async function regenOne(qid) {
    if (pollingInterval) {
        alert("已有任务正在进行中，请等待其完成。");
        return;
    }
    const btn = qList.querySelector(`.btnRegen[data-q="${qid}"]`);
    if (btn) { btn.disabled = true; btn.textContent = "重生成中..."; }

    try {
        const r = await fetchAuthed(api("/questions/explain"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qids: [qid], limit: 1, include_rejected: true, only_unexplained: false })
        });
        const j = await r.json();
        if (r.ok && j.ok && j.task_id) {
            expMsg.textContent = `正在为题目 ${qid.substring(0,8)}... 重新生成解析...`;
            pollTaskStatus(j.task_id);
        } else {
            throw new Error(j.detail || `HTTP ${r.status}`);
        }
    } catch (e) {
        alert("启动重新生成任务失败：" + e.message);
        if (btn) { btn.disabled = false; btn.textContent = "重生成"; }
    }
}

async function loadAnalyses() {
    analyses = await (await fetchAuthed(api("/debug/analyses"))).json();
}

async function loadQuestions() {
    questions = await (await fetchAuthed(api("/debug/questions"))).json();
    await loadAnalyses();
    renderQuestions();
}

/* === 状态徽标 === */
function getStatusPill(a) {
    const eff = getEffectiveStatus(a);
    if (eff === "approved") return `<span class="pill green">已通过</span>`;
    if (eff === "rejected") return `<span class="pill red" title="${escapeHtml(a?.reject_reason || '')}">已驳回</span>`;
    if (eff === "abnormal") return `<span class="pill orange">异常</span>`;
    if (eff === "draft") return `<span class="pill yellow">草稿</span>`;
    return `<span class="pill gray">无解析</span>`;
}
function getAnalysisText(a) { return (a && a.rationale_overall || "").trim(); }

/* === 渲染 + 过滤 === */
function renderQuestions() {
    qList.innerHTML = "";
    if (!Array.isArray(questions) || !questions.length) { qList.innerHTML = `<div class="muted">题库为空</div>`; return; }
    const amap = new Map(analyses.map(a => [a.qid, a]));

    const filterRaw = (statusFilter && statusFilter.value) ? statusFilter.value : "all";
    const filter = normalizeStatus(filterRaw); // 统一成 approved/draft/abnormal/rejected/none/all
    let idxShown = 0;

    questions.forEach((q) => {
        const a = amap.get(q.qid);
        const text = getAnalysisText(a);
        const eff = getEffectiveStatus(a); // ← 统一后的有效状态

        // 过滤规则
        let match = false;
        if (filter === "all") {
          match = true;
        } else {
          match = (eff === filter);
        }
        if (!match) return;

        const isRejected = eff === "rejected";
        const div = document.createElement("div");
        div.className = "q";
        div.innerHTML = `
      <div><b>${++idxShown}. ${escapeHtml(q.stem)}</b> ${getStatusPill(a)}</div>
      <div class="opt">${q.options.map(opt => `<label>${opt.label}. ${escapeHtml(opt.text)}</label>`).join("")}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btnShow" data-q="${q.qid}" ${text ? "" : "disabled"}>${text ? "查看解析" : "暂无解析"}</button>
        <button class="btnEdit" data-q="${q.qid}">编辑</button>
        <button class="btnApprove" data-q="${q.qid}" ${text ? "" : "disabled"}>通过</button>
        <button class="btnReject" data-q="${q.qid}">驳回</button>
        ${isRejected ? `<button class="btnRegen" data-q="${q.qid}">重生成</button>` : ""}
        <button class="btnSave" data-q="${q.qid}" style="display:none;">保存</button>
        <button class="btnCancel" data-q="${q.qid}" style="display:none;">取消</button>
        <span class="muted" id="tip-${q.qid}" style="display:none;"></span>
      </div>
      <div class="analysis" id="an-${q.qid}" style="display:none;">${escapeHtml(text)}</div>
      <div class="editor" id="ed-${q.qid}" style="display:none;">
        <textarea id="ta-${q.qid}" placeholder="在这里修改本题解析...">${escapeHtml(text)}</textarea>
      </div>`;
        qList.appendChild(div);
    });

    bindQuestionActions();
}

function bindQuestionActions() {
    qList.querySelectorAll(".btnShow").forEach(btn => {
        btn.onclick = () => {
            const qid = btn.dataset.q; const box = sel(`an-${qid}`); const ed = sel(`ed-${qid}`);
            if (ed.style.display === "block") return;
            const show = box.style.display === "none"; box.style.display = show ? "block" : "none";
            btn.textContent = show ? "收起解析" : "查看解析";
        };
    });
    qList.querySelectorAll(".btnEdit").forEach(btn => {
        btn.onclick = () => {
            const qid = btn.dataset.q; sel(`an-${qid}`).style.display = "none"; sel(`ed-${qid}`).style.display = "block";
            qList.querySelector(`.btnSave[data-q="${qid}"]`).style.display = "inline-block";
            qList.querySelector(`.btnCancel[data-q="${qid}"]`).style.display = "inline-block";
            qList.querySelector(`.btnShow[data-q="${qid}"]`).setAttribute("disabled", "disabled");
        };
    });
    qList.querySelectorAll(".btnCancel").forEach(btn => {
        btn.onclick = () => {
            const qid = btn.dataset.q; sel(`ed-${qid}`).style.display = "none";
            qList.querySelector(`.btnSave[data-q="${qid}"]`).style.display = "none";
            qList.querySelector(`.btnCancel[data-q="${qid}"]`).style.display = "none";
            const a = analyses.find(x => x.qid === qid); const text = getAnalysisText(a);
            sel(`ta-${qid}`).value = text; if (text) { sel(`an-${qid}`).innerText = text; }
            qList.querySelector(`.btnShow[data-q="${qid}"]`).removeAttribute("disabled");
        };
    });
    qList.querySelectorAll(".btnApprove").forEach(btn => {
        btn.onclick = async () => {
            const qid = btn.dataset.q; const tip = sel(`tip-${qid}`); const text = sel(`an-${qid}`).textContent || "";
            tip.style.display = "inline"; tip.textContent = "提交中...";
            const fd = new FormData(); fd.append("qid", qid); fd.append("final_text", text);
            const r = await fetchAuthed(api("/questions/review"), { method: "POST", body: fd });
            let j = {}; try { j = await r.json(); } catch { j = {}; }
            tip.textContent = (r.ok && j.ok) ? "已通过" : "失败"; await loadQuestions();
            setTimeout(() => tip.style.display = "none", 1200);
        };
    });
    qList.querySelectorAll(".btnReject").forEach(btn => {
        btn.onclick = async () => {
            const qid = btn.dataset.q; const reason = prompt("请输入驳回原因（可空）：") || "";
            const tip = sel(`tip-${qid}`); tip.style.display = "inline"; tip.textContent = "提交中...";
            const fd = new FormData(); fd.append("qid", qid); fd.append("reason", reason);
            const r = await fetchAuthed(api("/questions/reject"), { method: "POST", body: fd });
            let j = {}; try { j = await r.json(); } catch { j = {}; }
            tip.textContent = (r.ok && j.ok) ? "已驳回" : "失败"; await loadQuestions();
            setTimeout(() => tip.style.display = "none", 1200);
        };
    });
    qList.querySelectorAll(".btnSave").forEach(btn => {
        btn.onclick = async () => {
            const qid = btn.dataset.q; const tip = sel(`tip-${qid}`); const text = sel(`ta-${qid}`).value.trim();
            btn.disabled = true; tip.style.display = "inline"; tip.textContent = "保存中...";
            const fd = new FormData(); fd.append("qid", qid); fd.append("final_text", text);
            const r = await fetchAuthed(api("/questions/review"), { method: "POST", body: fd });
            let j = {}; try { j = await r.json(); } catch { j = {}; }
            if (r.ok && j.ok) {
                tip.textContent = "已保存"; sel(`an-${qid}`).innerText = text; sel(`ed-${qid}`).style.display = "none";
                qList.querySelector(`.btnSave[data-q="${qid}"]`).style.display = "none";
                qList.querySelector(`.btnCancel[data-q="${qid}"]`).style.display = "none";
                qList.querySelector(`.btnShow[data-q="${qid}"]`).removeAttribute("disabled");
                await loadQuestions();
            } else { tip.textContent = "保存失败"; }
            btn.disabled = false; setTimeout(() => tip.style.display = "none", 1500);
        };
    });
    qList.querySelectorAll(".btnRegen").forEach(btn => {
        btn.addEventListener('click', () => {
             regenOne(btn.dataset.q);
        });
    });
}

async function createPaper() {
    const title = sel("paperTitle").value || "示例试卷";
    const fd = new FormData(); fd.append("title", title);
    const r = await fetchAuthed(api("/papers/create"), { method: "POST", body: fd }, REQ_TIMEOUT_MS);
    let j = {}; try { j = await r.json(); } catch { j = {}; }
    paperMsg.textContent = (r.ok && j.ok) ? `已生成试卷 paper_id=${j.paper_id}，docx：${j.docx_path}` : "生成失败";
}
async function exportTeacher() {
    const r = await fetchAuthed(api("/papers/export_teacher"), { method: "POST" }, REQ_TIMEOUT_MS);
    let j = {}; try { j = await r.json(); } catch { j = {}; }
    if (r.ok && j.ok && j.path) {
        await downloadWithAuth(j.path, "teacher_bank.docx");
    } else {
        alert("导出失败：" + (j.detail || "未知错误"));
    }
}
async function importTeacherDocx() {
    const f = importTeacherFile.files[0]; if (!f) return alert("请选择 DOCX 文件");
    const fd = new FormData(); fd.append("file", f);
    const r = await fetchAuthed(api("/papers/import_teacher"), { method: "POST", body: fd }, REQ_TIMEOUT_MS);
    let j = {}; try { j = await r.json(); } catch { j = {}; }
    if (r.ok && j.ok) { alert(`导入成功：答案更新 ${j.updated_questions} 条，解析更新 ${j.updated_analyses} 条${(j.not_matched?.length ? ("；未匹配：" + j.not_matched.join("，")) : "")}`); await loadQuestions(); }
    else alert("导入失败：" + (j.msg || `HTTP ${r.status}`));
}

async function loadPapersForExport() {
    paperZipSelect.innerHTML = `<option value="">加载中...</option>`;
    try {
        const r = await fetchAuthed(api("/debug/papers"), { method: "GET" }, 30000);
        const papers = await r.json();
        if (!Array.isArray(papers) || papers.length === 0) {
            paperZipSelect.innerHTML = "";
            zipMsg.textContent = "暂无试卷";
            return;
        }
        paperZipSelect.innerHTML = papers.map(p => `<option value="${p.paper_id}">${p.title} (${p.paper_id.slice(0, 8)})</option>`).join("");
    } catch (e) {
        paperZipSelect.innerHTML = `<option value="">加载失败</option>`;
        zipMsg.textContent = "加载试卷失败：" + e.message;
    }
}
async function exportZip() {
    const pid = paperZipSelect.value;
    if (!pid) return alert("请选择试卷");
    zipMsg.textContent = "导出 ZIP 中...";
    const fd = new FormData(); fd.append("paper_id", pid);
    try {
        const r = await fetchAuthed(api("/reports/export_paper_grades_zip"), { method: "POST", body: fd });
        let j = {}; try { j = await r.json(); } catch { j = {}; }
        if (!r.ok || !j.ok) { zipMsg.textContent = "导出失败：" + (j.detail || JSON.stringify(j)); return; }
        const filename = (j.zip_path || "").split("/").pop() || "grades.zip";
        await downloadWithAuth(j.download_url, filename);
        zipMsg.textContent = "导出完成";
    } catch (e) { zipMsg.textContent = "导出失败：" + e.message; }
}
async function exportDocxTable() {
    const pid = paperZipSelect.value;
    if (!pid) return alert("请选择试卷");
    zipMsg.textContent = "导出 DOCX 表格中...";
    const fd = new FormData(); fd.append("paper_id", pid);
    try {
        const r = await fetchAuthed(api("/reports/export_paper_grades_docx_table"), { method: "POST", body: fd });
        let j = {}; try { j = await r.json(); } catch { j = {}; }
        if (!r.ok || !j.ok) { zipMsg.textContent = "导出失败：" + (j.detail || JSON.stringify(j)); return; }
        const filename = (j.path || "").split("/").pop() || "grades_table.docx";
        await downloadWithAuth(j.download_url, filename);
        zipMsg.textContent = "导出完成";
    } catch (e) { zipMsg.textContent = "导出失败：" + e.message; }
}

async function approveAll() {
    const btn = btnApproveAll;
    if (!btn) return;
    const old = btn.textContent;
    btn.disabled = true; btn.textContent = "一键通过中…";
    try {
        const r = await fetchAuthed(api("/questions/review_approve_all"), { method: "POST", headers: { "Accept": "application/json" } });
        let j = {};
        try { j = await r.json(); } catch { j = {}; }
        if (!r.ok || !j.ok) {
            alert("一键通过失败：" + (j.detail || `HTTP ${r.status}`));
        } else {
            alert(`已批量通过：${j.approved} 条`);
            await loadQuestions();
        }
    } catch (e) {
        alert("一键通过失败：" + e.message);
    } finally {
        btn.disabled = false; btn.textContent = old;
    }
}

/* 事件绑定 */
sel("btnChange").onclick = changePassword;
sel("btnReset").onclick = resetPassword;
btnUpload.onclick = uploadQuestions;
btnExplain.onclick = genExplanations;
btnLoad.onclick = loadQuestions;
btnCreatePaper.onclick = createPaper;
btnExportTeacher.onclick = exportTeacher;
btnImportTeacher.onclick = importTeacherDocx;
btnExportZip.onclick = exportZip;
btnExportDocx.onclick = exportDocxTable;
if (btnDownloadTemplate) btnDownloadTemplate.onclick = downloadTemplate;
if (btnApproveAll) {
  btnApproveAll.addEventListener("click", function(e){
    e.preventDefault();
    approveAll();
  });
}
if (statusFilter) {
  // 变化即重渲染；并持久化选择（可选）
  statusFilter.addEventListener("change", () => {
    localStorage.setItem("qa_status_filter", statusFilter.value);
    renderQuestions();
  });
  // 还原上次选择（可选）
  const saved = localStorage.getItem("qa_status_filter");
  if (saved) statusFilter.value = saved;
}

/* 启动 */
needAdmin();
loadQuestions();
loadPapersForExport();
