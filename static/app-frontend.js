// ---- DOM 引用 ----
const kw1 = document.getElementById('kw1');
const kw2 = document.getElementById('kw2');
const kw3 = document.getElementById('kw3');
const userEdit = document.getElementById('userEdit');
const randomBtn = document.getElementById('randomBtn');
const generateBtn = document.getElementById('generateBtn');
const reviseBtn = document.getElementById('reviseBtn');
const continueBtn = document.getElementById('continueBtn');
const loading = document.getElementById('loading');
const output = document.getElementById('output');
const outputKeywords = document.getElementById('outputKeywords');
const outputModel = { textContent: '' };
const outputContent = document.getElementById('outputContent');
const kwError = document.getElementById('kwError');
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const clearAllBtn = document.getElementById('clearAllBtn');
const saveBtn = document.getElementById('saveBtn');
const styleSelect = document.getElementById('styleSelect');
const lengthSelect = document.getElementById('lengthSelect');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const modelSelect = document.getElementById('modelSelect');
const apiKeyGlm = document.getElementById('apiKeyGlm');
const apiKeyDs = document.getElementById('apiKeyDs');
const statusGlm = document.getElementById('statusGlm');
const statusDs = document.getElementById('statusDs');
const apiKeySection = document.getElementById('apiKeySection');
const apiKeySectionDs = document.getElementById('apiKeySectionDs');

// 当前展示的故事（供保存按钮使用）
let currentDisplayedStory = null;
let currentHistoryId = null;

// API 基础路径
const API_BASE = '';


// ── 洒落星光 ──
(function initFallingStars() {
    const container = document.getElementById('fallingStars');
    const count = 35;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'falling-star';
        const size = 2 + Math.random() * 3;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = '-10px';
        star.style.animationDuration = (8 + Math.random() * 12) + 's';
        star.style.animationDelay = (Math.random() * 20) + 's';
        container.appendChild(star);
    }
})();


// ── 模型选择 + API Key 管理 ──
const savedModel = localStorage.getItem('selected_model');
if (savedModel) modelSelect.value = savedModel;
switchModelSection(modelSelect.value);
modelSelect.addEventListener('change', () => {
    localStorage.setItem('selected_model', modelSelect.value);
    switchModelSection(modelSelect.value);
});

function switchModelSection(model) {
    apiKeySection.style.display = model === 'glm' ? 'block' : 'none';
    apiKeySectionDs.style.display = model === 'deepseek' ? 'block' : 'none';
}

function loadSavedKeys() {
    const g = localStorage.getItem('glm_api_key');
    apiKeyGlm.value = g || '';
    statusGlm.textContent = g ? '✓' : '✗';
    statusGlm.className = 'api-status' + (g ? ' saved' : ' unsaved');

    const d = localStorage.getItem('ds_api_key');
    apiKeyDs.value = d || '';
    statusDs.textContent = d ? '✓' : '✗';
    statusDs.className = 'api-status' + (d ? ' saved' : ' unsaved');
}
loadSavedKeys();

document.querySelectorAll('.btn-save-key').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const inputEl = target === 'glm' ? apiKeyGlm : apiKeyDs;
        const statusEl = target === 'glm' ? statusGlm : statusDs;
        const storageKey = target === 'glm' ? 'glm_api_key' : 'ds_api_key';
        const val = inputEl.value.trim();
        if (val) {
            localStorage.setItem(storageKey, val);
            statusEl.textContent = '✓';
            statusEl.className = 'api-status saved';
        } else {
            localStorage.removeItem(storageKey);
            statusEl.textContent = '✗';
            statusEl.className = 'api-status unsaved';
        }
    });
});

function getCurrentApiKey() {
    return modelSelect.value === 'glm' ? apiKeyGlm.value.trim() : apiKeyDs.value.trim();
}


function getModelName(value) {
    return value === 'glm' ? '智谱 GLM-4-Flash' : 'DeepSeek V4 Flash';
}


// ── 设置弹窗 ──
document.getElementById('sidebarSettingsBtn').addEventListener('click', () => settingsModal.classList.add('active'));
settingsCloseBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('active');
});


// ── 手机端侧边栏 ──
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
});

// ── 侧边栏收起/展开 ──
const sidebarToggle = document.getElementById('sidebarToggle');
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    sidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
});
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
});
document.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (item && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    }
});


// ── 随机关键词 ──
async function fetchRandomWords(n = 3) {
    const resp = await fetch(`${API_BASE}/api/random-words?n=${n}`);
    if (!resp.ok) throw new Error('获取随机关键词失败');
    const data = await resp.json();
    return data.words;
}

