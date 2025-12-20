// 状态机定义
const APP_STATE = {
    PHASE_0_READY: "ready",                 // 准备开始演示
    PHASE_1_WALKING: "walking_to_island",   // 放学路上
    PHASE_2_WAITING: "waiting_at_island",   // 岛上玩耍（等待接单）
    PHASE_3_MATCHING: "matching_guard",     // 派单中
    PHASE_4_ESCORTING: "escorting_home",    // 守护员护送路上
    PHASE_SELF_ESCORTING: "self_escorting_home", // 自己接送路上
    PHASE_5_FINISHED: "finished"            // 到家
};

// Mock数据
const MAP_POINTS = {
    school: { top: "10%", left: "10%" },
    island: { top: "50%", left: "55%" },      // 安全岛位置（向右下移动）
    home: { top: "80%", left: "80%" },
    guardSpawn: { top: "80%", left: "10%" },
    parentSpawn: { top: "10%", left: "80%" }, // 家长出生点（右上角）
    // 学校到安全岛的中间点
    road1: { top: "10%", left: "35%" },   // 校门路终点（水平道路终点）
    road2: { top: "40%", left: "50%" },    // 彩虹路终点
    // NFC打卡点
    parkEntry: { top: "47.5%", left: "50%" },  // 公园入口 NFC打卡点（安全岛左上方）
    parkExit: { top: "58%", left: "65%" }      // 公园出口 NFC打卡点（更靠近安全岛）
};

// 守护员信息
const GUARD_INFO = {
    name: "李队长",
    rating: 4.9,
    phone: "138-8888-8888"
};

// 时间模拟
let currentTime = 15 * 60; // 15:30 in minutes
let stayTime = 0; // 在安全岛停留时间（分钟）
let timeAcceleration = 10; // 时间加速倍数（每秒跳过10分钟）

// 当前状态
let currentState = APP_STATE.PHASE_0_READY;
// NFC打卡状态
let nfcStatus = {
    entry: false,  // 是否已入园
    exit: false    // 是否已离园
};

// DOM元素
const childCharacter = document.getElementById('child-character');
const guardCharacter = document.getElementById('guard-character');
const parentCharacter = document.getElementById('parent-character');
const actionBtn = document.getElementById('action-btn');
const btnText = document.getElementById('btn-text');
const stateTitle = document.getElementById('state-title');
const stateSubtitle = document.getElementById('state-subtitle');
const stateIcon = document.getElementById('state-icon');
const currentTimeElement = document.getElementById('current-time');
const statusText = document.getElementById('status-text');
const stayTimeElement = document.getElementById('stay-time');
const actionNote = document.getElementById('action-note');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const guardModalOverlay = document.getElementById('guard-modal-overlay');
const parentModalOverlay = document.getElementById('parent-modal-overlay');
const resetBtn = document.getElementById('reset-btn');
const parentResetBtn = document.getElementById('parent-reset-btn');
const confirmBtn = document.getElementById('confirm-btn');
const finishBtn = document.getElementById('finish-btn');
const selfPickupBtn = document.getElementById('self-pickup-btn');
const selfPickupText = document.getElementById('self-pickup-text');
const parentArrivalTime = document.getElementById('parent-arrival-time');
const nfcStatusElement = document.getElementById('nfc-status');

// 工具函数：格式化时间 (HH:MM)
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 工具函数：显示通知
function showToast(message, duration = 3000) {
    toastMessage.textContent = message;
    toast.style.display = 'flex';

    // 自动隐藏
    if (duration > 0) {
        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    }
}

// NFC打卡函数
async function triggerNFCCheck(pointType) {
    const nfcPoint = document.getElementById(`nfc-${pointType}`);
    const message = pointType === 'entry' ? '入园打卡' : '离园打卡';

    // 开始扫描动画
    nfcPoint.classList.add('nfc-scanning');
    showToast(`📱 ${message}识别中...`, 2000);

    // 模拟NFC识别延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 扫描成功
    nfcPoint.classList.remove('nfc-scanning');
    nfcPoint.classList.add('nfc-success');

    // 更新状态
    nfcStatus[pointType] = true;
    updateNFCStatusDisplay();

    showToast(`✅ ${message}成功`, 2000);

    // 移除成功动画
    setTimeout(() => {
        nfcPoint.classList.remove('nfc-success');
    }, 1000);
}

