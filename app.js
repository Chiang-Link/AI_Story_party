const kw1 = document.getElementById('kw1');
const kw2 = document.getElementById('kw2');
const kw3 = document.getElementById('kw3');
const randomBtn = document.getElementById('randomBtn');
const generateBtn = document.getElementById('generateBtn');
const loading = document.getElementById('loading');
const output = document.getElementById('output');
const outputKeywords = document.getElementById('outputKeywords');
const outputContent = document.getElementById('outputContent');
const kwError = document.getElementById('kwError');
const keyError = document.getElementById('keyError');
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

// —— 洒落星光 ——
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

// —— localStorage / sessionStorage ——
const KEY_MODEL = 'selected_model';
const KEY_API_GLM = 'glm_api_key';
const KEY_API_DS = 'ds_api_key';
const KEY_HISTORY = 'story_history';
const KEY_SESSION = 'current_story';

// 模型选择 + 切换对应 API Key 区域
function switchModelSection(model) {
    apiKeySection.style.display = model === 'glm' ? 'block' : 'none';
    apiKeySectionDs.style.display = model === 'deepseek' ? 'block' : 'none';
}
const savedModel = localStorage.getItem(KEY_MODEL);
if (savedModel) { modelSelect.value = savedModel; switchModelSection(savedModel); }
modelSelect.addEventListener('change', () => {
    localStorage.setItem(KEY_MODEL, modelSelect.value);
    switchModelSection(modelSelect.value);
    keyError.classList.remove('active');
});

// 读取已保存的 Key 并显示状态
function loadSavedKeys() {
    [apiKeyGlm, statusGlm, KEY_API_GLM, apiKeyDs, statusDs, KEY_API_DS].length; // noop
    const g = localStorage.getItem(KEY_API_GLM);
    apiKeyGlm.value = g || '';
    statusGlm.textContent = g ? '✓' : '✗';
    statusGlm.className = 'api-status' + (g ? ' saved' : ' unsaved');

    const d = localStorage.getItem(KEY_API_DS);
    apiKeyDs.value = d || '';
    statusDs.textContent = d ? '✓' : '✗';
    statusDs.className = 'api-status' + (d ? ' saved' : ' unsaved');
}
loadSavedKeys();

// 保存按钮
document.querySelectorAll('.btn-save-key').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const inputEl = target === 'glm' ? apiKeyGlm : apiKeyDs;
        const statusEl = target === 'glm' ? statusGlm : statusDs;
        const storageKey = target === 'glm' ? KEY_API_GLM : KEY_API_DS;
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

// 获取当前模型对应的 API Key
function getCurrentApiKey() {
    return modelSelect.value === 'glm' ? apiKeyGlm.value.trim() : apiKeyDs.value.trim();
}

function getModelName(value) {
    return value === 'glm' ? '智谱 GLM-4-Flash' : 'DeepSeek V4 Flash';
}

// —— 随机关键词 ——
const WORD_POOL = [
    '魔法', '梦境', '星空', '孤岛', '时钟', '迷雾', '森林', '鲸鱼', '风筝', '列车',
    '影子', '月光', '城堡', '沙漠', '海洋', '烟火', '钢琴', '蝴蝶', '古书', '面具',
    '机器人', '时间旅行', '外星人', '失落城市', '宝藏', '幽灵', '骑士', '龙', '精灵', '海盗',
    '雨夜', '咖啡', '逆袭', '秘密', '冒险', '勇气', '友谊', '背叛', '救赎', '重生',
    '深渊', '回声', '囚徒', '钥匙', '镜子', '迷路', '流浪', '约定', '信', '画'
];

function getRandomWords(n = 3) {
    const pool = [...WORD_POOL];
    const result = [];
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        result.push(pool.splice(idx, 1)[0]);
    }
    return result;
}

randomBtn.addEventListener('click', () => {
    const words = getRandomWords(3);
    kw1.value = words[0];
    kw2.value = words[1];
    kw3.value = words[2];
    kwError.classList.remove('active');
});

// —— 设置弹窗 ——
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
});
settingsCloseBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('active');
});

// —— 手机端侧边栏抽屉 ——
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
});
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
});
// 点击侧边栏条目后自动关抽屉（手机端）
document.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (item && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    }
});

// —— 历史记录 ——

function getHistory() {
    try {
        const raw = localStorage.getItem(KEY_HISTORY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('读取历史记录失败:', e);
        return [];
    }
}

function saveHistory(history) {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
}

function formatTime(ts) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

let currentHistoryId = null;

function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyEmpty.style.display = 'block';
        return;
    }
    historyEmpty.style.display = 'none';

    // 最新的在最上面
    for (let i = history.length - 1; i >= 0; i--) {
        const item = history[i];
        const div = document.createElement('div');
        div.className = 'history-item' + (item.id === currentHistoryId ? ' active' : '');

        const delBtn = document.createElement('button');
        delBtn.className = 'history-del';
        delBtn.textContent = '×';
        delBtn.title = '删除此条';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const history = getHistory();
            const idx = history.findIndex(h => h.id === item.id);
            if (idx === -1) return;
            history.splice(idx, 1);
            saveHistory(history);
            if (currentHistoryId === item.id) currentHistoryId = null;
            renderHistory();
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
            outputContent.textContent = item.story;
            output.classList.add('active');
            // 侧边栏点击时也记录当前故事，供保存按钮使用
            currentDisplayedStory = { words: item.words, story: item.story };
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 保存';
            saveBtn.className = 'btn-save';
            sessionStorage.setItem(KEY_SESSION, JSON.stringify({ words: item.words, story: item.story }));
            renderHistory();
        });

        historyList.appendChild(div);
    }
}

