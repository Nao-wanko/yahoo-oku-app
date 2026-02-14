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
 * ラジオボタンをクリックして選択
 */
function clickRadio(name, value) {
  const radio = document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`);
  if (radio && !radio.checked) {
    radio.click();
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  return !!radio;
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

  // 2. 製品検索: input[name="productSearchTitle"]（商品名を入れて検索しやすくする）
  const productSearchEl = document.querySelector("input[name='productSearchTitle']");
  if (productSearchEl && product.name && setInputValue(productSearchEl, product.name)) {
    report.filled.push("製品検索");
  }

  // 3. 販売形式: オークションのみ（価格フィールドが切り替わるため先に選択）
  const mode = product.salesmode === "buynow" ? "buynow" : "auction";
  if (clickRadio("salesmode", mode)) {
    report.filled.push("販売形式");
  }

  // 4. 価格: 販売形式に応じたフィールド（フリマ=auc_BidOrBuyPrice_buynow、オークション=auc_StartPrice）
  const priceSelectors = mode === "buynow"
    ? ["#auc_BidOrBuyPrice_buynow", "input[name='BidOrBuyPrice']"]
    : ["#auc_StartPrice", "input[name='StartPrice']", "#auc_BidOrBuyPrice"];
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

  // 5. 商品説明: textarea または RTE iframe
  if (setDescription(product.description)) {
    report.filled.push("商品説明");
  } else {
    report.failed.push("商品説明");
  }

  // 6. 商品の状態: select[name="istatus"]
  const istatusValue = mapConditionToIstatus(product.condition);
  const condSelect = document.querySelector("select[name='istatus']");
  if (condSelect && setSelectValue(condSelect, istatusValue)) {
    report.filled.push("商品の状態");
  } else {
    report.failed.push("商品の状態");
  }

  // 7. 終了する日時（オークション用）: select[name="ClosingYMD"], select[name="ClosingTime"]
  // 指定がなければ入力作業時点から48時間後をデフォルトにする
  const pad = (n) => String(n).padStart(2, "0");
  const defaultClosing = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const defaultYMD =
    defaultClosing.getFullYear() +
    "-" +
    pad(defaultClosing.getMonth() + 1) +
    "-" +
    pad(defaultClosing.getDate());
  const defaultTime =
    product.closingTime != null && product.closingTime >= 0 && product.closingTime <= 23
      ? product.closingTime
      : defaultClosing.getHours();
  const closingYMDVal = product.closingYMD || defaultYMD;

  const closingYMDSelect = document.querySelector("select[name='ClosingYMD'], #ClosingYMD");
  if (closingYMDSelect) {
    if (setSelectValue(closingYMDSelect, closingYMDVal)) {
      report.filled.push("終了日");
    } else {
      // 候補にない日付の場合、それ以降で最も近い候補を選ぶ
      const options = closingYMDSelect.querySelectorAll("option");
      let nearest = null;
      for (const opt of options) {
        const optVal = (opt.value || "").trim();
        if (optVal && optVal >= closingYMDVal) {
          nearest = optVal;
          break;
        }
      }
      if (!nearest && options.length > 0) {
        nearest = (options[options.length - 1].value || "").trim();
      }
      if (nearest && setSelectValue(closingYMDSelect, nearest)) {
        report.filled.push("終了日");
      }
    }
  }
  const closingTimeSelect = document.querySelector("select#ClosingTime");
  if (closingTimeSelect && setSelectValue(closingTimeSelect, String(defaultTime))) {
    report.filled.push("終了時刻");
  }

  // 8. 送料負担: input[name="shipping_dummy"] (seller / buyer)
  const shippingVal = product.shipping === "buyer" ? "buyer" : "seller";
  if (clickRadio("shipping_dummy", shippingVal)) {
    report.filled.push("送料負担");
  }

  // 9. 発送元の地域: select[name="loc_cd"]
  const locVal = product.locCd || "27";
  const locSelect = document.querySelector("select[name='loc_cd']");
  if (locSelect) {
    locSelect.scrollIntoView({ behavior: "smooth", block: "center" });
    if (setSelectValue(locSelect, locVal)) {
      report.filled.push("発送元の地域");
    }
  }

  // 10. 配送方法: input[name="shipmethod_dummy"][data-delivertype="..."]
  const shipMethodVal = product.shipMethod || "is_jp_yupacket_official_ship";
  const shipRadio = document.querySelector(
    `input[name="shipmethod_dummy"][data-delivertype="${shipMethodVal}"]`
  );
  if (shipRadio) {
    shipRadio.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!shipRadio.checked) {
      shipRadio.click();
      shipRadio.dispatchEvent(new Event("change", { bubbles: true }));
    }
    report.filled.push("配送方法");
  }

  // 11. 支払いから発送までの日数: select[name="shipschedule"]
  const scheduleVal = product.shipschedule || "1";
  const shipscheduleSelect = document.querySelector("select[name='shipschedule']");
  if (shipscheduleSelect) {
    shipscheduleSelect.scrollIntoView({ behavior: "smooth", block: "center" });
    if (setSelectValue(shipscheduleSelect, scheduleVal)) {
      report.filled.push("発送までの日数");
    }
  }

  // 12. 画像は uploadImagesToYahoo で非同期処理するためここではスキップ
  return report;
}

/**
 * 商品の画像URLをfetch→Fileに変換し、.js-dragdrop-area にドロップイベントを発火
 */
async function uploadImagesToYahoo(product) {
  const urls = (product.images || []).filter(
    (u) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))
  ).slice(0, 10);
  if (urls.length === 0) return { success: false };

  const dropArea = document.querySelector(".js-dragdrop-area, .ImageUpload__label");
  if (!dropArea) return { success: false };

  const files = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i], { mode: "cors", credentials: "omit" });
      if (!res.ok) continue;
      const blob = await res.blob();
      const extMatch = urls[i].match(/\.(jpg|jpeg|gif)/i);
      const ext = extMatch ? (extMatch[1].toLowerCase() === "jpeg" ? "jpg" : extMatch[1].toLowerCase()) : "jpg";
      const name = `image_${i + 1}.${ext}`;
      const mime = ext === "gif" ? "image/gif" : "image/jpeg";
      const file = new File([blob], name, { type: blob.type === "image/gif" ? "image/gif" : mime });
      files.push(file);
    } catch (_) {
      /* スキップ */
    }
  }
  if (files.length === 0) return { success: false };

  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));

  dropArea.scrollIntoView({ behavior: "smooth", block: "center" });
  await new Promise((r) => setTimeout(r, 300));

  ["dragenter", "dragover", "drop"].forEach((type) => {
    const ev = new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      dataTransfer: dt,
    });
    if (type === "dragover") ev.preventDefault();
    dropArea.dispatchEvent(ev);
  });

  return { success: true };
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
  (async () => {
    try {
      const report = fillForm(msg.product);
      const imgResult = await uploadImagesToYahoo(msg.product);
      if (imgResult.success) report.filled.push("画像");
      else if ((msg.product.images || []).length > 0) report.failed.push("画像");
      sendResponse({ ok: true, report });
    } catch (err) {
      console.error("ヤフオク出品アシスト fillForm error:", err);
      sendResponse({ ok: false, error: String(err.message) });
    }
  })();
  return true;
});
