<template>
  <q-page class="db-page">
    <!-- Background blobs -->
    <div class="db-blob db-blob--1" aria-hidden="true" />
    <div class="db-blob db-blob--2" aria-hidden="true" />

    <div class="db-container">

      <!-- ── Header ── -->
      <div class="db-header">
        <div class="db-header__icon">
          <q-icon name="dashboard" size="26px" color="white" />
        </div>
        <div>
          <h1 class="db-header__title">Dashboard del Negocio</h1>
          <p class="db-header__subtitle">Visualiza y gestiona tu catálogo, estadísticas y reseñas</p>
        </div>
      </div>

      <!-- ── Catálogo ── -->
      <div class="db-card">
        <div class="db-card__header">
          <div class="db-card__title">
            <div class="db-card__title-icon">
              <q-icon name="shopping_bag" size="16px" color="white" />
            </div>
            Mi Catálogo
          </div>
          <span v-if="negocio?.catalogo" class="db-chip">
            {{ negocio.catalogo.length }} productos
          </span>
        </div>
        <Catalogo />
      </div>

      <!-- ── Estadísticas ── -->
      <div class="db-card">
        <Estadisticas :negocio="negocio" />
      </div>

      <!-- ── Reseñas ── -->
      <div class="db-card">
        <div class="db-card__header">
          <div class="db-card__title">
            <div class="db-card__title-icon db-card__title-icon--amber">
              <q-icon name="star" size="16px" color="white" />
            </div>
            Reseñas de Clientes
          </div>
          <span v-if="negocio?.reseñas" class="db-chip db-chip--amber">
            {{ negocio.reseñas.length }} total
          </span>
        </div>

        <!-- Calificación promedio -->
        <div class="db-rating-row">
          <q-rating
            :model-value="Math.round(negocio?.calificacion_promedio || 0)"
            readonly size="1.4em" color="amber"
          />
          <span class="db-rating-value">{{ (negocio?.calificacion_promedio || 0).toFixed(1) }}</span>
          <span class="db-rating-label">/ 5.0</span>
        </div>

        <!-- Filtro por puntaje -->
        <div v-if="negocio?.reseñas?.length" class="db-filter-row">
          <span class="db-filter-label">Filtrar:</span>
          <div class="db-filter-btns">
            <button
              v-for="stars in [0, 5, 4, 3, 2, 1]" :key="stars"
              class="db-filter-btn"
              :class="{ 'db-filter-btn--active': filtroEstrellas === stars }"
              @click="filtroEstrellas = stars"
            >
              <span v-if="stars === 0">Todas</span>
              <span v-else>{{ stars }} ⭐</span>
            </button>
          </div>
        </div>

        <!-- Distribución -->
        <div v-if="negocio?.reseñas?.length" class="db-dist">
          <div class="db-dist__label">Distribución</div>
          <div v-for="stars in [5, 4, 3, 2, 1]" :key="stars" class="db-dist__row">
            <span class="db-dist__stars">{{ stars }} ⭐</span>
            <div class="db-dist__bar-bg">
              <div
                class="db-dist__bar-fill"
                :style="{ width: ((contarPorEstrellas[stars] || 0) / negocio.reseñas.length * 100) + '%' }"
              />
            </div>
            <span class="db-dist__count">{{ contarPorEstrellas[stars] || 0 }}</span>
          </div>
        </div>

        <!-- Lista de reseñas filtradas -->
        <div v-if="resenasFiltradas?.length" class="db-reviews">
          <div v-for="(res, idx) in resenasFiltradas" :key="idx" class="db-review-item">
            <div class="db-review-item__header">
              <div class="db-review-item__avatar">{{ (res.usuario_nombres || 'U')[0].toUpperCase() }}</div>
              <div>
                <div class="db-review-item__name">{{ res.usuario_nombres }}</div>
                <div class="db-review-item__date">{{ formatDate(res.fecha) }}</div>
              </div>
              <div class="db-review-item__stars">
                <q-rating :model-value="res.calificacion" readonly size="0.9em" color="amber" />
              </div>
            </div>
            <p class="db-review-item__text">{{ res.comentario }}</p>
          </div>
        </div>

        <!-- Empty states -->
        <div v-else-if="negocio?.reseñas?.length" class="db-empty">
          <q-icon name="filter_list" size="28px" />
          <span>No hay reseñas con este puntaje</span>
        </div>
        <div v-else class="db-empty">
          <q-icon name="rate_review" size="32px" />
          <span>Aún no hay reseñas. ¡Espera que tus clientes compartan su experiencia!</span>
        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup>