// 本地备用词库
const WORD_POOL = [
    '魔法', '梦境', '星空', '孤岛', '时钟', '迷雾', '森林', '鲸鱼', '风筝', '列车',
    '影子', '月光', '城堡', '沙漠', '海洋', '烟火', '钢琴', '蝴蝶', '古书', '面具',
    '机器人', '时间旅行', '外星人', '失落城市', '宝藏', '幽灵', '骑士', '龙', '精灵', '海盗',
    '雨夜', '咖啡', '逆袭', '秘密', '冒险', '勇气', '友谊', '背叛', '救赎', '重生',
    '深渊', '回声', '囚徒', '钥匙', '镜子', '迷路', '流浪', '约定', '信', '画'
];

function getLocalRandomWords(n = 3) {
    const pool = [...WORD_POOL];
    const result = [];
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        result.push(pool.splice(idx, 1)[0]);
    }
    return result;
}

randomBtn.addEventListener('click', async () => {
    try {
        const words = await fetchRandomWords(3);
        kw1.value = words[0];
        kw2.value = words[1];
        kw3.value = words[2];
    } catch {
        // 后端不可用时用本地词库
        const words = getLocalRandomWords(3);
        kw1.value = words[0];
        kw2.value = words[1];
        kw3.value = words[2];
    }
    kwError.classList.remove('active');
});


// ── 历史记录 API ──
async function fetchHistory() {
    const resp = await fetch(`${API_BASE}/api/history`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.stories || [];
}

async function saveHistoryItem(item) {
    const resp = await fetch(`${API_BASE}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!resp.ok) throw new Error('保存历史失败');
    return resp.json();
}

async function deleteHistoryItem(id) {
    const resp = await fetch(`${API_BASE}/api/history/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
    if (!resp.ok) throw new Error('删除失败');
}

async function clearAllHistory() {
    const resp = await fetch(`${API_BASE}/api/history`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('清空失败');
}


function formatTime(ts) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}


// ── 渲染历史侧边栏 ──
async function renderHistory() {
    const history = await fetchHistory();
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyEmpty.style.display = 'block';
        return;
    }
    historyEmpty.style.display = 'none';

    for (const item of history) {
        const div = document.createElement('div');
        div.className = 'history-item' + (item.id === currentHistoryId ? ' active' : '');

        const delBtn = document.createElement('button');
        delBtn.className = 'history-del';
        delBtn.textContent = '×';
        delBtn.title = '删除此条';
        delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await deleteHistoryItem(item.id);
                if (currentHistoryId === item.id) currentHistoryId = null;
                await renderHistory();
            } catch (err) {
                alert('删除失败：' + err.message);
            }
        });

        const htime = document.createElement('div');
        htime.className = 'h-time';
        htime.textContent = formatTime(item.time);

        const hwords = document.createElement('div');
        hwords.className = 'h-words';
        hwords.textContent = item.words.join(' · ');

        const hpreview = document.createElement('div');
        hpreview.className = 'h-preview';
        hpreview.textContent = item.story.length > 30 ? item.story.slice(0, 30) + '…' : item.story;

        div.appendChild(htime);
        div.appendChild(hwords);
        div.appendChild(hpreview);
        div.appendChild(delBtn);

        div.addEventListener('click', () => {
            currentHistoryId = item.id;
            outputKeywords.textContent = '关键词：' + item.words.join(' · ');
            outputModel.textContent = '由 ' + getModelName(item.model || 'glm') + ' 生成';
            outputContent.textContent = item.story.trimStart();
            output.classList.add('active');
            currentDisplayedStory = { words: item.words, story: item.story };
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 保存';
            saveBtn.className = 'btn-save';
            reviseBtn.style.display = 'inline-flex';
            continueBtn.style.display = 'inline-flex';
            renderHistory();
        });

        historyList.appendChild(div);
    }
}


async function addHistory(words, story) {
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    await saveHistoryItem({
        id,
        time: Date.now(),
        words,
        story,
        model: modelSelect.value
    });
    currentHistoryId = id;
    await renderHistory();
}


clearAllBtn.addEventListener('click', async () => {
    const history = await fetchHistory();
    if (history.length === 0) return;
    if (!confirm('确定清空所有历史记录？')) return;
    try {
        await clearAllHistory();
        currentHistoryId = null;
        await renderHistory();
    } catch (err) {
        alert('清空失败：' + err.message);
    }
});


// 初始化渲染
renderHistory();


