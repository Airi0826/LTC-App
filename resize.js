// resize.js
document.addEventListener("DOMContentLoaded", function () {
    const resizer = document.getElementById("resizer");
    const sidebar = document.querySelector(".sidebar");

    let x = 0;
    let w = 0;

    // 處理開始拖移的動作
    const startResize = function (e) {
        // 相容滑鼠點擊與手機觸控事件
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        
        x = clientX;
        w = parseInt(window.getComputedStyle(sidebar).width, 10);

        // 監聽移動與放開事件
        document.addEventListener("mousemove", resizing);
        document.addEventListener("mouseup", stopResize);
        document.addEventListener("touchmove", resizing);
        document.addEventListener("touchend", stopResize);
        
        // 防止拖移時選取到網頁文字
        document.body.style.userSelect = 'none';
    };

    // 處理拖移中的寬度變化
    const resizing = function (e) {
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const dx = clientX - x;
        sidebar.style.width = `${w + dx}px`;
    };

    // 停止拖移，移除監聽器
    const stopResize = function () {
        document.removeEventListener("mousemove", resizing);
        document.removeEventListener("mouseup", stopResize);
        document.removeEventListener("touchmove", resizing);
        document.removeEventListener("touchend", stopResize);
        
        // 恢復文字選取功能
        document.body.style.userSelect = '';
    };

    // 綁定事件到分隔線上
    resizer.addEventListener("mousedown", startResize);
    resizer.addEventListener("touchstart", startResize);
});