import Catalogo    from 'src/components/negocio/Catalogo.vue'
import Estadisticas from 'src/components/negocio/Estadisticas.vue'
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { negocioAPI } from 'src/api/negocio'

const auth    = useAuthStore()
const negocio = ref(null)
const filtroEstrellas = ref(0)

const resenasFiltradas = computed(() => {
  if (!negocio.value?.reseñas?.length) return []
  if (filtroEstrellas.value === 0) return negocio.value.reseñas.slice().reverse()
  return negocio.value.reseñas.filter(r => r.calificacion === filtroEstrellas.value).reverse()
})

const contarPorEstrellas = computed(() => {
  const conteo = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  if (negocio.value?.reseñas?.length) {
    negocio.value.reseñas.forEach(r => {
      if (Object.prototype.hasOwnProperty.call(conteo, r.calificacion)) conteo[r.calificacion]++
    })
  }
  return conteo
})

function formatDate(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  try { negocio.value = await negocioAPI.getMiNegocio(auth.user._id) }
  catch (err) { console.warn('No se pudo cargar negocio para dashboard', err) }
})
</script>

<style scoped>
/* ── Variables ── */
.db-page {
  --db-accent:      #22c55e;
  --db-accent-dark: #16a34a;
  --db-bg:          #f0faf4;
  --db-surface:     #ffffff;
  --db-surface-alt: #f6fef9;
  --db-border:      #b7e4c7;
  --db-text:        #0f2d1c;
  --db-text-muted:  #4a7c5e;
  --db-shadow:      0 4px 24px rgba(22,163,74,0.09);
  --db-blob-1:      rgba(34,197,94,0.11);
  --db-blob-2:      rgba(21,128,61,0.07);

  min-height: 100vh;
  background-color: var(--db-bg);
  position: relative;
  overflow-x: hidden;
  font-family: 'DM Sans', 'Nunito', sans-serif;
}
.body--dark .db-page {
  --db-bg:         #000000;
  --db-surface:    #0d0d0d;
  --db-surface-alt:#111111;
  --db-border:     #1e4d30;
  --db-text:       #e8fdf0;
  --db-text-muted: #6ee89a;
  --db-shadow:     0 4px 24px rgba(0,0,0,0.55);
  --db-blob-1:     rgba(34,197,94,0.05);
  --db-blob-2:     rgba(74,222,128,0.04);
}

/* ── Blobs ── */
.db-blob {
  position: fixed; border-radius: 50%;
  filter: blur(90px); pointer-events: none; z-index: 0;
}
.db-blob--1 { width: 500px; height: 500px; top: -120px; right: -120px; background: var(--db-blob-1); }
.db-blob--2 { width: 380px; height: 380px; bottom: 60px; left: -80px;  background: var(--db-blob-2); }

/* ── Container ── */
.db-container {
  position: relative; z-index: 1;
  max-width: 960px; margin: 0 auto;
  padding: 32px 16px 56px;
  display: flex; flex-direction: column; gap: 22px;
}

/* ── Header ── */
.db-header {
  display: flex; align-items: center; gap: 16px; margin-bottom: 4px;
}
.db-header__icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--db-accent), var(--db-accent-dark));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 18px rgba(34,197,94,0.32);
}
.db-header__title {
  font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;
  color: var(--db-text); margin: 0; letter-spacing: -0.02em;
}
.db-header__subtitle {
  font-size: 0.875rem; color: var(--db-text-muted); margin: 4px 0 0;
}

/* ── Cards ── */
.db-card {
  background: var(--db-surface);
  border: 1px solid var(--db-border);
  border-radius: 18px;
  padding: 22px 20px;
  box-shadow: var(--db-shadow);
  transition: border-color 0.25s, box-shadow 0.25s;
}
.db-card:hover {
  border-color: var(--db-accent);
  box-shadow: 0 6px 30px rgba(34,197,94,0.12);
}

