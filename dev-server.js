#!/usr/bin/env node

/**
 * Local Development Server for CaptureCascade Timeline
 *
 * Serves both Hugo static site (root) and React viewer (/viewer)
 * to match the production deployment environment.
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

const HUGO_DIR = path.join(__dirname, 'hugo-site/public');
const VIEWER_DIR = path.join(__dirname, 'timeline/viewer/build');

console.log('\n🚀 Starting CaptureCascade Timeline Development Server...\n');

// Check if builds exist
const hugoExists = fs.existsSync(HUGO_DIR);
const viewerExists = fs.existsSync(VIEWER_DIR);

if (!hugoExists) {
  console.log('⚠️  Hugo build not found. Building Hugo site...');
  buildHugo();
}

if (!viewerExists) {
  console.log('⚠️  React viewer build not found. Building viewer...');
  buildViewer();
}

function buildHugo() {
  console.log('\n📦 Building Hugo static site...\n');
  const hugo = spawn('hugo', [], {
    cwd: path.join(__dirname, 'hugo-site'),
    stdio: 'inherit',
    shell: true
  });

  hugo.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Hugo build complete!\n');
      startServer();
    } else {
      console.error(`❌ Hugo build failed with code ${code}`);
      process.exit(1);
    }
  });
}

function buildViewer() {
  console.log('\n📦 Building React viewer...\n');
  const npm = spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, 'timeline/viewer'),
    stdio: 'inherit',
    shell: true
  });

  npm.on('close', (code) => {
    if (code === 0) {
      console.log('✅ React viewer build complete!\n');
      startServer();
    } else {
      console.error(`❌ React viewer build failed with code ${code}`);
      process.exit(1);
    }
  });
}

function startServer() {
  // Only start server if both builds exist
  if (!fs.existsSync(HUGO_DIR) || !fs.existsSync(VIEWER_DIR)) {
    return;
  }

  // Serve React viewer at /viewer
  app.use('/viewer', express.static(VIEWER_DIR));

  // Handle React viewer routes (SPA fallback)
  app.get('/viewer/*', (req, res) => {
    res.sendFile(path.join(VIEWER_DIR, 'index.html'));
  });

  // Serve Hugo static site at root
  app.use(express.static(HUGO_DIR));

  // Hugo page routes fallback
  app.get('*', (req, res) => {
    // Check if file exists in Hugo build
    const filePath = path.join(HUGO_DIR, req.path);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.sendFile(filePath);
    } else {
      // Try index.html in the directory
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        // 404
        res.status(404).sendFile(path.join(HUGO_DIR, '404.html'));
      }
    }
  });

  app.listen(PORT, () => {
    console.log('\n✨ Development server running!\n');
    console.log(`   Local:            http://localhost:${PORT}`);
    console.log(`   Hugo site:        http://localhost:${PORT}/`);
    console.log(`   React viewer:     http://localhost:${PORT}/viewer`);
    console.log(`   Events (static):  http://localhost:${PORT}/events/`);
    console.log('\n📝 This matches the production deployment structure.\n');
    console.log('   Press Ctrl+C to stop\n');
  });
}

// If both builds already exist, start immediately
if (hugoExists && viewerExists) {
  startServer();
}