// 更新打卡状态显示
function updateNFCStatusDisplay() {
    if (nfcStatusElement) {
        let statusMessage = '';
        if (nfcStatus.exit) {
            statusMessage = '✅ 已离园';
        } else if (nfcStatus.entry) {
            statusMessage = '✅ 已入园';
        } else {
            statusMessage = '⭕️ 未打卡';
        }
        nfcStatusElement.textContent = statusMessage;
    }
}

// 工具函数：移动角色到指定位置
function moveCharacter(character, targetPoint, duration = 3000) {
    return new Promise((resolve) => {
        character.style.transition = `all ${duration}ms linear`;
        character.style.top = targetPoint.top;
        character.style.left = targetPoint.left;

        // 添加移动动画类
        character.classList.add('moving');

        setTimeout(() => {
            character.classList.remove('moving');
            resolve();
        }, duration);
    });
}

// 工具函数：更新界面状态
function updateUIForState(state) {
    switch(state) {
        case APP_STATE.PHASE_0_READY:
            stateIcon.textContent = "👋";
            stateTitle.textContent = "准备开始演示";
            stateSubtitle.textContent = "点击下方按钮开始演示";
            statusText.textContent = "等待开始";
            actionBtn.disabled = false;
            btnText.textContent = "开始演示";
            selfPickupBtn.style.display = 'none';
            actionNote.textContent = "演示将模拟孩子从学校到安全岛再到家的全过程";
            break;

        case APP_STATE.PHASE_1_WALKING:
            stateIcon.textContent = "🚶‍♂️";
            stateTitle.textContent = "正在前往安全岛";
            stateSubtitle.textContent = "智能路灯检测中...";
            statusText.textContent = "放学路上";
            actionBtn.disabled = true;
            btnText.textContent = "孩子行进中";
            selfPickupBtn.style.display = 'none';
            actionNote.textContent = "等待孩子到达安全岛后选择接送方式";
            break;

        case APP_STATE.PHASE_2_WAITING:
            stateIcon.textContent = "🎡";
            stateTitle.textContent = "正在安全岛玩耍";
            stateSubtitle.textContent = "已安全到达，等待回家";
            statusText.textContent = "岛上玩耍";
            actionBtn.disabled = false;
            btnText.textContent = "呼叫守护员接送 ¥15";
            selfPickupBtn.disabled = false;
            selfPickupText.textContent = "自己接送回家";
            selfPickupBtn.style.display = 'flex';
            actionNote.textContent = "请选择接送方式";

            // 添加呼吸灯效果
            childCharacter.classList.add('breathing');
            break;

        case APP_STATE.PHASE_3_MATCHING:
            stateIcon.textContent = "📱";
            stateTitle.textContent = "正在呼叫守护员";
            stateSubtitle.textContent = "系统派单中，请稍候...";
            statusText.textContent = "派单中";
            actionBtn.disabled = true;
            btnText.textContent = "正在派单...";
            selfPickupBtn.style.display = 'none';
            actionNote.textContent = "正在为您匹配最近的守护员";
            break;

        case APP_STATE.PHASE_4_ESCORTING:
            stateIcon.textContent = "🛡️";
            stateTitle.textContent = "守护员护送中";
            stateSubtitle.textContent = `${GUARD_INFO.name}正在护送孩子回家`;
            statusText.textContent = "护送路上";
            actionBtn.disabled = true;
            btnText.textContent = "护送中...";
            selfPickupBtn.style.display = 'none';
            actionNote.textContent = "守护员正在护送孩子回家，预计5分钟到达";

            // 移除呼吸灯效果
            childCharacter.classList.remove('breathing');
            break;

        case APP_STATE.PHASE_SELF_ESCORTING:
            stateIcon.textContent = "👨‍👦";
            stateTitle.textContent = "自己接送中";
            stateSubtitle.textContent = "正在护送孩子回家";
            statusText.textContent = "护送路上";
            actionBtn.disabled = true;
            btnText.textContent = "护送中...";
            selfPickupBtn.style.display = 'none';
            actionNote.textContent = "正在护送孩子回家，预计5分钟到达";
            break;

        case APP_STATE.PHASE_5_FINISHED:
            stateIcon.textContent = "✅";
            stateTitle.textContent = "订单结束";
            stateSubtitle.textContent = "孩子已安全到家";
            statusText.textContent = "已到家";
            actionBtn.disabled = true;
            btnText.textContent = "服务完成";
            selfPickupBtn.style.display = 'none';
            actionNote.textContent = "感谢使用联萌岛安全护送服务";
            break;
    }
}

