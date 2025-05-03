let lastShopId = null;
let currentMarker = null;
let map;
const apiKey = "4b7888422707f3d6";
let selectedGenre = null;
let currentLat, currentLng;

// 履歴の読み込み・保存
let history = JSON.parse(localStorage.getItem("shopHistory")) || [];

function addToHistory(shop) {
  const entry = {
    name: shop.name,
    url: shop.urls.pc
  };

  history.unshift(entry);
  if (history.length > 5) {
    history = history.slice(0, 5);
  }

  localStorage.setItem("shopHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  history.forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${entry.url}" target="_blank">${entry.name}</a>`;
    list.appendChild(li);
  });
}

function fetchShops(lat, lng) {
  const proxy = "https://api.allorigins.win/raw?url=";
  const rangeSelect = document.getElementById("rangeSelect");
  const selectedRange = rangeSelect ? rangeSelect.value : 3;

  const genreParam = '';
  const encodedURL = encodeURIComponent(
    `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&lat=${lat}&lng=${lng}&range=${selectedRange}&count=100${genreParam}&format=json`
  );

  const url = `${proxy}${encodedURL}`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const shops = data.results.shop;
      if (!shops || shops.length === 0) {
        alert("近くにお店が見つかりませんでした。");
        return;
      }

      let shop;
      let attempts = 0;
      do {
        shop = shops[Math.floor(Math.random() * shops.length)];
        attempts++;
      } while (shop.id === lastShopId && attempts < 10);
      lastShopId = shop.id;

      const shopLatLng = [parseFloat(shop.lat), parseFloat(shop.lng)];
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }

      currentMarker = L.marker(shopLatLng).addTo(map)
        .bindPopup(`
          <b>？？？</b><br>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}" target="_blank">道順を見る</a>
        `)
        .openPopup();

      map.setView(shopLatLng, 16);
      const genreName = shop.genre.name || "？？？";
      document.getElementById("genreMessage").textContent =
        `目的地は「${genreName}」のお店です。`;

      addToHistory(shop);
    })
    .catch(error => {
      console.error("お店取得エラー:", error);
      alert("お店情報の取得に失敗しました。");
    });
}

navigator.geolocation.getCurrentPosition(
  position => {
    currentLat = position.coords.latitude;
    currentLng = position.coords.longitude;

    map = L.map('map').setView([currentLat, currentLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([currentLat, currentLng]).addTo(map).bindPopup('現在地').openPopup();
  },
  error => {
    console.error("位置情報取得失敗:", error);
    alert("位置情報の取得に失敗しました。");
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
);

document.getElementById("startBtn").addEventListener("click", () => {
  if (!selectedGenre) {
    const randomGenre = genreList[Math.floor(Math.random() * genreList.length)];
    selectedGenre = randomGenre.code;
  }

  fetchShops(currentLat, currentLng);
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("rerollBtn").style.display = "inline-block";
});

document.getElementById("rerollBtn").addEventListener("click", () => {
  fetchShops(currentLat, currentLng);
  document.getElementById("genreMessage").textContent =
    "別のお店を探しています…";
});

let isHistoryVisible = false;
function toggleHistory() {
  const list = document.getElementById("historyList");
  const button = document.getElementById("toggleHistoryBtn");

  isHistoryVisible = !isHistoryVisible;
  list.style.display = isHistoryVisible ? "block" : "none";
  if (button) {
    button.textContent = isHistoryVisible ? "履歴を隠す" : "履歴を見る";
  }
}

function clearHistory() {
  if (confirm("履歴をすべて削除しますか？")) {
    history = [];
    localStorage.removeItem("shopHistory");
    renderHistory();
  }
}

const genreList = [
  { code: "G001", name: "居酒屋" },
  { code: "G004", name: "和食" },
  { code: "G005", name: "洋食" },
  { code: "G006", name: "中華" },
  { code: "G007", name: "アジア・エスニック" },
  { code: "G008", name: "焼肉・ホルモン" },
  { code: "G009", name: "韓国料理" },
  { code: "G010", name: "各国料理" },
  { code: "G013", name: "ラーメン" },
  { code: "G014", name: "カフェ・スイーツ" }
];

document.getElementById("closeIntroBtn").addEventListener("click", () => {
  document.getElementById("introBox").style.display = "none";
});

renderHistory();
