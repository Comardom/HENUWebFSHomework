document.addEventListener("DOMContentLoaded", function () {
    temporarySetupAutoResize("paper", 50); // 临时函数！这个版本没有动画，有动画的版本有bug,用于调整行数

    // handleImageUpload(); // 调用图片上传和删除功能

    // const trigger = document.getElementById('picture-trigger');
    // const input = document.getElementById('image-input');
    // const paper = document.getElementById('paper');
    // setupImageUploader(trigger, input, paper);//传图片

    // setupImagePreviewOverlay();
    // handleFileUpload();
    enforcePlainTextPaste("paper", "placeholder", 50);
    setupAutoSaveEditableContent("paper", 10000); // 每10秒自动保存一次
    setupToggleVisibility("symbol-trigger", "emoji-container", "show"); //用于调出表情栏
    // setupToggleVisibility("submit-trigger", "submit-container", "show"); //提交栏
    // setupNoteButtonToggle(".notebutton", ["emoji-container", "submit-container"]); //表情和提交互斥
    setupEmojiInserter("emoji-container"); //插入表情
    setupEditablePlaceholder(); // 默认作用于 id="paper"，placeholder 类名为 "placeholder"，用于placeholder的设置
    document.getElementById("download-btn").addEventListener("click", function () {
        exportEditableContentToTxtByFirstSentence("paper");
    });
});
//*************************************************************
function setupToggleVisibility(triggerId, targetId, toggleClass = "show") {
    const trigger = document.getElementById(triggerId);
    const target = document.getElementById(targetId);
    if (!trigger || !target) return;

    trigger.addEventListener("click", function () {
        target.classList.toggle(toggleClass);
    });
}

//***************************************************************
function insertEmoji(editableDiv, emoji) {
    // 插入 emoji 到当前光标位置
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    // 插入 emoji 字符
    const emojiNode = document.createTextNode(emoji);
    range.insertNode(emojiNode);

    // 移动光标到插入字符后
    range.setStartAfter(emojiNode);
    range.setEndAfter(emojiNode);
    selection.removeAllRanges();
    selection.addRange(range);
}

function setupEmojiInserter(emojiContainerId, editableId = "paper") {
    const editableDiv = document.getElementById(editableId);
    const emojiContainer = document.getElementById(emojiContainerId);
    const placeholder = editableDiv.nextElementSibling;

    emojiContainer.addEventListener("mousedown", function (event) {
        event.preventDefault();

        if (event.target.tagName === "SPAN") {
            const emoji = event.target.textContent;

            // 聚焦回编辑区再插入
            editableDiv.focus();
            insertEmoji(editableDiv, emoji);

            // 立即隐藏 placeholder
            placeholder.style.display = "none";
        }
    });

    // 监听编辑区的输入变化，更新 placeholder 显示状态
    editableDiv.addEventListener("input", function () {
        // 如果内容为空，显示 placeholder
        placeholder.style.display = editableDiv.innerHTML.trim() === "" ? "block" : "none";
    });
}