// ── 恢复刷新前的当前故事 ──
try {
    const saved = JSON.parse(sessionStorage.getItem('current_story'));
    if (saved && saved.words && saved.story) {
        outputKeywords.textContent = '关键词：' + saved.words.join(' · ');
        outputModel.textContent = '由 ' + getModelName(saved.model || 'glm') + ' 生成';
        outputContent.textContent = saved.story.trimStart();
        output.classList.add('active');
        currentDisplayedStory = { words: saved.words, story: saved.story };
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 保存';
        saveBtn.className = 'btn-save';
        reviseBtn.style.display = 'inline-flex';
        continueBtn.style.display = 'inline-flex';

        if (saved.kwInputs && Array.isArray(saved.kwInputs)) {
            kw1.value = saved.kwInputs[0] || '';
            kw2.value = saved.kwInputs[1] || '';
            kw3.value = saved.kwInputs[2] || '';
        }
        if (saved.style) styleSelect.value = saved.style;
        if (saved.length) lengthSelect.value = saved.length;
        if (saved.model) modelSelect.value = saved.model;
        if (saved.userEditContent) userEdit.value = saved.userEditContent;
    }
} catch (e) {
    // ignore
}


// ── SSE 流式读取辅助函数 ──
async function readSSEStream(resp, onChunk) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let story = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
            if (!part.startsWith('data: ')) continue;
            try {
                const data = JSON.parse(part.slice(6));
                if (data.error) throw new Error(data.error);
                if (data.done) return story;
                if (data.content) {
                    story += data.content;
                    onChunk(story);
                }
            } catch (e) {
                if (e.message !== 'Unexpected end of JSON input') throw e;
            }
        }
    }
    return story;
}


// ── 生成故事 ──
generateBtn.addEventListener('click', generateStory);

async function generateStory() {
    const words = [kw1.value.trim(), kw2.value.trim(), kw3.value.trim()].filter(Boolean);
    const key = getCurrentApiKey();

    let hasError = false;

    if (words.length === 0) {
        kwError.classList.add('active');
        hasError = true;
    } else {
        kwError.classList.remove('active');
    }

    if (!key) {
        alert('请在设置中填写 API Key');
        hasError = true;
    }

    if (hasError) return;

    // 自动保存上一个未保存的故事
    if (currentDisplayedStory && !saveBtn.disabled) {
        try {
            await fetch(`${API_BASE}/api/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentHistoryId || Date.now().toString(),
                    words: currentDisplayedStory.words,
                    story: currentDisplayedStory.story,
                    timestamp: Date.now()
                })
            });
        } catch (_) { /* 静默忽略保存失败 */ }
    }

    generateBtn.disabled = true;
    loading.classList.add('active');
    output.classList.remove('active');

    outputKeywords.textContent = '关键词：' + words.join(' · ');
    outputModel.textContent = '由 ' + getModelName(modelSelect.value) + ' 生成';
    outputContent.textContent = '';
    output.classList.add('active');

    try {
        const resp = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keywords: words,
                style: styleSelect.value,
                length: lengthSelect.value,
                model: modelSelect.value,
                apiKey: key,
                userEdit: userEdit.value.trim()
            })
        });

        if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error('生成失败 (' + resp.status + '): ' + errBody);
        }

        const story = await readSSEStream(resp, (text) => {
            outputContent.textContent = text.trimStart();
        });

        const finalStory = story || '（AI 返回内容为空）';

        currentDisplayedStory = { words, story: finalStory };
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 保存';
        saveBtn.className = 'btn-save';
        reviseBtn.style.display = 'inline-flex';
        continueBtn.style.display = 'inline-flex';

        sessionStorage.setItem('current_story', JSON.stringify({
            words,
            story: finalStory,
            kwInputs: [kw1.value.trim(), kw2.value.trim(), kw3.value.trim()],
            style: styleSelect.value,
            length: lengthSelect.value,
            model: modelSelect.value,
            userEditContent: userEdit.value
        }));

    } catch (err) {
        alert('生成失败：' + err.message);
    } finally {
        generateBtn.disabled = false;
        loading.classList.remove('active');
    }
}


// ── 继续生成 ──
continueBtn.addEventListener('click', continueStory);

async function continueStory() {
    const currentStory = outputContent.textContent;
    if (!currentStory || currentStory === '（AI 返回内容为空）') {
        alert('没有可继续的故事内容');
        return;
    }

    const key = getCurrentApiKey();
    if (!key) {
        alert('请在设置中填写 API Key');
        return;
    }

    const words = [kw1.value.trim(), kw2.value.trim(), kw3.value.trim()].filter(Boolean);

    continueBtn.disabled = true;
    continueBtn.textContent = '继续中…';
    generateBtn.disabled = true;
    loading.classList.add('active');

    try {
        const resp = await fetch(`${API_BASE}/api/continue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keywords: words,
                style: styleSelect.value,
                length: lengthSelect.value,
                model: modelSelect.value,
                story: currentStory,
                apiKey: key
            })
        });

        if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error('续写失败 (' + resp.status + '): ' + errBody);
        }

        // 流式读取，追加到现有故事后面
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let extra = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';

            for (const part of parts) {
                if (!part.startsWith('data: ')) continue;
                try {
                    const data = JSON.parse(part.slice(6));
                    if (data.error) throw new Error(data.error);
                    if (data.done) break;
                    if (data.content) {
                        extra += data.content;
                        outputContent.textContent = currentStory + extra;
                    }
                } catch (e) {
                    if (e.message !== 'Unexpected end of JSON input') throw e;
                }
            }
        }

        const fullStory = currentStory + extra;
        currentDisplayedStory = { words, story: fullStory };
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 保存';
        saveBtn.className = 'btn-save';

        sessionStorage.setItem('current_story', JSON.stringify({
            words,
            story: fullStory,
            kwInputs: [kw1.value.trim(), kw2.value.trim(), kw3.value.trim()],
            style: styleSelect.value,
            length: lengthSelect.value,
            model: modelSelect.value,
            userEditContent: userEdit.value
        }));

    } catch (err) {
        alert('续写失败：' + err.message);
    } finally {
        continueBtn.disabled = false;
        continueBtn.textContent = '📝 继续生成';
        generateBtn.disabled = false;
        loading.classList.remove('active');
    }
}