function addHistory(words, story) {
    const history = getHistory();
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    history.push({ id, time: Date.now(), words, story, model: modelSelect.value });
    saveHistory(history);
    currentHistoryId = id;
    renderHistory();
}

clearAllBtn.addEventListener('click', () => {
    if (getHistory().length === 0) return;
    if (!confirm('确定清空所有历史记录？')) return;
    saveHistory([]);
    currentHistoryId = null;
    renderHistory();
});

// 初始化渲染
renderHistory();

// 恢复刷新前的当前故事
try {
    const saved = JSON.parse(sessionStorage.getItem(KEY_SESSION));
    if (saved && saved.words && saved.story) {
        outputKeywords.textContent = '关键词：' + saved.words.join(' · ');
        outputModel.textContent = '由 ' + getModelName(saved.model || 'glm') + ' 生成';
        outputContent.textContent = saved.story;
        output.classList.add('active');
        currentDisplayedStory = { words: saved.words, story: saved.story };
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 保存';
        saveBtn.className = 'btn-save';

        // 恢复关键词输入框
        if (saved.kwInputs && Array.isArray(saved.kwInputs)) {
            kw1.value = saved.kwInputs[0] || '';
            kw2.value = saved.kwInputs[1] || '';
            kw3.value = saved.kwInputs[2] || '';
        }

        // 恢复风格/篇幅/模型选择
        if (saved.style) styleSelect.value = saved.style;
        if (saved.length) lengthSelect.value = saved.length;
        if (saved.model) modelSelect.value = saved.model;
        if (saved.userEditContent) userEdit.value = saved.userEditContent;
    }
} catch (e) {
    // ignore
}

// —— 生成故事 ——
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
        keyError.classList.add('active');
        hasError = true;
    } else {
        keyError.classList.remove('active');
    }

    if (hasError) return;

    generateBtn.disabled = true;
    loading.classList.add('active');
    output.classList.remove('active');

    const lengthMap = { '短篇': '300字左右', '中篇': '800字左右', '长篇': '1500字左右' };
    const prompt = `请根据以下三个关键词创作一个故事：\n关键词：${words.join('、')}\n风格：${styleSelect.value}\n篇幅：${lengthMap[lengthSelect.value]}\n\n故事应该自然融入所有关键词，有完整的起承转合。`;

    try {
        // 准备输出区域
        outputKeywords.textContent = '关键词：' + words.join(' · ');
        outputModel.textContent = '由 ' + getModelName(modelSelect.value) + ' 生成';
        outputContent.textContent = '';
        output.classList.add('active');

        const url = modelSelect.value === 'glm'
            ? 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
            : 'https://api.deepseek.com/chat/completions';
        const modelName = modelSelect.value === 'glm' ? 'glm-4-flash-250414' : 'deepseek-v4-flash';

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + key
            },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.85,
                max_tokens: 1500,
                stream: true
            })
        });

        if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error('API 错误 (' + resp.status + '): ' + errBody);
        }

        // 流式读取
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let story = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');

            for (const line of lines) {
                try {
                    const json = JSON.parse(line.slice(6));
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        story += delta;
                        outputContent.textContent = story;
                    }
                } catch (e) {
                    // 跳过解析失败的行
                }
            }
        }

        if (!story) story = '（AI 返回内容为空）';

        // 记录当前故事，供保存按钮使用
        currentDisplayedStory = { words, story };
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 保存';
        saveBtn.className = 'btn-save';

        // 保存到 sessionStorage，刷新后恢复
        sessionStorage.setItem(KEY_SESSION, JSON.stringify({
            words,
            story,
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

// Enter 键触发
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !generateBtn.disabled) generateStory();
});

// —— 手动保存 ——
saveBtn.addEventListener('click', () => {
    if (!currentDisplayedStory) return;
    addHistory(currentDisplayedStory.words, currentDisplayedStory.story);
    saveBtn.textContent = '✅ 已保存';
    saveBtn.className = 'btn-save saved';
    saveBtn.disabled = true;
    currentDisplayedStory = null; // 标记已保存，避免 beforeunload 重复保存
});

// —— 刷新/关闭页面时自动保存未保存的故事 ——
window.addEventListener('beforeunload', () => {
    if (!currentDisplayedStory) return;
    const history = getHistory();
    const alreadySaved = history.some(h =>
        h.words.join('') === currentDisplayedStory.words.join('') &&
        h.story === currentDisplayedStory.story
    );
    if (!alreadySaved) {
        const id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        history.push({ id, time: Date.now(), words: currentDisplayedStory.words, story: currentDisplayedStory.story });
        saveHistory(history);
    }
});