// 工具函数：更新时间显示
function updateTimeDisplay() {
    currentTimeElement.textContent = formatTime(currentTime);
    stayTimeElement.textContent = `${stayTime}分钟`;
}

// 第一阶段：放学归巢
async function startPhase1() {
    console.log("开始第一阶段：放学归巢");
    currentState = APP_STATE.PHASE_1_WALKING;
    updateUIForState(currentState);

    // 显示通知
    showToast("系统提示：孩子已放学");

    // 等待1秒后开始移动
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第一段：学校 -> 校门路终点
    stateSubtitle.textContent = "正在通过校门路...";
    await moveCharacter(childCharacter, MAP_POINTS.road1, 1500);

    // 第二段：校门路终点 -> 彩虹路终点
    stateSubtitle.textContent = "正在通过彩虹路...";
    await moveCharacter(childCharacter, MAP_POINTS.road2, 1500);

    // 第三段：彩虹路终点 -> 公园入口（NFC打卡）
    stateSubtitle.textContent = "公园入口NFC打卡中...";
    await moveCharacter(childCharacter, MAP_POINTS.parkEntry, 1000);
    await triggerNFCCheck('entry');

    // 第四段：公园入口 -> 安全岛
    stateSubtitle.textContent = "正在前往安全岛...";
    await moveCharacter(childCharacter, MAP_POINTS.island, 1000);

    // 第一阶段完成，进入第二阶段
    await startPhase2();
}

// 第二阶段：安全岛托管
async function startPhase2() {
    console.log("开始第二阶段：安全岛托管");
    currentState = APP_STATE.PHASE_2_WAITING;
    updateUIForState(currentState);

    // 显示到达通知
    showToast("🔔 您的孩子已进入安全岛，正在玩耍中...");

    // 时间加速模拟
    currentTimeElement.classList.add('time-accelerating');

    // 模拟时间流逝（快速）
    const timeInterval = setInterval(() => {
        currentTime += timeAcceleration; // 每秒跳过10分钟
        stayTime += timeAcceleration;
        updateTimeDisplay();

        // 模拟到17:00（1020分钟）左右停止
        if (currentTime >= 17 * 60) {
            clearInterval(timeInterval);
            currentTimeElement.classList.remove('time-accelerating');
            showToast("⏰ 时间已晚，该接孩子回家了");
        }
    }, 1000);

    // 等待用户点击按钮（按钮会在updateUIForState中启用）
}

// 第三阶段：守护员接单和护送
async function startPhase3() {
    console.log("开始第三阶段：守护员接单");
    currentState = APP_STATE.PHASE_3_MATCHING;
    updateUIForState(currentState);

    // 显示派单通知
    showToast("正在为您匹配最近的守护员...");

    // 模拟派单延迟2秒
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 派单成功，显示守护员
    guardCharacter.style.display = 'flex';
    showToast(`✅ 守护员 ${GUARD_INFO.name} 已接单`);

    // 移动守护员到安全岛
    await moveCharacter(guardCharacter, MAP_POINTS.island, 2500);

    // 进入第四阶段：护送回家
    await startPhase4();
}

