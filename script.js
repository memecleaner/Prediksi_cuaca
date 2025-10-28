document.addEventListener("DOMContentLoaded", () => {
    // === A. KONFIGURASI PENTING ===
    // WARNING: KUNCI API TERPASANG DI SINI! (Hanya untuk prototipe kelulusan)
    const API_KEY = "310cc95a017643050d85abdd4cfaba11"; // GANTI DENGAN KUNCI ANDA YANG SUDAH AKTIF

    // --- Deklarasi DOM ---
    const lokasiEl = document.getElementById("lokasi");
    const hasilEl = document.getElementById("hasil");
    const manualInputEl = document.getElementById("manual-input");
    const manualLocationEl = document.getElementById("manual-location");
    const submitManualEl = document.getElementById("submit-manual");

    manualInputEl.style.display = "block";

    /**
     * Mengambil data cuaca berdasarkan Lat/Lon (Langsung dari OWM)
     */
    async function getCuaca(lat, lon, namaWilayah = 'Lokasi Anda') {
        try {
            hasilEl.classList.add("loading");
            hasilEl.textContent = `Sedang mencari data cuaca untuk ${namaWilayah}...`;

            // URL OWM Langsung
            const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=id&appid=${API_KEY}`;
            console.log(`Fetching OWM:`, owmUrl);

            const res = await fetch(owmUrl);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: res.statusText }));
                // Jika 401, minta cek kunci
                if (res.status === 401) {
                    throw new Error(`401 Unauthorized. Kunci API tidak valid atau belum aktif.`);
                }
                throw new Error(`API OWM Gagal: ${res.status} - ${errorData.message}`);
            }

            const data = await res.json();
            
            // Parsing data OWM yang Sederhana
            const prakiraan = data.weather[0]; // Cuaca
            const main = data.main;         // Suhu, Kelembapan
            const wind = data.wind;         // Angin
            
            hasilEl.innerHTML = `
                <h3>🌍 ${namaWilayah} (${data.name || 'Wilayah'})</h3>
                <p><b>Cuaca:</b> ${prakiraan.description}</p>
                <p><b>Suhu:</b> ${main.temp} °C</p>
                <p><b>Kelembapan:</b> ${main.humidity}%</p>
                <p><b>Kecepatan Angin:</b> ${Math.round(wind.speed * 3.6 * 10) / 10} km/jam</p>
            `;
            lokasiEl.textContent = `Lokasi: ${namaWilayah}`;
            hasilEl.classList.remove("loading");

        } catch (err) {
            console.error("Error fetching weather:", err);
            hasilEl.textContent = `Terjadi kesalahan saat memuat data: ${err.message}.`;
            lokasiEl.textContent = `Lokasi: ${namaWilayah || 'Gagal'}`;
            hasilEl.classList.remove("loading");
        }
    }
    
    /**
     * Mendapatkan Lat/Lon dari nama lokasi manual menggunakan OWM Geocoding.
     */
    async function getLatLonFromName(cityName) {
        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
            const res = await fetch(geoUrl);
            
            if (!res.ok) throw new Error(`Geocoding OWM Gagal: ${res.status}`);

            const data = await res.json();

            if (data && data.length > 0) {
                return { lat: data[0].lat, lon: data[0].lon, name: `${data[0].name}, ${data[0].state || ''} ${data[0].country}` };
            }
            return null; // Lokasi tidak ditemukan
        } catch(err) {
            console.error("Geocoding Error:", err);
            return null;
        }
    }


    // === B. LOGIKA GEOLOCATION (Pencarian Otomatis) ===
    if (navigator.geolocation) {
        lokasiEl.textContent = "Mendeteksi lokasi pengguna...";
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                getCuaca(pos.coords.latitude, pos.coords.longitude); 
            },
            (err) => {
                // Fallback ke Jakarta jika gagal otomatis
                lokasiEl.textContent = "Lokasi otomatis gagal. Menggunakan lokasi default (Jakarta).";
                getCuaca(-6.2, 106.8); 
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        lokasiEl.textContent = "Browser tidak mendukung geolocation. Menggunakan lokasi default (Jakarta).";
        getCuaca(-6.2, 106.8);
    }

    // === C. EVENT LISTENER INPUT MANUAL ===
    submitManualEl.addEventListener("click", async () => {
        const manualName = manualLocationEl.value.trim();
        if (manualName) {
            hasilEl.classList.add("loading");
            hasilEl.textContent = `Mencari koordinat untuk ${manualName}...`;
            
            const locationData = await getLatLonFromName(manualName);
            
            if (locationData) {
                 getCuaca(locationData.lat, locationData.lon, locationData.name);
            } else {
                 hasilEl.textContent = `Lokasi "${manualName}" tidak ditemukan. Coba nama kota yang lebih spesifik.`;
                 hasilEl.classList.remove("loading");
            }
        }
    });

});