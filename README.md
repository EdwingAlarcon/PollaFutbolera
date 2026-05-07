# ⚽ Polla Futbolera

App web para crear pollas de predicciones de fútbol y jugar con amigos. Predice resultados, gana puntos y compite en rankings en tiempo real.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Autenticación**: Email/Password + Google OAuth

## ✨ Características

- 🔐 Autenticación con email o Google
- 🏆 Crear pollas privadas con códigos de invitación
- 👥 Invitar amigos y jugar en grupo
- ⚽ Predecir resultados de partidos
- 📊 Rankings en tiempo real
- 🎯 Sistema de puntuación personalizable
- 📱 Diseño responsive

## 📋 Pre-requisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase (gratis)
- Cuenta de Vercel (gratis, opcional para deploy)

## 🛠️ Setup del Proyecto

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Supabase

#### A. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto
4. Guarda tu URL y anon key

#### B. Configurar Base de Datos

1. En Supabase Dashboard, ve a SQL Editor
2. Copia todo el contenido de `database/schema.sql`
3. Pégalo en el editor y ejecuta (Run)
4. Verifica que las tablas se crearon correctamente

#### C. Configurar Autenticación

**Email/Password:**
- Ya está habilitado por defecto

**Google OAuth (opcional):**
1. En Supabase Dashboard → Authentication → Providers
2. Habilita Google
3. Ve a [Google Cloud Console](https://console.cloud.google.com)
4. Crea un proyecto y habilita Google+ API
5. Crea credenciales OAuth 2.0
6. Agrega la URL de callback de Supabase
7. Copia Client ID y Client Secret a Supabase

### 3. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 🚢 Deploy en Vercel

### Opción 1: Deploy con GitHub

1. Sube tu proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Conecta tu repositorio
4. Agrega las variables de entorno
5. Deploy automático ✅

### Opción 2: Deploy con CLI

```bash
npm install -g vercel
vercel login
vercel
```

Agrega las variables de entorno cuando se te solicite.

## 📁 Estructura del Proyecto

```
polla-futbolera/
├── src/
│   ├── app/                  # Páginas de Next.js
│   │   ├── page.tsx          # Landing page
│   │   ├── register/         # Registro
│   │   ├── login/            # Login
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── pool/             # Páginas de pollas
│   │   └── auth/             # Callback OAuth
│   └── lib/
│       └── supabase.ts       # Cliente de Supabase
├── database/
│   └── schema.sql            # Schema de la base de datos
├── docs/                     # Documentación
│   ├── SETUP_GUIDE.md        # Guía paso a paso
│   ├── COMANDOS.md           # Comandos útiles
│   └── API_INTEGRATION.md    # Integración de APIs
├── package.json
└── README.md
```

## 🎮 Cómo Usar

### Crear una Polla

1. Regístrate o inicia sesión
2. Haz clic en "Crear Nueva Polla"
3. Dale un nombre y selecciona el torneo
4. Comparte el código de invitación con amigos

### Unirse a una Polla

1. Recibe el código de invitación de un amigo
2. Haz clic en "Unirme con Código"
3. Ingresa el código
4. ¡Empieza a predecir!

### Hacer Predicciones

1. Entra a una polla
2. Ve los próximos partidos
3. Ingresa tu predicción antes del inicio
4. Gana puntos cuando aciertes

## 🎯 Sistema de Puntuación

Por defecto:
- **5 puntos**: Resultado exacto (ej: predices 2-1 y sale 2-1)
- **3 puntos**: Diferencia de goles correcta (predices 2-1 y sale 3-2)
- **1 punto**: Ganador/empate correcto (predices victoria local y aciertas)

## 📊 Base de Datos

El proyecto usa PostgreSQL con las siguientes tablas:

- `users`: Perfiles de usuario
- `pools`: Pollas/ligas privadas
- `pool_members`: Membresías (relación many-to-many)
- `matches`: Partidos de fútbol
- `predictions`: Predicciones de usuarios

Ver `database/schema.sql` para el esquema completo.

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Los usuarios solo pueden ver/modificar sus propios datos
- Las predicciones se bloquean automáticamente al inicio del partido
- Validaciones en frontend y backend

## 🚀 Próximas Features

- [ ] Notificaciones push (recordatorios)
- [ ] API de partidos en tiempo real
- [ ] Chat grupal por polla
- [ ] Estadísticas avanzadas
- [ ] Sistema de logros/badges
- [ ] App móvil (React Native)

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'Agregar nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - puedes usar este proyecto libremente.

## � Documentación Adicional

- **[Guía de Setup Detallada](./docs/SETUP_GUIDE.md)** - Instrucciones paso a paso para configurar el proyecto
- **[Comandos Rápidos](./docs/COMANDOS.md)** - Comandos útiles para desarrollo y deployment
- **[Integración de APIs](./docs/API_INTEGRATION.md)** - Cómo integrar APIs de fútbol en tiempo real

## 💡 Soporte

Si tienes problemas:
1. Revisa la [Guía de Setup Detallada](./docs/SETUP_GUIDE.md)
2. Verifica que las variables de entorno estén correctas
3. Asegúrate de haber ejecutado el SQL en Supabase
4. Revisa la consola del navegador para errores

## 🌟 Créditos

Desarrollado con ❤️ para los amantes del fútbol.

---

**¿Listo para crear tu polla?** 🚀
