// ai.js
let lastAiResult = []; 
const GEMINI_URL = `https://gemini-api-proxy.wudailing0826.workers.dev`;

async function askAI() {
    const input = document.getElementById('ai-input').value;
    const btn = document.getElementById('ai-btn');
    const container = document.getElementById('ai-progress-container');
    const statusText = document.getElementById('ai-status-text');
    const progressBar = document.getElementById('ai-progress-bar');
    const cacheZone = document.getElementById('ai-cache-zone');
    const cacheInputText = document.getElementById('cache-input-text');

    if (!input) return alert("請輸入需求描述內容");
    if (typeof allServices === 'undefined' || allServices.length === 0) {
        return alert("⚠️ 資料尚未載入完成，請稍候再試");
    }

    const lightServices = allServices.map(s => ({id: s.ID, name: s.name}));
    const prompt = `你是台灣長照規劃師。
    清單:${JSON.stringify(lightServices)}
    需求:『${input}』
    規則:
    1.請從清單中挑選 1-3 個最符合需求的服務 ID。
    2.僅回傳 JSON 陣列格式，例如 ["BA01", "BB01"]。不要有任何解釋文字。`;

    btn.disabled = true;
    if (container) container.style.display = "block";
    if (progressBar) {
        progressBar.className = "ai-progress-bar";
        progressBar.style.width = "5%";
    }
    if (statusText) {
        statusText.className = "ai-status-text";
        statusText.innerText = "🤖 AI 長照顧問已啟動...";
    }

    const textTimers = [
        setTimeout(() => { if(statusText) statusText.innerText = "🔍 正在分析您的文字需求與失能背景..."; }, 1000),
        setTimeout(() => { if(statusText) statusText.innerText = "⚖️ 評估長照業務限制與方案篩選中..."; }, 2500),
    ];

    // 3. 讓進度條平滑上升的定時器
    let progress = 5;
    const progressTimer = setInterval(() => {
        if (progress < 85) {
            progress += Math.random() * 5 + 2; 
            if (progress > 85) progress = 85;  
            if (progressBar) progressBar.style.width = `${progress}%`;
        }
    }, 200);

    // 4. 強迫瀏覽器先繪製進度條動畫
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        console.log("正在發送請求至 Gemini API...", { url: GEMINI_URL, prompt: prompt });
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        console.log("Gemini API 原始回傳數據：", data);

        // 停止計時器
        textTimers.forEach(clearTimeout);
        clearInterval(progressTimer);

        if (data.candidates && data.candidates[0]) {
            const aiText = data.candidates[0].content.parts[0].text;
            console.log("AI 回傳的純文字：", aiText);
            
            let extractedIDs = [];
            const arrayMatch = aiText.match(/\[.*\]/s);
            const objectMatch = aiText.match(/\{.*\}/s);

            // 💡 智慧容錯解析：判斷 AI 吐出的是陣列還是物件
            if (arrayMatch) {
                extractedIDs = JSON.parse(arrayMatch[0]);
            } else if (objectMatch) {
                const recommendedObj = JSON.parse(objectMatch[0]);
                extractedIDs = Object.keys(recommendedObj);
            } else {
                throw new Error("AI 回傳內容不包含合法的 JSON 格式");
            }

            console.log("最終解析出的服務 ID 陣列：", extractedIDs);

            // 儲存至全域暫存，並執行自動勾選（數量設為 1）
            // 儲存至全域暫存，並執行自動勾選
            lastAiResult = extractedIDs;
            applyAiSelection(lastAiResult);

            // 💡 修改：更新結果暫存區區塊 UI 與分析結果
            const cacheResultText = document.getElementById('cache-result-text');
            if (cacheZone && cacheInputText) {
                cacheInputText.innerText = input; // 顯示剛剛輸入的需求
                
                // 💡 把勾選項目的綠色文字寫在這裡（上一次需求的下方）
                if (cacheResultText) {
                    cacheResultText.innerHTML = `已自動為您勾選：<span style="color:blue">${extractedIDs.join(', ')}</span>`;
                }
                
                cacheZone.style.display = "block"; // 顯示整個暫存區
            }

            // 更新進度條與進度條上方的提示（讓它保持簡潔）
            if (progressBar) {
                progressBar.style.width = "100%";
                progressBar.classList.add("bg-success"); 
            }
            if (statusText) {
                statusText.className = "ai-status-text text-success";
                statusText.innerHTML = "✅ 分析完成！"; // 這裡變乾淨了
            }

            // 清空輸入框方便下次輸入
            document.getElementById('ai-input').value = "";

        } else {
            throw new Error(data.error?.message || "API 回傳格式不正確");
        }

    } catch (error) {
        textTimers.forEach(clearTimeout);
        clearInterval(progressTimer);
        
        if (progressBar) {
            progressBar.style.width = "100%";
            progressBar.className = "ai-progress-bar bg-error"; 
        }
        if (statusText) {
            statusText.className = "ai-status-text text-error";
            statusText.innerHTML = "❌ 抱歉，AI 暫時無法回應，請手動勾選。";
        }
        console.error("AI Error:", error);
    } finally {
        btn.disabled = false;
    }
}

// 將指定的 ID 陣列加入購物車並連動畫面
function applyAiSelection(idArray) {
    if (!idArray || idArray.length === 0) return;
    
    idArray.forEach(id => {
        if (allServices.find(s => s.ID === id)) {
            selectedServices[id] = 1; // 預設加 1 次
            
            // 同步更新右側網頁卡片上的 input 數值
            const inputEl = document.getElementById(`qty-${id}`);
            if (inputEl) inputEl.value = 1;
        }
    });

    // 觸發外部的重新渲染與額度計算
    if (typeof loadServices === 'function') loadServices();
    if (typeof calculateTotalExpenses === 'function') calculateTotalExpenses();
}

// 監聽一鍵再次套用按鈕
document.addEventListener("DOMContentLoaded", () => {
    const aiApplyBtn = document.getElementById('ai-apply-btn');
    if (aiApplyBtn) {
        aiApplyBtn.addEventListener("click", () => {
            applyAiSelection(lastAiResult);
        });
    }
});