<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">Mi Negocio</div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <q-card class="bg-primary text-white" to="/negocio/perfil">
          <q-card-section>
            <div class="text-h6">Perfil</div>
            <p>Ver y editar información general</p>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6">
        <q-card class="bg-secondary text-white" to="/negocio/catalogo">
          <q-card-section>
            <div class="text-h6">Catálogo</div>
            <p>Gestionar productos o servicios</p>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6">
        <q-card class="bg-accent text-white" to="/negocio/estadisticas">
          <q-card-section>
            <div class="text-h6">Estadísticas</div>
            <p>Visitas al perfil y catálogo</p>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6">
        <q-card class="bg-info text-white" to="/negocio/resenas">
          <q-card-section>
            <div class="text-h6">Reseñas</div>
            <p>Opiniones de clientes</p>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
</script>