//*********************************************************************************
//临时！！！
function temporarySetupAutoResize(textareaId = "paper", minHeight = 50) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    // 初始样式
    textarea.style.overflow = "hidden";
    textarea.style.transition = "height 0.3s cubic-bezier(0.215, 0.61, 0.355, 1)";
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;

    // 监听 input
    textarea.addEventListener("input", () => {
        textarea.style.height = "auto"; // 清除旧高度
        const targetHeight = Math.max(textarea.scrollHeight, minHeight);
        textarea.style.height = `${targetHeight}px`;
    });
}
//*************************************************************************************
function setupEditablePlaceholder(editableId = "paper", placeholderClass = "placeholder") {
    const editable = document.getElementById(editableId);
    const placeholder = editable?.nextElementSibling;

    if (!editable || !placeholder || !placeholder.classList.contains(placeholderClass)) {
        console.warn("Placeholder setup failed: missing elements or class mismatch.");
        return;
    }

    function isActuallyEmpty(el) {
        const html = el.innerHTML
            .replace(/<br\s*\/?>/gi, "")
            .replace(/&nbsp;/gi, "")
            .trim();
        return html === "";
    }

    function toggle() {
        placeholder.style.display = isActuallyEmpty(editable) ? "block" : "none";
    }

    editable.addEventListener("input", toggle);
    editable.addEventListener("focus", toggle);
    editable.addEventListener("blur", toggle);

    toggle(); // 初始化判断一次
}
//*************************************************************************************
//导出txt
function exportEditableContentToTxtByFirstSentence(editableId) {
    const editableDiv = document.getElementById(editableId);
    if (!editableDiv) {
        console.warn(`元素#${editableId}未找到，导出失败`);
        return;
    }

    const text = editableDiv.innerText || editableDiv.textContent || "";
    const filename = getFirstSentenceAsFilename(text);

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    URL.revokeObjectURL(url);
    a.remove();
}
//截取第一句话
function getFirstSentenceAsFilename(text, maxLength = 30) {
    // 用常见中英文标点符号加可选空白符分割句子
    const sentences = text.split(/[.!?。！？]\s*/);
    let firstSentence = sentences[0] || "exported_text";

    firstSentence = firstSentence.trim();

    // 替换文件名非法字符
    firstSentence = firstSentence.replace(/[\/\\:*?"<>|]/g, "_");

    if (firstSentence.length === 0) {
        firstSentence = "exported_text";
    }

    if (firstSentence.length > maxLength) {
        firstSentence = firstSentence.slice(0, maxLength);
    }

    return firstSentence + ".txt";
}
//*************************************************************************************
//自动保存文本和光标位置
function setupAutoSaveEditableContent(editableId = "paper", intervalMs = 60000) {
    const editable = document.getElementById(editableId);
    if (!editable) {
        console.warn(`Element with id="${editableId}" not found.`);
        return;
    }

    const STORAGE_KEY_CONTENT = editableId + "_content";
    const STORAGE_KEY_SELECTION = editableId + "_selection";
    const STORAGE_KEY_HEIGHT = editableId + "_height";

    // 获取节点相对根节点的路径（索引序列）
    function getNodePath(node, root) {
        const path = [];
        while (node && node !== root) {
            const parent = node.parentNode;
            if (!parent) break;
            path.unshift(Array.prototype.indexOf.call(parent.childNodes, node));
            node = parent;
        }
        return path;
    }

    // 根据路径获取节点
    function getNodeByPath(root, path) {
        let node = root;
        for (const index of path) {
            if (!node.childNodes[index]) return null;
            node = node.childNodes[index];
        }
        return node;
    }

    // 保存内容到 localStorage
    function saveContent() {
        localStorage.setItem(STORAGE_KEY_CONTENT, editable.innerHTML);
    }

    // 保存光标位置到 localStorage
    function saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        const startPath = getNodePath(range.startContainer, editable);
        const startOffset = range.startOffset;

        const selectionData = JSON.stringify({ startPath, startOffset });
        localStorage.setItem(STORAGE_KEY_SELECTION, selectionData);
    }

    // 保存高度
    function saveHeight() {
        const height = editable.style.height || window.getComputedStyle(editable).height;
        localStorage.setItem(STORAGE_KEY_HEIGHT, height);
    }

    // 恢复内容
    function restoreContent() {
        const savedContent = localStorage.getItem(STORAGE_KEY_CONTENT);
        if (savedContent !== null) {
            editable.innerHTML = savedContent;
        }
    }

    // 恢复光标位置
    function restoreSelection() {
        const selectionData = localStorage.getItem(STORAGE_KEY_SELECTION);
        if (!selectionData) return;

        let data;
        try {
            data = JSON.parse(selectionData);
        } catch {
            return;
        }
        const { startPath, startOffset } = data;

        const startNode = getNodeByPath(editable, startPath);
        if (!startNode) return;

        const range = document.createRange();
        const selection = window.getSelection();

        range.setStart(startNode, Math.min(startOffset, startNode.length || 0));
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
    }

    // 恢复高度
    function restoreHeight() {
        const savedHeight = localStorage.getItem(STORAGE_KEY_HEIGHT);
        if (savedHeight) {
            editable.style.height = savedHeight;
        }
    }

    // 初始化恢复内容、光标和高度
    restoreContent();
    restoreSelection();
    restoreHeight();

    // 定时保存内容、光标和高度
    setInterval(() => {
        saveContent();
        saveSelection();
        saveHeight();
    }, intervalMs);
}
//*************************************************************************************
function enforcePlainTextPaste(editableId = "paper", placeholderClass = "placeholder", minHeight = 50) {
    const editable = document.getElementById(editableId);
    const placeholder = editable?.nextElementSibling;

    if (!editable) return;

    editable.addEventListener("paste", function (e) {
        e.preventDefault();

        const text = (e.clipboardData || window.clipboardData).getData("text");

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));

        // 移动光标到插入文本末尾
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        // 1. 更新 placeholder 显示状态
        if (placeholder) {
            const isEmpty = editable.innerHTML
                .replace(/<br\s*\/?>/gi, "")
                .replace(/&nbsp;/gi, "")
                .trim() === "";
            placeholder.style.display = isEmpty ? "block" : "none";
        }

        // 2. 更新高度
        // 强制重新计算高度（模仿临时自动调整函数逻辑）
        editable.style.height = "auto";
        const targetHeight = Math.max(editable.scrollHeight, minHeight);
        editable.style.height = `${targetHeight}px`;
    });
}
