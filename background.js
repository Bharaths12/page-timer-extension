let timers = {};
let intervals = {};
let activeTabId = null;

function fmtBadge(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return sec < 10 ? `${m}:0${sec}` : `${m}:${sec}`;
}

function updateBadge(tabId) {
  if (tabId !== activeTabId) return;
  chrome.action.setBadgeText({ text: fmtBadge(timers[tabId] || 0) });
  chrome.action.setBadgeBackgroundColor({ color: "#000000" });
}

function tick(tabId) {
  timers[tabId] = (timers[tabId] || 0) + 1;
  if (tabId === activeTabId) updateBadge(tabId);
}

function startTimer(tabId) {
  if (!timers[tabId]) timers[tabId] = 0;
  if (!intervals[tabId]) intervals[tabId] = setInterval(() => tick(tabId), 1000);
}

function stopTimer(tabId) {
  if (intervals[tabId]) clearInterval(intervals[tabId]);
  delete intervals[tabId];
  delete timers[tabId];
}

function resetTimer(tabId) {
  if (intervals[tabId]) clearInterval(intervals[tabId]);
  timers[tabId] = 0;
  delete intervals[tabId];
  startTimer(tabId);
  if (tabId === activeTabId) updateBadge(tabId);
}

// --- Listeners ---
chrome.tabs.onActivated.addListener(({ tabId }) => {
  activeTabId = tabId;
  if (!(tabId in timers)) startTimer(tabId);
  updateBadge(tabId);
});

chrome.tabs.onRemoved.addListener(tabId => {
  stopTimer(tabId);
  if (tabId === activeTabId) chrome.action.setBadgeText({ text: "" });
});

chrome.webNavigation.onCommitted.addListener(details => {
  if (details.frameId === 0) resetTimer(details.tabId);
}, { url: [{ schemes: ["http", "https"] }] });

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") resetTimer(tabId);
});

chrome.runtime.onStartup.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});
