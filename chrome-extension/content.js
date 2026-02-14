/**
 * ヤフオク出品アシスト - コンテントスクリプト
 * 出品フォームの全項目をワンクリックで入力
 * フォームHTML（submit）に基づくセレクター
 */

/**
 * 要素に値をセットし、input/change イベントを発火
 */
function setInputValue(el, value) {
  if (!el) return false;
  const v = value == null ? "" : String(value).trim();
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "textarea" || tag === "input") {
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.removeAttribute("readonly");
    el.removeAttribute("disabled");
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: v }));
  }
  return true;
}

/**
 * select で value または表示テキストに一致する option を選択
 */
function setSelectValue(selectEl, value) {
  if (!selectEl || value === "") return false;
  const v = String(value).trim();
  const options = selectEl.querySelectorAll("option");
  for (const opt of options) {
    const optVal = (opt.value || "").trim();
    const optText = (opt.textContent || "").trim();
    if (optVal === v || optText === v || optText.includes(v) || optVal.includes(v)) {
      selectEl.value = opt.value;
      selectEl.focus();
      selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }
  return false;
}

/**
 * 商品の状態 → ヤフオク istatus の value にマッピング
 * istatus options: new, used10, used20, used40, used60, used80
 */
function mapConditionToIstatus(condition) {
  if (!condition) return "";
  const c = String(condition).trim();
  const map = {
    "新品": "new",
    "未使用": "new",
    "新品、未使用": "new",
    "未使用に近い": "used10",
    "目立った傷や汚れなし": "used20",
    "やや傷や汚れあり": "used40",
    "傷や汚れあり": "used60",
    "全体的に状態が悪い": "used80",
    "ジャンク": "used80",
    "中古": "used20",
  };
  for (const [key, val] of Object.entries(map)) {
    if (c.includes(key) || key.includes(c)) return val;
  }
  return c;
}

/**
 * 商品説明をRTE iframe または textarea にセット
 * フォームはHTML入力/通常入力の2モード。表示されている方を埋める
 */
function setDescription(value) {
  if (!value) return false;
  const text = String(value).trim();
  if (!text) return false;

  const textarea = document.querySelector("textarea#fleaDescription, textarea[name='Description_plain_work']");
  const textMode = document.getElementById("textMode");
  const htmlMode = document.getElementById("htmlMode");
  const isTextMode = textMode && getComputedStyle(textMode).display !== "none";

  if (isTextMode && textarea) {
    setInputValue(textarea, text);
    return true;
  }

  const iframe = document.getElementById("rteEditorComposition0");
  if (iframe && iframe.contentDocument) {
    const body = iframe.contentDocument.body;
    if (body) {
      body.focus();
      const html = text.replace(/\n/g, "<br>");
      body.innerHTML = html;
      body.dispatchEvent(new Event("input", { bubbles: true }));
      body.dispatchEvent(new Event("keyup", { bubbles: true }));
      return true;
    }
  }

  if (textarea) {
    setInputValue(textarea, text);
    return true;
  }
  return false;
}

/**
 * フォーム全項目を入力
 */
function fillForm(product) {
  const report = { filled: [], failed: [] };

  // 1. 商品名: input[name="Title"] id="fleaTitleForm"
  const titleEl = document.querySelector("input[name='Title'], #fleaTitleForm");
  if (titleEl && setInputValue(titleEl, product.name)) {
    report.filled.push("商品名");
  } else {
    report.failed.push("商品名");
  }

  // 2. 価格: フリマ（定額）時は #auc_BidOrBuyPrice_buynow、オークション時は #auc_BidOrBuyPrice または #auc_StartPrice
  const priceSelectors = [
    "#auc_BidOrBuyPrice_buynow",
    "input[name='BidOrBuyPrice']",
    "#auc_BidOrBuyPrice",
    "#auc_StartPrice",
    "input[name='StartPrice']",
  ];
  let priceFilled = false;
  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && setInputValue(el, product.price)) {
        report.filled.push("価格");
        priceFilled = true;
        break;
      }
    }
  }
  if (!priceFilled) report.failed.push("価格");

  // 3. 商品説明: textarea または RTE iframe
  if (setDescription(product.description)) {
    report.filled.push("商品説明");
  } else {
    report.failed.push("商品説明");
  }

  // 4. 商品の状態: select[name="istatus"]
  const istatusValue = mapConditionToIstatus(product.condition);
  const condSelect = document.querySelector("select[name='istatus']");
  if (condSelect && setSelectValue(condSelect, istatusValue)) {
    report.filled.push("商品の状態");
  } else {
    report.failed.push("商品の状態");
  }

  return report;
}

/**
 * ページ上のフォーム要素をスキャン（診断用）
 */
function scanFormElements() {
  const elements = [];
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach((el) => {
    const tag = (el.tagName || "").toLowerCase();
    const name = el.getAttribute("name") || "";
    const id = el.getAttribute("id") || "";
    const type = el.getAttribute("type") || (tag === "textarea" ? "textarea" : tag === "select" ? "select" : "text");
    const placeholder = el.getAttribute("placeholder") || "";
    const label = (el.closest("label")?.textContent || document.querySelector(`label[for="${id}"]`)?.textContent || "").trim().slice(0, 30);
    if (name || id) {
      elements.push({ tag, name, id, type, placeholder, label });
    }
  });
  return elements;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SCAN_FORM") {
    try {
      const elements = scanFormElements();
      sendResponse({ ok: true, elements, url: window.location.href });
    } catch (err) {
      sendResponse({ ok: false, error: String(err.message) });
    }
    return true;
  }
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