.db-card__header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px; margin-bottom: 18px;
}
.db-card__title {
  display: flex; align-items: center; gap: 10px;
  font-size: 0.9rem; font-weight: 700; color: var(--db-text);
}
.db-card__title-icon {
  width: 28px; height: 28px; border-radius: 7px;
  background: linear-gradient(135deg, var(--db-accent), var(--db-accent-dark));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(34,197,94,0.25);
}
.db-card__title-icon--amber {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 2px 8px rgba(245,158,11,0.3);
}

/* ── Chips ── */
.db-chip {
  font-size: 0.72rem; font-weight: 700; padding: 4px 12px;
  border-radius: 999px;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  color: var(--db-accent-dark);
}
.body--dark .db-chip { color: var(--db-accent); }
.db-chip--amber {
  background: rgba(245,158,11,0.1);
  border-color: rgba(245,158,11,0.3);
  color: #b45309;
}
.body--dark .db-chip--amber { color: #fbbf24; }

/* ── Rating row ── */
.db-rating-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 18px;
  padding: 14px 16px; border-radius: 12px;
  background: var(--db-surface-alt); border: 1px solid var(--db-border);
}
.db-rating-value {
  font-size: 1.5rem; font-weight: 800; color: var(--db-text);
}
.db-rating-label { font-size: 0.85rem; color: var(--db-text-muted); }

/* ── Filter ── */
.db-filter-row {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 18px;
}
.db-filter-label { font-size: 0.78rem; font-weight: 600; color: var(--db-text-muted); }
.db-filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.db-filter-btn {
  font-size: 0.75rem; font-weight: 600; padding: 5px 12px;
  border-radius: 9px; border: 1px solid var(--db-border);
  background: var(--db-surface-alt); color: var(--db-text-muted);
  cursor: pointer; transition: all 0.15s;
}
.db-filter-btn:hover { border-color: var(--db-accent); color: var(--db-text); }
.db-filter-btn--active {
  background: var(--db-accent) !important;
  border-color: var(--db-accent) !important;
  color: #fff !important;
}

/* ── Distribution ── */
.db-dist { margin-bottom: 20px; }
.db-dist__label {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--db-text-muted); margin-bottom: 8px;
}
.db-dist__row {
  display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
}
.db-dist__stars { font-size: 0.78rem; width: 36px; flex-shrink: 0; }
.db-dist__bar-bg {
  flex: 1; height: 7px; border-radius: 999px;
  background: var(--db-surface-alt); border: 1px solid var(--db-border);
  overflow: hidden;
}
.db-dist__bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--db-accent), var(--db-accent-dark));
  transition: width 0.4s ease;
}
.db-dist__count {
  font-size: 0.75rem; font-weight: 600;
  color: var(--db-text-muted); width: 22px; text-align: right;
}

/* ── Reviews ── */
.db-reviews { max-height: 500px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.db-reviews::-webkit-scrollbar { width: 4px; }
.db-reviews::-webkit-scrollbar-thumb { background: var(--db-border); border-radius: 999px; }

.db-review-item {
  background: var(--db-surface-alt);
  border: 1px solid var(--db-border);
  border-radius: 12px; padding: 14px;
  transition: border-color 0.2s;
}
.db-review-item:hover { border-color: var(--db-accent); }
.db-review-item__header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
}
.db-review-item__avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--db-accent), var(--db-accent-dark));
  color: #fff; font-size: 0.8rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.db-review-item__name { font-size: 0.85rem; font-weight: 700; color: var(--db-text); }
.db-review-item__date { font-size: 0.72rem; color: var(--db-text-muted); }
.db-review-item__stars { margin-left: auto; }
.db-review-item__text { font-size: 0.82rem; color: var(--db-text-muted); margin: 0; line-height: 1.5; }

/* ── Empty ── */
.db-empty {
  display: flex; align-items: center; gap: 12px;
  padding: 24px; border-radius: 12px;
  border: 1px dashed var(--db-border);
  color: var(--db-text-muted); font-size: 0.875rem;
}
</style>
