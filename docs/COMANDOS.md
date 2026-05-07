# 🚀 Comandos Rápidos

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Ejecutar build de producción localmente
npm start

# Linting
npm run lint
```

## Git

```bash
# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit: Polla Futbolera setup"

# Crear rama principal
git branch -M main

# Conectar con GitHub
git remote add origin https://github.com/TU-USUARIO/polla-futbolera.git

# Subir código
git push -u origin main
```

## Vercel Deploy

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login en Vercel
vercel login

# Deploy en preview
vercel

# Deploy en producción
vercel --prod
```

## Supabase CLI (Opcional)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link a tu proyecto
supabase link --project-ref TU-PROJECT-REF

# Pull del schema remoto
supabase db pull

# Push del schema local
supabase db push
```

## Troubleshooting

```bash
# Limpiar cache de Next.js
rm -rf .next

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Verificar versión de Node
node --version  # Debe ser 18+

# Ver logs en tiempo real
npm run dev -- --debug
```

## Variables de Entorno

```bash
# Desarrollo local
.env.local

# Producción (Vercel)
# Configurar en: vercel.com → Project → Settings → Environment Variables
```

## Base de Datos

```bash
# Ejecutar el schema inicial
# Copia el contenido de database/schema.sql
# Pégalo en Supabase Dashboard → SQL Editor → Run

# Verificar tablas creadas
# Supabase Dashboard → Table Editor
```

## Testing Rápido

```bash
# 1. Ejecutar app
npm run dev

# 2. Registrar usuario
# http://localhost:3000/register

# 3. Crear polla
# http://localhost:3000/pool/create

# 4. Obtener código de invitación
# Dashboard → Tu polla → Código

# 5. Probar invitación (ventana incógnito)
# http://localhost:3000/pool/join
```

## Estructura de Archivos Importante

```
.env.local              # Variables de entorno (NO subir a Git)
database/schema.sql     # Schema de la base de datos
src/lib/supabase.ts     # Cliente de Supabase
src/app/                # Páginas y rutas
```

## Comandos de Limpieza

```bash
# Limpiar todo y empezar de cero
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```
