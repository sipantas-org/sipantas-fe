<script setup lang="ts">
import { ref, watch } from "vue";
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import L from "leaflet";
import { RiCompass3Line } from "@remixicon/vue";

// Fix path asset marker icon Leaflet pada Vite/bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const props = withDefaults(
  defineProps<{
    latitude?: string | number;
    longitude?: string | number;
    disabled?: boolean;
  }>(),
  {
    latitude: "",
    longitude: "",
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "change", payload: { latitude: string; longitude: string }): void;
  (e: "update:latitude", value: string): void;
  (e: "update:longitude", value: string): void;
}>();

const zoom = ref(15);
const isLocating = ref(false);
let mapObject: L.Map | null = null;

function onMapReady(map: L.Map) {
  mapObject = map;
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

const DEFAULT_LAT = -6.2088;
const DEFAULT_LNG = 106.8456;

function parseCoord(
  val: string | number | undefined,
  fallback: number,
): number {
  if (val === undefined || val === null || val === "") return fallback;
  const num = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(num) ? fallback : num;
}

const center = ref<[number, number]>([
  parseCoord(props.latitude, DEFAULT_LAT),
  parseCoord(props.longitude, DEFAULT_LNG),
]);
const markerPosition = ref<[number, number]>([
  parseCoord(props.latitude, DEFAULT_LAT),
  parseCoord(props.longitude, DEFAULT_LNG),
]);

function setCoordinates(lat: number, lng: number, updateView = true) {
  const roundedLat = parseFloat(lat.toFixed(6));
  const roundedLng = parseFloat(lng.toFixed(6));

  markerPosition.value = [roundedLat, roundedLng];
  if (updateView) {
    center.value = [roundedLat, roundedLng];
  }

  const latStr = String(roundedLat);
  const lngStr = String(roundedLng);
  emit("update:latitude", latStr);
  emit("update:longitude", lngStr);
  emit("change", { latitude: latStr, longitude: lngStr });
}

function onMarkerDragEnd(e: any) {
  if (props.disabled) return;
  const pos = e.target.getLatLng();
  setCoordinates(pos.lat, pos.lng, false);
}

function onMapClick(e: L.LeafletMouseEvent) {
  if (props.disabled) return;
  setCoordinates(e.latlng.lat, e.latlng.lng, true);
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation tidak didukung oleh browser Anda.");
    return;
  }
  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isLocating.value = false;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const roundedLat = parseFloat(lat.toFixed(6));
      const roundedLng = parseFloat(lng.toFixed(6));

      // Update koordinat & marker tanpa memicu watcher center di l-map agar flyTo tidak terinterupsi
      setCoordinates(roundedLat, roundedLng, false);

      if (mapObject) {
        mapObject.invalidateSize();
        mapObject.flyTo([roundedLat, roundedLng], 16, {
          duration: 1.2,
        });
        mapObject.once("moveend", () => {
          center.value = [roundedLat, roundedLng];
          zoom.value = 16;
        });
      } else {
        center.value = [roundedLat, roundedLng];
        zoom.value = 16;
      }
    },
    (err) => {
      isLocating.value = false;
      alert("Gagal mendeteksi lokasi saat ini: " + err.message);
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    const parsedLat = parseCoord(newLat, DEFAULT_LAT);
    const parsedLng = parseCoord(newLng, DEFAULT_LNG);

    if (
      Math.abs(markerPosition.value[0] - parsedLat) > 0.00001 ||
      Math.abs(markerPosition.value[1] - parsedLng) > 0.00001
    ) {
      markerPosition.value = [parsedLat, parsedLng];
      center.value = [parsedLat, parsedLng];
      if (mapObject) {
        mapObject.setView([parsedLat, parsedLng]);
      }
    }
  },
);
</script>

<template>
  <div
    class="relative w-full overflow-hidden rounded-lg border border-input shadow-sm"
  >
    <div class="h-64 w-full z-0">
      <l-map
        v-model:zoom="zoom"
        :center="center"
        :use-global-leaflet="false"
        style="height: 100%; width: 100%"
        @ready="onMapReady"
        @click="onMapClick"
      >
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
        />
        <l-marker
          :lat-lng="markerPosition"
          :draggable="!disabled"
          @dragend="onMarkerDragEnd"
        />
      </l-map>
    </div>
    <button
      type="button"
      :disabled="disabled || isLocating"
      class="absolute bottom-3 right-3 z-[400] inline-flex items-center gap-1.5 rounded-md border border-input bg-background/95 px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      @click="getCurrentLocation"
    >
      <RiCompass3Line
        class="size-4 text-primary"
        :class="{ 'animate-spin': isLocating }"
      />
      {{ isLocating ? "Mencari lokasi..." : "Lokasi Saya" }}
    </button>
  </div>
</template>
