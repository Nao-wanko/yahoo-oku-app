/**
 * ヤフオク出品アシスト - コンテントスクリプト
 * 出品ページ（submit*）でメッセージを受け取り、フォームに値をセットする
 */

const SELECTORS = {
  title: 'input[name="title"]',
  bidorbuy: 'input[name="bidorbuy"]',
  description: 'textarea[name="description"]',
  // 商品の状態: ヤフオクでは select や radio のことが多い
  conditionSelect: 'select[name="condition"]',
  conditionInput: 'input[name="condition"]',
  conditionRadio: 'input[type="radio"][name*="condition"], input[type="radio"][name*="itemcond"]',
};

/**
 * 要素に値をセットし、必要なら input/change イベントを発火させる
 */
function setInputValue(el, value) {
  if (!el) return false;
  const v = value == null ? "" : String(value).trim();
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "textarea" || tag === "input") {
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return true;
}

/**
 * select で value に一致する option を選択
 */
function setSelectValue(selectEl, value) {
  if (!selectEl || !value) return false;
  const v = String(value).trim();
  const options = selectEl.querySelectorAll("option");
  for (const opt of options) {
    if ((opt.value || opt.textContent || "").trim() === v) {
      selectEl.value = opt.value;
      selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }
  if (selectEl.options.length) {
    selectEl.selectedIndex = 0;
    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return true;
}

/**
 * 商品の状態の文字列をヤフオクの選択肢に近い形にマッピング（必要に応じて調整）
 */
function mapCondition(condition) {
  if (!condition) return "";
  const c = String(condition).trim();
  const map = {
    "新品": "新品",
    "中古": "中古",
    "未使用": "未使用",
    "ジャンク": "ジャンク",
  };
  return map[c] || c;
}

function fillForm(product) {
  const report = { filled: [], failed: [] };

  // 商品名
  const titleEl = document.querySelector(SELECTORS.title);
  if (setInputValue(titleEl, product.name)) {
    report.filled.push("商品名");
  } else {
    report.failed.push("商品名");
  }

  // 即決価格
  const bidorbuyEl = document.querySelector(SELECTORS.bidorbuy);
  if (setInputValue(bidorbuyEl, product.price)) {
    report.filled.push("即決価格");
  } else {
    report.failed.push("即決価格");
  }

  // 商品説明（リッチエディタ対策: value + input/change）
  const descEl = document.querySelector(SELECTORS.description);
  if (descEl) {
    setInputValue(descEl, product.description);
    report.filled.push("商品説明");
    // 一部ページでは contenteditable の div が使われている場合
    const editable = document.querySelector("[contenteditable=true][name='description'], .editable-description, [data-field='description']");
    if (editable && product.description) {
      editable.textContent = product.description;
      editable.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } else {
    report.failed.push("商品説明");
  }

  // 商品の状態: select 優先、次に input、最後に radio
  const condMapped = mapCondition(product.condition);
  const condSelect = document.querySelector(SELECTORS.conditionSelect);
  const condInput = document.querySelector(SELECTORS.conditionInput);
  const condRadios = document.querySelectorAll(SELECTORS.conditionRadio);

  if (condSelect && setSelectValue(condSelect, condMapped)) {
    report.filled.push("商品の状態(select)");
  } else if (condInput && setInputValue(condInput, condMapped)) {
    report.filled.push("商品の状態(input)");
  } else if (condRadios.length) {
    for (const radio of condRadios) {
      const label = (radio.value || radio.getAttribute("data-value") || "").trim();
      const labelText = (radio.parentElement?.textContent || "").trim();
      if (label === condMapped || labelText.includes(condMapped)) {
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
        report.filled.push("商品の状態(radio)");
        break;
      }
    }
    if (!report.filled.includes("商品の状態(radio)")) report.failed.push("商品の状態");
  } else {
    report.failed.push("商品の状態");
  }

  return report;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "FILL_FORM" || !msg.product) {
    sendResponse({ ok: false, error: "invalid message" });
    return true;
  }
  try {
    const report = fillForm(msg.product);
    sendResponse({ ok: true, report });
  } catch (err) {
    console.error("ヤフオク出品アシスト fillForm error:", err);
    sendResponse({ ok: false, error: String(err.message) });
  }
  return true;
});