// ── 根据用户意见修改故事 ──
reviseBtn.addEventListener('click', reviseStory);

async function reviseStory() {
    const userEditContent = userEdit.value.trim();
    if (!userEditContent) {
        alert('请先在编辑区填写你的修改意见或续写内容');
        return;
    }

    const currentStory = outputContent.textContent;
    if (!currentStory || currentStory === '（AI 返回内容为空）') {
        alert('没有可修改的故事内容');
        return;
    }

    const key = getCurrentApiKey();
    if (!key) {
        alert('请在设置中填写 API Key');
        return;
    }

    const words = [kw1.value.trim(), kw2.value.trim(), kw3.value.trim()].filter(Boolean);

    reviseBtn.disabled = true;
    reviseBtn.textContent = '修改中…';
    generateBtn.disabled = true;
    loading.classList.add('active');

    try {
        const resp = await fetch(`${API_BASE}/api/revise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keywords: words,
                style: styleSelect.value,
                length: lengthSelect.value,
                model: modelSelect.value,
                story: currentStory,
                userEdit: userEditContent,
                apiKey: key
            })
        });

        if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error('修改失败 (' + resp.status + '): ' + errBody);
        }

        const story = await readSSEStream(resp, (text) => {
            outputContent.textContent = text.trimStart();
        });

        const finalStory = story || '（AI 返回内容为空）';

        currentDisplayedStory = { words, story: finalStory };
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 保存';
        saveBtn.className = 'btn-save';

        sessionStorage.setItem('current_story', JSON.stringify({
            words,
            story: finalStory,
            kwInputs: [kw1.value.trim(), kw2.value.trim(), kw3.value.trim()],
            style: styleSelect.value,
            length: lengthSelect.value,
            model: modelSelect.value,
            userEditContent: userEdit.value
        }));

        userEdit.value = '';

    } catch (err) {
        alert('修改失败：' + err.message);
    } finally {
        reviseBtn.disabled = false;
        reviseBtn.textContent = '✏️ 根据意见修改';
        generateBtn.disabled = false;
        loading.classList.remove('active');
    }
}


// ── 手动保存 ──
saveBtn.addEventListener('click', async () => {
    if (!currentDisplayedStory) return;
    await addHistory(currentDisplayedStory.words, currentDisplayedStory.story);
    saveBtn.textContent = '✅ 已保存';
    saveBtn.className = 'btn-save saved';
    saveBtn.disabled = true;
    currentDisplayedStory = null;
});


// ── 刷新/关闭页面时自动保存（使用 sendBeacon） ──
window.addEventListener('beforeunload', () => {
    if (!currentDisplayedStory) return;
    const payload = JSON.stringify({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        time: Date.now(),
        words: currentDisplayedStory.words,
        story: currentDisplayedStory.story,
        model: modelSelect.value
    });
    navigator.sendBeacon(
        `${API_BASE}/api/history/auto-save`,
        new Blob([payload], { type: 'application/json' })
    );
});


// ── Enter 键触发生成 ──
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !generateBtn.disabled) generateStory();
});
