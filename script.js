const lokasiEl = document.getElementById("lokasi");
const cuacaSekarangEl = document.getElementById("cuaca-sekarang");
const cuacaPrediksiEl = document.getElementById("cuaca-prediksi");

// Daftar lokasi BMKG Depok
const lokasiBMKG = [
  {nama:"Beji", kode:"32.76.06.1001"},
  {nama:"Tugu", kode:"32.76.02.1009"},
  {nama:"Pondok Cina", kode:"32.76.06.1005"},
  {nama:"Depok Jaya", kode:"32.76.01.1007"},
  {nama:"Sawangan", kode:"32.76.03.1010"}
];

// Fungsi hitung jarak (Haversine)
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}

// Dapatkan lokasi pengguna
navigator.geolocation.getCurrentPosition(async (pos) => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  // Koordinat BMKG Depok
  const lokasiBMKGKoord = {
    "Beji": {lat:-6.4026, lon:106.7940},
    "Tugu": {lat:-6.3615, lon:106.8497},
    "Pondok Cina": {lat:-6.3626, lon:106.8200},
    "Depok Jaya": {lat:-6.4000, lon:106.8300},
    "Sawangan": {lat:-6.3720, lon:106.8000}
  };

  let terdekat = lokasiBMKG[0];
  let minJarak = Infinity;
  lokasiBMKG.forEach(lok => {
    const k = lokasiBMKGKoord[lok.nama];
    const jarak = hitungJarak(lat, lon, k.lat, k.lon);
    if(jarak < minJarak) {
      minJarak = jarak;
      terdekat = lok;
    }
  });

  // Tampilkan nama lokasi + lat/lon
  lokasiEl.innerHTML = `📍 Lokasi terdeteksi: <b>${terdekat.nama}, Depok</b><br>
                        Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`;

  await fetchCuaca(terdekat.kode, terdekat.nama);

}, (err)=>{
  lokasiEl.textContent = "Gagal mendeteksi lokasi.";
  cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
});

// Fungsi fetch cuaca
async function fetchCuaca(kode, nama) {
  const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${kode}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if(!data.data || !data.data[0].cuaca) {
      cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
      return;
    }

    const semuaSlot = data.data[0].cuaca.flat();
    const now = new Date();

    // Slot paling dekat sekarang
    let slotTerdekat = null;
    let diffMin = Infinity;
    semuaSlot.forEach(slot=>{
      const slotTime = new Date(slot.local_datetime);
      const diff = Math.abs(slotTime - now);
      if(diff < diffMin){
        diffMin = diff;
        slotTerdekat = slot;
      }
    });

    // Tampilkan cuaca sekarang (lebih rapih)
    if(slotTerdekat){
      cuacaSekarangEl.innerHTML = `
        <div>🌤️ ${slotTerdekat.weather_desc}</div>
        <div>Suhu: ${slotTerdekat.t}°C</div>
        <div>Kelembaban: ${slotTerdekat.hu}%</div>
        <div class="cuaca-slot">🕒 Slot BMKG: ${new Date(slotTerdekat.local_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
      `;
    } else {
      cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
    }

    // Prediksi 3 slot berikutnya
    cuacaPrediksiEl.innerHTML = "";
    const indexTerdekat = semuaSlot.indexOf(slotTerdekat);
    const prediksiNext = semuaSlot.slice(indexTerdekat+1, indexTerdekat+4);
    prediksiNext.forEach(slot=> addPrediksi(slot));

  } catch(err){
    cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
    console.error(err);
  }
}

// Tambah slot prediksi
function addPrediksi(slot){
  const div = document.createElement("div");
  div.className = "cuaca-item";
  div.innerHTML = `
    <div>🌤️ ${slot.weather_desc}</div>
    <div>Suhu: ${slot.t}°C</div>
    <div>Kelembaban: ${slot.hu}%</div>
    <div class="cuaca-slot">🕒 Slot BMKG: ${new Date(slot.local_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
  `;
  cuacaPrediksiEl.appendChild(div);
}