// 第四阶段：护送回家
async function startPhase4() {
    console.log("开始第四阶段：护送回家");
    currentState = APP_STATE.PHASE_4_ESCORTING;
    updateUIForState(currentState);

    // 显示护送通知
    showToast(`🛡️ ${GUARD_INFO.name} 已接到孩子，正在护送回家`);

    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第一步：移动到公园出口（NFC打卡）
    stateSubtitle.textContent = "公园出口NFC打卡中...";
    childCharacter.style.transition = `all 2500ms linear`;
    guardCharacter.style.transition = `all 2500ms linear`;

    childCharacter.style.top = MAP_POINTS.parkExit.top;
    childCharacter.style.left = MAP_POINTS.parkExit.left;
    guardCharacter.style.top = MAP_POINTS.parkExit.top;
    guardCharacter.style.left = MAP_POINTS.parkExit.left;

    // 添加移动动画
    childCharacter.classList.add('moving');
    guardCharacter.classList.add('moving');

    // 等待移动完成
    await new Promise(resolve => setTimeout(resolve, 2500));

    // NFC打卡
    await triggerNFCCheck('exit');

    // 第二步：移动到家的位置
    stateSubtitle.textContent = `${GUARD_INFO.name}正在护送孩子回家`;
    childCharacter.style.transition = `all 4000ms linear`;
    guardCharacter.style.transition = `all 4000ms linear`;

    childCharacter.style.top = MAP_POINTS.home.top;
    childCharacter.style.left = MAP_POINTS.home.left;
    guardCharacter.style.top = MAP_POINTS.home.top;
    guardCharacter.style.left = MAP_POINTS.home.left;

    // 等待移动完成
    await new Promise(resolve => setTimeout(resolve, 4000));

    // 移除移动动画
    childCharacter.classList.remove('moving');
    guardCharacter.classList.remove('moving');

    // 进入第五阶段：完成
    await startPhase5('guard');
}

// 自己接送流程
async function startSelfPickup() {
    console.log("开始自己接送流程");
    currentState = APP_STATE.PHASE_SELF_ESCORTING;
    updateUIForState(currentState);

    // 移除呼吸灯效果
    childCharacter.classList.remove('breathing');

    // 显示通知
    showToast("👨‍👦 家长出发前往安全岛接孩子");

    // 显示家长
    parentCharacter.style.display = 'flex';

    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 家长移动到安全岛
    showToast("🚗 家长正在前往安全岛...");
    await moveCharacter(parentCharacter, MAP_POINTS.island, 3000);

    // 家长接到孩子，隐藏孩子
    showToast("✅ 家长已接到孩子");
    childCharacter.style.display = 'none';

    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 家长带孩子回家
    showToast("🏠 家长带孩子回家中...");
    parentCharacter.style.transition = `all 5000ms linear`;
    parentCharacter.style.top = MAP_POINTS.home.top;
    parentCharacter.style.left = MAP_POINTS.home.left;
    parentCharacter.classList.add('moving');

    // 等待移动完成
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 移除移动动画
    parentCharacter.classList.remove('moving');

    // 进入第五阶段：完成
    await startPhase5('parent');
}

// 第五阶段：完成
// mode: 'guard' 守护员护送 | 'parent' 家长自己接送
async function startPhase5(mode = 'guard') {
    console.log(`开始第五阶段：完成 (模式: ${mode})`);
    currentState = APP_STATE.PHASE_5_FINISHED;
    updateUIForState(currentState);

    // 隐藏守护员和家长，显示孩子（已到家状态）
    guardCharacter.style.display = 'none';
    parentCharacter.style.display = 'none';
    childCharacter.style.display = 'flex';
    childCharacter.style.top = MAP_POINTS.home.top;
    childCharacter.style.left = MAP_POINTS.home.left;

    // 根据模式显示不同的模态框
    if (mode === 'parent') {
        // 家长自己接送模式
        // 设置到达时间（当前时间 + 5分钟）
        const arrivalMinutes = currentTime + 5;
        parentArrivalTime.textContent = formatTime(arrivalMinutes);
        parentModalOverlay.style.display = 'flex';
        showToast("🏠 家长接送完成！孩子已安全到家", 5000);
    } else {
        // 守护员护送模式
        guardModalOverlay.style.display = 'flex';
        showToast("🎉 孩子已安全到家！服务完成", 5000);
    }
}

