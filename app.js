const canvas = document.getElementById("mapa");
const ctx = canvas.getContext("2d");
const info = document.getElementById("info");
const fileInput = document.getElementById("fileInput");

let img = new Image();
let imageLoaded = false;
let mouseX = 0, mouseY = 0;
let editingImage = false;
let imgX = 0, imgY = 0, imgWidth = 800, imgHeight = 500;
let resizingImage = false;

let lat_min = 17.0, lat_max = 21.0;
let lon_min = -74.5, lon_max = -67.0;
let markers = [];

fileInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

img.onload = function() {
    imageLoaded = true;
    actualizarMapa();
};

function setCoordinates() {
    lat_min = parseFloat(document.getElementById("lat_min").value);
    lat_max = parseFloat(document.getElementById("lat_max").value);
    lon_min = parseFloat(document.getElementById("lon_min").value);
    lon_max = parseFloat(document.getElementById("lon_max").value);
    actualizarMapa();
}

function placeMarker() {
    const lat = parseFloat(document.getElementById("marker_lat").value);
    const lon = parseFloat(document.getElementById("marker_lon").value);
    if (!isNaN(lat) && !isNaN(lon) && 
            lat >= lat_min && lat <= lat_max && 
            lon >= lon_min && lon <= lon_max) {
        markers.push({ lat, lon });
        actualizarMapa();
    }
}

function clearMarkers() {
    markers = [];
    actualizarMapa();
}

function pixelToCoords(x, y) {
    let lon = lon_min + (x / canvas.width) * (lon_max - lon_min);
    let lat = lat_max - (y / canvas.height) * (lat_max - lat_min);
    return { lat: lat.toFixed(4), lon: lon.toFixed(4) };
}

function coordsToPixel(lat, lon) {
    let x = ((lon - lon_min) / (lon_max - lon_min)) * canvas.width;
    let y = ((lat_max - lat) / (lat_max - lat_min)) * canvas.height;
    return { x, y };
}

function dibujarCuadrantes() {
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Líneas y etiquetas de latitud
    for(let lat = lat_min; lat <= lat_max; lat += 0.1) {
        let y = ((lat_max - lat) / (lat_max - lat_min)) * canvas.height;

        ctx.beginPath();
        ctx.lineWidth = (lat % 1 === 0) ? 1.2 : 0.5;
        ctx.strokeStyle = (lat % 1 === 0) ? "#bbb" : "#ddd";
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        if(lat % 1 === 0) {
            ctx.font = "12px sans-serif";
            ctx.fillStyle = "#666";
            ctx.fillText(`${lat}°N`, 5, y - 5);
        }
    }

    // Líneas y etiquetas de longitud
    for(let lon = lon_min; lon <= lon_max; lon += 0.1) {
        let x = ((lon - lon_min) / (lon_max - lon_min)) * canvas.width;

        ctx.beginPath();
        ctx.lineWidth = (lon % 1 === 0) ? 1.2 : 0.5;
        ctx.strokeStyle = (lon % 1 === 0) ? "#bbb" : "#ddd";
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();

        if(lon % 1 === 0) {
            ctx.font = "12px sans-serif";
            ctx.fillStyle = "#666";
            ctx.fillText(`${Math.abs(lon)}°W`, x + 5, canvas.height - 5);
        }
    }

    // Esquinas de coordenadas
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#666";
    ctx.fillText(`${lat_max}°N, ${Math.abs(lon_min)}°W`, 5, 15);
    ctx.fillText(`${lat_max}°N, ${Math.abs(lon_max)}°W`, canvas.width - 100, 15);
    ctx.fillText(`${lat_min}°N, ${Math.abs(lon_min)}°W`, 5, canvas.height - 5);
    ctx.fillText(`${lat_min}°N, ${Math.abs(lon_max)}°W`, canvas.width - 100, canvas.height - 5);
}

function actualizarMapa() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageLoaded) {
        ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    }

    dibujarCuadrantes();

    // Cruz del cursor
    ctx.strokeStyle = "rgba(255,0,0,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouseX, 0);
    ctx.lineTo(mouseX, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, mouseY);
    ctx.lineTo(canvas.width, mouseY);
    ctx.stroke();

    // Punto del cursor
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Marcadores
    markers.forEach(marker => {
        const { x, y } = coordsToPixel(marker.lat, marker.lon);
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function toggleImageEdit() {
    editingImage = !editingImage;
    canvas.style.cursor = editingImage ? "move" : "crosshair";
}

function resizeImage(action) {
    const step = 50;
    if (action === 'increase') {
        imgWidth += step;
        imgHeight += step;
    } else if (action === 'decrease') {
        imgWidth = Math.max(50, imgWidth - step);
        imgHeight = Math.max(50, imgHeight - step);
    }
    actualizarMapa();
}

canvas.addEventListener("mousemove", function(event) {
    let rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;

    if (editingImage && imageLoaded) {
        if (event.buttons === 1) {
            if (resizingImage) {
                imgWidth = mouseX - imgX;
                imgHeight = mouseY - imgY;
            } else {
                imgX = mouseX - imgWidth / 2;
                imgY = mouseY - imgHeight / 2;
            }
            actualizarMapa();
        }
    } else {
        let coords = pixelToCoords(mouseX, mouseY);
        info.textContent = `Coordenadas: ${coords.lat}°N, ${coords.lon}°W`;
        actualizarMapa();
    }
});

canvas.addEventListener("mousedown", function(event) {
    if (editingImage && imageLoaded) {
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        if (x > imgX + imgWidth - 10 && x < imgX + imgWidth + 10 && y > imgY + imgHeight - 10 && y < imgY + imgHeight + 10) {
            resizingImage = true;
        }
    }
});

canvas.addEventListener("mouseup", function() {
    resizingImage = false;
});

canvas.addEventListener("click", function(event) {
    if (!editingImage) {
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        let coords = pixelToCoords(x, y);
        markers.push({
            lat: parseFloat(coords.lat),
            lon: parseFloat(coords.lon)
        });
        actualizarMapa();
    }
});

actualizarMapa();