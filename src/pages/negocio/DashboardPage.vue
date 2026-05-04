
<template>
	<q-page padding>
		<div class="dashboard-container">
			<!-- Título de la página -->
			<div class="q-mb-lg">
				<h1 class="text-h4 text-weight-bold q-ma-none">Dashboard del Negocio</h1>
				<p class="text-grey q-mt-sm">Visualiza y gestiona tu catálogo, estadísticas y reseñas</p>
			</div>

			<!-- Layout principal: Catálogo a la izquierda, Estadísticas y Reseñas a la derecha -->
			<div class="row q-col-gutter-lg">
				<!-- Columna izquierda: Catálogo -->
				<div class="col-12 ">
					<q-card flat bordered class="card-adaptable">
						<q-card-section>
							<div class="row items-center q-mb-md">
								<q-icon name="shopping_bag" size="24px" color="primary" class="q-mr-sm" />
								<div class="text-h6 text-weight-bold">Mi Catálogo</div>
								<q-space />
								<q-chip
									v-if="negocio?.catalogo"
									dense
									outline
									color="primary"
									:label="`${negocio.catalogo.length} productos`"
								/>
							</div>
							<Catalogo />
						</q-card-section>
					</q-card>
				</div>

				<!-- Columna derecha: Estadísticas y Reseñas -->
				<div class="col-12 ">
					<q-card flat bordered class="card-adaptable q-mb-lg">
						<q-card-section>
							<Estadisticas :negocio="negocio" />
						</q-card-section>
					</q-card>

					<!-- Reseñas con Filtro -->
					<q-card flat bordered class="card-adaptable">
						<q-card-section>
							<div class="row items-center q-mb-md">
								<q-icon name="star" size="24px" color="amber" class="q-mr-sm" />
								<div class="text-h6 text-weight-bold">Reseñas de Clientes</div>
								<q-space />
								<q-chip
									v-if="negocio?.reseñas"
									dense
									outline
									color="amber"
									:label="`${negocio.reseñas.length} total`"
								/>
							</div>

							<!-- Calificación Promedio -->
							<div class="row items-center q-mb-lg">
								<q-rating 
									:model-value="Math.round(negocio?.calificacion_promedio || 0)" 
									readonly 
									size="1.5em" 
									color="amber" 
								/>
								<span class="q-ml-sm text-subtitle2 text-weight-bold">{{ (negocio?.calificacion_promedio || 0).toFixed(1) }}</span>
							</div>

							<!-- Filtro por Puntaje -->
							<div v-if="negocio?.reseñas?.length" class="q-mb-md">
								<div class="text-caption text-weight-bold q-mb-sm">Filtrar por puntaje:</div>
								<div class="row q-gutter-xs">
									<q-btn
										v-for="stars in [0, 5, 4, 3, 2, 1]"
										:key="stars"
										flat
										dense
										size="sm"
										:color="filtroEstrellas === stars ? 'primary' : 'grey-8'"
										:outline="filtroEstrellas === stars"
										@click="filtroEstrellas = stars"
									>
										<span v-if="stars === 0">Todas</span>
										<span v-else>
											{{ stars }}
											<q-icon name="star" size="16px" />
										</span>
									</q-btn>
								</div>
							</div>

							<!-- Distribución de Reseñas -->
							<div v-if="negocio?.reseñas?.length" class="q-mb-md">
								<div class="text-caption text-weight-bold q-mb-xs">Distribución:</div>
								<div v-for="stars in [5, 4, 3, 2, 1]" :key="stars" class="row items-center q-mb-xs">
									<span class="text-caption" style="width: 30px">{{ stars }} ⭐</span>
									<q-linear-progress 
										:value="(contarPorEstrellas[stars] || 0) / negocio.reseñas.length" 
										color="amber"
										class="col q-mx-sm"
						style="height: 6px"
									/>
									<span class="text-caption" style="width: 30px">{{ contarPorEstrellas[stars] || 0 }}</span>
								</div>
							</div>

							<!-- Lista de Reseñas Filtradas -->
							<div v-if="resenasFiltradas?.length" class="resenas-filtradas">
								<div v-for="(res, idx) in resenasFiltradas" :key="idx" class="q-mb-sm">
									<q-card flat bordered class="bg-grey-1">
										<q-card-section class="q-pa-sm">
											<div class="row items-center q-mb-xs">
												<q-rating :model-value="res.calificacion" readonly size="1em" color="amber" />
												<span class="q-ml-xs text-caption text-weight-bold">{{ res.usuario_nombres }}</span>
											</div>
											<div class="text-caption text-grey q-mb-xs">{{ formatDate(res.fecha) }}</div>
											<div class="text-caption">{{ res.comentario }}</div>
										</q-card-section>
									</q-card>
								</div>
							</div>
							<div v-else-if="negocio?.reseñas?.length" class="text-grey q-pa-md text-center border-dashed rounded-borders">
								<q-icon name="filter_list" size="24px" class="q-mb-sm" />
								<div>No hay reseñas con este puntaje</div>
							</div>
							<div v-else class="text-grey q-pa-md text-center border-dashed rounded-borders">
								<q-icon name="rate_review" size="32px" class="q-mb-sm" />
								<div>Aún no hay reseñas. ¡Espera que tus clientes compartan su experiencia!</div>
							</div>
						</q-card-section>
					</q-card>
				</div>
			</div>
		</div>
	</q-page>
</template>

<script setup>
import Catalogo from 'src/components/negocio/Catalogo.vue'
import Estadisticas from 'src/components/negocio/Estadisticas.vue'
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { negocioAPI } from 'src/api/negocio'

const auth = useAuthStore()
const negocio = ref(null)
const filtroEstrellas = ref(0) // 0 = todas, 1-5 = estrellas específicas

// Reseñas filtradas por los puntajes seleccionados
const resenasFiltradas = computed(() => {
	if (!negocio.value?.reseñas?.length) return []
	if (filtroEstrellas.value === 0) {
		return negocio.value.reseñas.slice().reverse()
	}
	return negocio.value.reseñas
		.filter(res => res.calificacion === filtroEstrellas.value)
		.reverse()
})

// Contar reseñas por cada calificación
const contarPorEstrellas = computed(() => {
	const conteo = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
	if (negocio.value?.reseñas?.length) {
		negocio.value.reseñas.forEach(res => {
			if (Object.prototype.hasOwnProperty.call(conteo, res.calificacion)) {
				conteo[res.calificacion]++
			}
		})
	}
	return conteo
})

function formatDate(fecha) {
	if (!fecha) return '-'
	const date = new Date(fecha)
	return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
	try {
		negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
	} catch (err) {
		console.warn('No se pudo cargar negocio para dashboard', err)
	}
})
</script>

<style scoped>
.dashboard-container {
	max-width: 1400px;
	margin: 0 auto;
}

.card-adaptable {
	background-color: white;
	color: #1d1d1d;
	border-radius: 12px;
}

.body--dark .card-adaptable {
	background-color: #1d1d1d;
	color: white;
}

.resenas-list {
	max-height: 400px;
	overflow-y: auto;
}

.resenas-filtradas {
	max-height: 500px;
	overflow-y: auto;
}

.body--dark .bg-grey-1 {
	background-color: #2d2d2d !important;
}

.border-dashed {
	border: 1px dashed currentColor;
}
</style>


