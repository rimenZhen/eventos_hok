<template>
  <q-page padding class="sobrenosotros-page">
    <div class="text-center q-mb-lg">
      <h2 class="text-h4 text-weight-bolder">Sobre Nosotros</h2>
      <div class="title-underline"></div>
    </div>

    <!-- ¿Quiénes somos? -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">¿Quiénes somos?</div>
        <p>
          <strong>El Salvador Turismo</strong> es una plataforma digital que conecta a viajeros, locales,
          alcaldías y negocios para promover el turismo sostenible en El Salvador...
        </p>
        <div class="text-h6 q-mt-md">Nuestra misión</div>
        <p>Impulsar la economía local mediante el turismo inteligente...</p>
      </q-card-section>
    </q-card>

    <!-- Equipo de desarrollo (6 integrantes) -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6 text-center q-mb-md">Equipo de desarrollo</div>
        <div class="row q-col-gutter-md justify-center">
          <div v-for="miembro in equipo" :key="miembro.nombre" class="col-6 col-sm-4 col-md-3">
            <div class="text-center">
              <q-avatar size="100px" class="q-mb-sm">
                <template v-if="miembro.foto">
                  <img :src="miembro.foto" :alt="miembro.nombre" style="object-fit: cover;">
                </template>
                <q-icon v-else name="person" color="primary" size="60px" />
              </q-avatar>
              <div class="text-subtitle1 text-weight-bold">{{ miembro.nombre }}</div>
              <div class="text-caption text-grey">{{ miembro.rol || 'Desarrollador' }}</div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Contacto -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">Contacto</div>
        <p>✉️ info@elsalvadorturismo.com<br>📞 +503 2222-3333<br>📍 San Salvador, El Salvador</p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const equipo = ref([
  { nombre: 'Carlos Hernandez', foto: '', rol: 'Frontend Lead' },
  { nombre: 'Brandon Cartagena', foto: '', rol: 'Backend Developer' },
  { nombre: 'Marvin Lemus', foto: '', rol: 'UI/UX Designer' },
  { nombre: 'Jose Luna', foto: '', rol: 'Database Admin' },
  { nombre: 'Andrea Soriano', foto: '', rol: 'QA Tester' },
  { nombre: 'Edwin Herrera', foto: '', rol: 'DevOps Engineer' }
])
</script>

<style scoped>
.sobrenosotros-page {
  max-width: 1200px;
  margin: 0 auto;
}
.title-underline {
  width: 80px;
  height: 4px;
  background: var(--q-color-primary);
  margin: 0.5rem auto 0;
  border-radius: 2px;
}
</style>
