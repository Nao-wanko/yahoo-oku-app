/**
 * ヤフオク出品アシスト - ポップアップ
 * API から未出品商品を取得し、クリックでヤフオクタブに送信・画像URLはコピー用表示
 */

// 本番では Vercel URL 等に差し替え可能
const API_BASE = "https://yahoo-oku-5hgbwetxp-naosakais-projects.vercel.app/";

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
        showMessage("ヤフオクの出品ページを開いてから、もう一度商品をクリックしてください。", "error");
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: "FILL_FORM", product });
      showMessage("フォームに入力しました", "success");
    } catch (err) {
      console.error(err);
      showMessage("フォームの入力に失敗しました。出品ページを再読み込みしてからお試しください。", "error");
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

async function fetchProducts() {
  const url = `${API_BASE}/api/products`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(res.status === 503 ? "APIが利用できません。管理アプリが起動しているか確認してください。" : `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("不正なレスポンスです");
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
    showMessage(e.message || "商品リストの取得に失敗しました", "error");
  } finally {
    btnRefresh.disabled = false;
  }
}

btnRefresh.addEventListener("click", refreshList);

// 開いたときに一度取得
refreshList();
