# El Impostor

Juego social de deducción, palabras y paranoia para grupos. Inspirado en juegos de mesa como "Undercover" y "Spyfall", adaptado para pantalla móvil con mecánicas de revelación por turnos, votación y caos.

## Como jugar

1. **Configurar jugadores**: Agregá jugadores, activá los que van a jugar (el orden de activación define el orden en la partida).
2. **Seleccionar packs**: Elegí una o más categorías de palabras. Los más usados aparecen primero.
3. **Revelar**: Cada jugador pasa el celular y revela su palabra deslizando hacia arriba.
4. **Discutir**: Un jugador random empieza la discusión. Todos debaten quién es el impostor.
5. **Acusar**: Se elige a un jugador. Si se acierta, ganan los inocentes. Si se erra, sigue el juego sin revelar palabras de nuevo.
6. **Resultados**: Se suman puntos y se actualiza la clasificación.

## Features

- **Packs de palabras**: 11 categorías predeterminadas (Animales, Naturaleza, Comida, Vida Cotidiana, Deportes, Escuela, Juegos, Marcas, Lugares, Para Adultos, Trabajos). El admin puede editarlas.
- **Packs públicos**: Subí, editá, borrá y compartí packs con la comunidad. Sistema de likes y descargas.
- **Persistencia en la nube**: Autenticación con Supabase. Jugadores guardados, scores y estadísticas de palabras sincronizadas por cuenta.
- **Estadísticas de palabras**: Sistema de pesos que evita repetir palabras vistas frecuentemente.
- **Modo Caos**: El número de impostores es aleatorio (incluso puede haber cero o todos).
- **Leaderboard**: Clasificación por puntos totales acumulados.
- **PWA**: Listo para instalar como app en Android/iOS.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand (persistencia local)
- Supabase (Auth, Postgres, RLS)
- Framer Motion

## Setup

```bash
npm install
```

Copiá el archivo de entorno:

```bash
cp .env.example .env
```

Editá `.env` con tus credenciales de Supabase.

```bash
npm run dev
```

## Base de datos

El archivo `../supabase/schema_safe.sql` contiene el schema idempotente. Ejecutalo en el SQL Editor de Supabase para crear tablas, políticas RLS, triggers y funciones RPC.

Tablas principales:
- `profiles` — perfiles de usuario
- `saved_players` — jugadores guardados en la nube
- `packs` — packs públicos
- `pack_likes` — likes de packs
- `user_word_stats` — estadísticas de palabras vistas

## Admin

Para convertir un usuario en administrador:

```sql
UPDATE public.profiles SET role = 'admin' WHERE username = 'tu_usuario';
```

Los admins pueden editar los packs predeterminados desde la app.
