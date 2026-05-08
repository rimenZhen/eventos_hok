<template>
  <q-page padding>
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>
    <div v-else-if="negocioData" class="q-ma-md">
      <div class="text-h5 q-mb-lg">Mi Negocio</div>
      <PerfilNegocio
        v-if="negocioData"
        :negocio="negocioData"
        editLabel="Editar Información"
        editIcon="edit"
        editRoute="/negocio/editar"
        @edit="handleEditClick"
        @view-map="handleViewMap"
      />

      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">Información Adicional</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <p class="text-weight-bold text-grey-8">NIT:</p>
              <p class="text-body2">{{ negocioData?.nit_registro || '-' }}</p>
            </div>
            <div class="col-12 col-sm-6">
              <p class="text-weight-bold text-grey-8">Departamento:</p>
              <p class="text-body2">{{ departamento || '-' }}</p>
            </div>
            <div class="col-12 col-sm-6">
              <p class="text-weight-bold text-grey-8">Distrito:</p>
              <p class="text-body2">{{ distrito || '-' }}</p>
            </div>
            <div class="col-12 col-sm-6">
              <p class="text-weight-bold text-grey-8">Horario:</p>
              <p class="text-body2" v-if="negocioData?.horario">
                <q-btn
                  label="Ver horario"
                  flat
                  dense
                  color="primary"
                  @click="showHorario = !showHorario"
                />
              </p>
              <p class="text-body2" v-else>No especificado</p>
            </div>
          </div>

          <div class="q-mt-md" v-if="showHorario && negocioData?.horario">
            <HorarioSemanal :model-value="negocioData.horario" readonly />
          </div>
        </q-card-section>
      </q-card>

      <q-card class="q-mt-lg" v-if="estadoSolicitud !== 'aprobado'">
        <q-card-section>
          <div class="text-h6 q-mb-md">Estado de Aprobación</div>

          <q-banner v-if="successMessage" class="bg-positive text-white q-mb-md rounded-borders">
            {{ successMessage }}
          </q-banner>

          <div class="row items-center q-col-gutter-md">
            <div class="col">
              <p class="text-body2">
                <span class="text-weight-bold">Estado:</span>
                <q-badge
                  :label="estadoSolicitud === 'aprobado' ? 'Aprobado' : estadoSolicitud === 'pendiente' ? 'Pendiente' : estadoSolicitud === 'observacion' ? 'En observación' : 'Sin solicitud'"
                  :color="
                    estadoSolicitud === 'aprobado' ? 'positive' :
                    estadoSolicitud === 'pendiente' ? 'warning' :
                    estadoSolicitud === 'observacion' ? 'info' :
                    'grey'
                  "
                />
              </p>
            </div>
            <div class="col-auto" v-if="estadoSolicitud === 'sin_solicitud' || estadoSolicitud === 'rechazado'">
              <q-btn
                :label="bottonLabel"
                color="primary"
                @click="handleSendApproval"
                :disable="!canSendApproval"
                :loading="sending"
              />
              <p v-if="!canSendApproval" class="text-caption text-orange q-mt-sm">
                ⚠ Completa el campo "Distrito" en tu perfil antes de enviar la solicitud
              </p>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <div v-else class="text-red q-ma-md">No se pudo cargar la información del negocio.</div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { negocioAPI } from 'src/api/negocio'
import { usuariosAPI } from 'src/api/usuarios'
import PerfilNegocio from 'src/components/negocio/PerfilNegocio.vue'
import HorarioSemanal from 'src/components/HorarioSemanal.vue'


const auth = useAuthStore()
const router = useRouter()
const configStore = useConfiguracionStore()
const negocio = ref(null)
const loading = ref(true)
const showHorario = ref(false)
const sending = ref(false)
const successMessage = ref('')

// Helpers para obtener clave real de valores que pueden ser objetos (QSelect)
const getValue = (val) => {
  if (!val) return null
  if (typeof val === 'object') return val.value || val.clave || null
  return val
}

// Obtener nombres a partir de las claves
const departamento = computed(() => {
  const clave = getValue(negocio.value?.departamento)
  return configStore.getDepartamentoNombre(clave)
})

const distrito = computed(() => {
  const clave = getValue(negocio.value?.distrito) || getValue(negocio.value?.municipio)
  return configStore.getDistritoNombre(clave)
})

const estadoSolicitud = computed(() => {
  return negocio.value?.estado_solicitud || 'sin_solicitud'
})

const negocioData = computed(() => {
  return negocio.value
})

const canSendApproval = computed(() => {
  return distrito.value && distrito.value.trim() !== ''
})

const bottonLabel = computed(() => {
  const fueRechazado = negocio.value?.fue_rechazado || false
  return fueRechazado ? 'Apelar solicitud' : 'Enviar solicitud a la alcaldía'
})

const handleEditClick = () => router.push('/negocio/editar')
const handleViewMap = () => {}

const handleSendApproval = async () => {
  if (!canSendApproval.value) return
  sending.value = true
  try {
    // Enviar solicitud usando el userId del propietario
    await usuariosAPI.submitNegocioApprovalRequest(auth.user._id)
    successMessage.value = 'Solicitud de aprobación enviada a la alcaldía'
    setTimeout(() => { successMessage.value = '' }, 3000)
    await cargarDatos()
  } catch (e) {
    console.error('Error al enviar solicitud:', e)
  } finally {
    sending.value = false
  }
}

const cargarDatos = async () => {
  try {
    negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
  } catch (e) {
    console.error('Error al cargar negocio:', e)
    negocio.value = null
  }
}

onMounted(async () => {
  try {
    if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()
    await cargarDatos()
  } finally {
    loading.value = false
  }
})
</script>
