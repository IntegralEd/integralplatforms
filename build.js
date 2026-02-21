const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  const items = fs.readdirSync(src);
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function deleteRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) deleteRecursive(filePath);
      else fs.unlinkSync(filePath);
    });
    fs.rmdirSync(dirPath);
  }
}

console.log('🏗️  Starting build...\n');

const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  console.log('🧹 Cleaning dist directory...');
  deleteRecursive(distDir);
}
fs.mkdirSync(distDir, { recursive: true });
console.log('✓ Created dist directory\n');

const widgetPath = path.join(__dirname, 'vendor', 'integralthemes', 'components', 'widgets.html');
let widgetHtml = '';
if (fs.existsSync(widgetPath)) {
  widgetHtml = fs.readFileSync(widgetPath, 'utf8');
  console.log('✓ Loaded chat widget for injection\n');
} else {
  console.log('⚠ Chat widget not found\n');
}

console.log('📄 Copying HTML files...');
['index.html'].forEach(file => {
  const srcPath = path.join(__dirname, 'src', file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    let htmlContent = fs.readFileSync(srcPath, 'utf8');
    if (widgetHtml) htmlContent = htmlContent.replace('</body>', `${widgetHtml}\n</body>`);
    fs.writeFileSync(destPath, htmlContent, 'utf8');
    console.log(`  ✓ ${file}${widgetHtml ? ' (with widget)' : ''}`);
  }
});

console.log('\n🎨 Copying CSS files...');
const cssDir = path.join(distDir, 'css');
if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir, { recursive: true });
const srcCssDir = path.join(__dirname, 'src', 'css');
if (fs.existsSync(srcCssDir)) {
  fs.readdirSync(srcCssDir).forEach(file => {
    if (file.endsWith('.backup')) return;
    fs.copyFileSync(path.join(srcCssDir, file), path.join(cssDir, file));
    console.log(`  ✓ css/${file}`);
  });
}

console.log('\n📜 Copying JS files...');
const jsDir = path.join(distDir, 'js');
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir, { recursive: true });
const srcJsDir = path.join(__dirname, 'src', 'js');
if (fs.existsSync(srcJsDir)) {
  fs.readdirSync(srcJsDir).forEach(file => {
    fs.copyFileSync(path.join(srcJsDir, file), path.join(jsDir, file));
    console.log(`  ✓ js/${file}`);
  });
}

console.log('\n📁 Copying assets...');
const assetsDir = path.join(__dirname, 'src', 'assets');
if (fs.existsSync(assetsDir)) {
  const destAssetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(destAssetsDir)) fs.mkdirSync(destAssetsDir, { recursive: true });
  copyRecursive(assetsDir, destAssetsDir);
  console.log('  ✓ Copied assets directory');
} else {
  console.log('  ℹ No assets directory found');
}

console.log('\n🎨 Copying vendored theme...');
const vendorSrcDir = path.join(__dirname, 'vendor', 'integralthemes');
if (fs.existsSync(vendorSrcDir)) {
  const vendorDestDir = path.join(distDir, 'vendor', 'integralthemes');
  fs.mkdirSync(path.join(distDir, 'vendor'), { recursive: true });
  fs.mkdirSync(vendorDestDir, { recursive: true });
  copyRecursive(vendorSrcDir, vendorDestDir);
  console.log('  ✓ vendor/integralthemes/theme/theme.css');
  console.log('  ✓ vendor/integralthemes/assets/brand + icons');
} else {
  console.error('  ❌ ERROR: vendor/integralthemes not found!');
  process.exit(1);
}

console.log('\n✅ Build completed successfully!');
console.log(`📦 Output directory: ${distDir}`);
if (widgetHtml) console.log('   Chat widget injected ✓');
console.log('');