// 重置演示
function resetDemo() {
    console.log("重置演示");

    // 重置状态
    currentState = APP_STATE.PHASE_0_READY;
    currentTime = 15 * 60; // 15:30
    stayTime = 0;
    // 重置NFC状态
    nfcStatus.entry = false;
    nfcStatus.exit = false;

    // 重置角色位置
    childCharacter.style.transition = 'none';
    guardCharacter.style.transition = 'none';
    parentCharacter.style.transition = 'none';

    childCharacter.style.top = MAP_POINTS.school.top;
    childCharacter.style.left = MAP_POINTS.school.left;
    guardCharacter.style.top = MAP_POINTS.guardSpawn.top;
    guardCharacter.style.left = MAP_POINTS.guardSpawn.left;
    parentCharacter.style.top = MAP_POINTS.parentSpawn.top;
    parentCharacter.style.left = MAP_POINTS.parentSpawn.left;

    // 显示孩子，隐藏守护员和家长
    childCharacter.style.display = 'flex';
    guardCharacter.style.display = 'none';
    parentCharacter.style.display = 'none';
    // 隐藏自己接送按钮
    selfPickupBtn.style.display = 'none';

    // 移除所有动画类
    childCharacter.classList.remove('breathing', 'moving');
    guardCharacter.classList.remove('moving');
    currentTimeElement.classList.remove('time-accelerating');
    // 移除NFC点动画类
    const nfcEntry = document.getElementById('nfc-entry');
    const nfcExit = document.getElementById('nfc-exit');
    if (nfcEntry) {
        nfcEntry.classList.remove('nfc-scanning', 'nfc-success');
    }
    if (nfcExit) {
        nfcExit.classList.remove('nfc-scanning', 'nfc-success');
    }

    // 隐藏模态框
    guardModalOverlay.style.display = 'none';
    parentModalOverlay.style.display = 'none';

    // 隐藏通知
    toast.style.display = 'none';

    // 更新界面
    updateUIForState(currentState);
    updateTimeDisplay();
    updateNFCStatusDisplay();

    // 强制重绘
    void childCharacter.offsetWidth;

}

// 初始化
function init() {
    console.log("初始化演示应用");

    // 设置初始时间显示
    updateTimeDisplay();

    // 设置初始UI状态
    updateUIForState(currentState);
    updateNFCStatusDisplay();

    // 绑定按钮事件
    actionBtn.addEventListener('click', () => {
        if (currentState === APP_STATE.PHASE_0_READY) {
            startPhase1();
        } else if (currentState === APP_STATE.PHASE_2_WAITING) {
            startPhase3();
        }
    });

    selfPickupBtn.addEventListener('click', () => {
        if (currentState === APP_STATE.PHASE_2_WAITING) {
            startSelfPickup();
        }
    });

    resetBtn.addEventListener('click', resetDemo);

    confirmBtn.addEventListener('click', () => {
        alert("支付成功！感谢使用联萌岛服务。");
        resetDemo();
    });

    parentResetBtn.addEventListener('click', resetDemo);

    finishBtn.addEventListener('click', () => {
        showToast("✅ 家长接送完成！感谢使用联萌岛", 3000);
        resetDemo();
    });

    // 显示欢迎通知
    setTimeout(() => {
        showToast("欢迎使用联萌岛安全护送演示 🏝️", 3000);
    }, 1000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);