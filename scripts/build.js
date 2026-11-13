const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distIndex = path.join(rootDir, 'frontend', 'dist', 'index.html');

// SAFETY FAILSAFE:
// If Render was mistakenly configured with Start Command = 'npm run build',
// Render will pass process.env.PORT during the deploy/runtime phase.
// In that case, we must NOT rebuild or reinstall; we must start the backend server!
if (process.env.PORT && fs.existsSync(distIndex)) {
  console.log(`🚀 Runtime container detected with PORT=${process.env.PORT}`);
  console.log(`✨ Launching TinySteps AI backend server...`);
  const server = spawn('node', ['backend/server.js'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env
  });
  server.on('exit', (code) => process.exit(code || 0));
} else {
  console.log('📦 Starting TinySteps AI production build...');

  // 1. Install backend dependencies
  console.log('\n[1/3] Installing backend dependencies...');
  const backendInstall = spawnSync('npm', ['install', '--prefix', 'backend'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });
  if (backendInstall.status !== 0) {
    console.error('❌ Failed to install backend dependencies');
    process.exit(backendInstall.status || 1);
  }

  // 2. Install frontend dependencies (ensure devDependencies like vite & types are included even in production)
  console.log('\n[2/3] Installing frontend dependencies (including build tools)...');
  const frontendInstall = spawnSync('npm', ['install', '--prefix', 'frontend', '--include=dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });
  if (frontendInstall.status !== 0) {
    console.error('❌ Failed to install frontend dependencies');
    process.exit(frontendInstall.status || 1);
  }

  // 3. Build frontend static assets with Vite
  console.log('\n[3/3] Building frontend assets with Vite...');
  const frontendBuild = spawnSync('npm', ['run', 'build', '--prefix', 'frontend'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });
  if (frontendBuild.status !== 0) {
    console.error('❌ Frontend build failed');
    process.exit(frontendBuild.status || 1);
  }

  console.log('\n✅ Production build completed successfully!');
}

