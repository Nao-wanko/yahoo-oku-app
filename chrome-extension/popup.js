/**
 * ヤフオク出品アシスト - ポップアップ
 * API から未出品商品を取得し、クリックでヤフオクタブに送信・画像URLはコピー用表示
 */

// 本番: Vercel URL / 開発: http://localhost:3000（末尾スラッシュなし）
const API_BASE = "https://yahoo-oku-5hgbwetxp-naosakais-projects.vercel.app".replace(/\/$/, "");

const btnRefresh = document.getElementById("btnRefresh");
const productList = document.getElementById("productList");
const messageEl = document.getElementById("message");

let products = [];

function showMessage(text, type = "info") {
  messageEl.textContent = text;
  messageEl.className = "msg " + type;
  messageEl.style.display = "block";
  if (type !== "error" && type !== "success") {
    setTimeout(() => {
      messageEl.style.display = "none";
    }, 3000);
  }
}

function hideMessage() {
  messageEl.style.display = "none";
}

function renderProductItem(product, index) {
  const li = document.createElement("li");
  const name = product.name || "（無題）";
  const meta = `¥${Number(product.price).toLocaleString()} · ${product.condition || "—"}`;

  const itemDiv = document.createElement("div");
  itemDiv.className = "product-item";
  itemDiv.setAttribute("data-index", String(index));
  itemDiv.innerHTML = `<span class="product-name">${escapeHtml(name)}</span><span class="product-meta">${escapeHtml(meta)}</span>`;

  const detailDiv = document.createElement("div");
  detailDiv.className = "product-detail";
  detailDiv.id = `detail-${index}`;

  const label = document.createElement("div");
  label.className = "detail-label";
  label.textContent = "画像URL（コピーして手動で貼り付け）";
  detailDiv.appendChild(label);

  const imageList = document.createElement("div");
  imageList.className = "image-list";
  if (product.images && product.images.length > 0) {
    product.images.forEach((url, i) => {
      const wrap = document.createElement("div");
      wrap.className = "image-item";
      const span = document.createElement("span");
      span.className = "url";
      span.title = url;
      span.textContent = url;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-copy";
      btn.textContent = "コピー";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyToClipboard(url).then(() => {
          btn.textContent = "コピーしました";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "コピー";
            btn.classList.remove("copied");
          }, 2000);
        });
      });
      wrap.appendChild(span);
      wrap.appendChild(btn);
      imageList.appendChild(wrap);
    });
  } else {
    const empty = document.createElement("div");
    empty.className = "image-item";
    empty.textContent = "画像なし";
    imageList.appendChild(empty);
  }
  detailDiv.appendChild(imageList);

  li.appendChild(itemDiv);
  li.appendChild(detailDiv);

  itemDiv.addEventListener("click", async () => {
    // 他項目の詳細を閉じる
    productList.querySelectorAll(".product-detail.open").forEach((el) => el.classList.remove("open"));
    detailDiv.classList.toggle("open");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        showMessage("タブ情報を取得できません", "error");
        return;
      }
      if (!tab.url || !tab.url.startsWith("https://auctions.yahoo.co.jp/")) {
        showMessage("ヤフオクの出品ページを開いた状態で、商品をクリックしてください。", "error");
        return;
      }
      await sendProductToTab(tab.id, product);
    } catch (err) {
      console.error(err);
      showMessage("エラー: " + (err.message || "フォームの入力に失敗しました"), "error");
    }
  });

  return li;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

/**
 * ヤフオクタブに商品データを送信。コンテンツスクリプトが未注入の場合は注入してから再送する
 */
function sendProductToTab(tabId, product) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "FILL_FORM", product }, (response) => {
      if (chrome.runtime.lastError) {
        const msg = chrome.runtime.lastError.message || "";
        if (msg.includes("Receiving end does not exist") || msg.includes("Could not establish connection")) {
          injectContentAndSend(tabId, product, resolve);
        } else {
          showMessage("送信エラー: " + msg, "error");
          resolve();
        }
        return;
      }
      showMessage("フォームに入力しました", "success");
      resolve();
    });
  });
}

function injectContentAndSend(tabId, product, resolve) {
  chrome.scripting.executeScript(
    { target: { tabId }, files: ["content.js"] },
    (results) => {
      if (chrome.runtime.lastError) {
        showMessage(
          "出品ページでスクリプトを読み込めませんでした。出品ページを一度再読み込み（F5）してから、もう一度商品をクリックしてください。",
          "error"
        );
        resolve();
        return;
      }
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { type: "FILL_FORM", product }, () => {
          if (chrome.runtime.lastError) {
            showMessage("フォームの入力に失敗しました。ページを再読み込みしてからお試しください。", "error");
          } else {
            showMessage("フォームに入力しました", "success");
          }
          resolve();
        });
      }, 150);
    }
  );
}

async function fetchProducts() {
  const url = `${API_BASE}/api/products`;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(
      "APIに接続できません。\n・" + (API_BASE.startsWith("http://localhost") ? "管理アプリ（npm run dev）が起動しているか確認してください。" : "ネットワークとAPIのURLを確認してください。")
    );
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("APIの応答がJSONではありません。");
  }
  if (!res.ok) {
    const msg = data?.error || (res.status === 503 ? "APIが利用できません（Supabase未設定の可能性）。" : `HTTP ${res.status}`);
    throw new Error(msg);
  }
  if (!Array.isArray(data)) throw new Error("不正なレスポンスです。");
  return data;
}

async function refreshList() {
  btnRefresh.disabled = true;
  hideMessage();
  productList.innerHTML = "";
  try {
    products = await fetchProducts();
    products.forEach((p, i) => productList.appendChild(renderProductItem(p, i)));
    showMessage(products.length > 0 ? `${products.length}件の未出品商品を取得しました` : "未出品の商品はありません");
  } catch (e) {
    const msg = e.message || "商品リストの取得に失敗しました";
    showMessage(msg, "error");
    console.error("fetchProducts error:", e);
  } finally {
    btnRefresh.disabled = false;
  }
}

btnRefresh.addEventListener("click", refreshList);

// 開いたときに一度取得
refreshList();
