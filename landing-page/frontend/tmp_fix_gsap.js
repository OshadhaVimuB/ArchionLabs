const fs = require('fs');
const path = require('path');

const filesToFix = [
  'components/Team.tsx',
  'components/Services.tsx',
  'components/Pricing.tsx',
  'components/Portfolio.tsx',
  'components/Hero.tsx',
  'components/Footer.tsx',
  'components/About.tsx',
  'components/SplashScreen.tsx'
];

const basePath = path.join(__dirname, 'src');

filesToFix.forEach(relPath => {
  const filePath = path.join(basePath, relPath);
  if (!fs.existsSync(filePath)) {
    console.log('Skipping', filePath);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace import { useEffect } from "react" with import { useEffect } from "react"; import { useGSAP } from "@gsap/react"
  if (!content.includes('useGSAP')) {
    content = content.replace(/import\s+\{([^}]*useEffect[^}]*)\}\s+from\s+["']react["'];?/, (match, p1) => {
      return `${match}\nimport { useGSAP } from "@gsap/react";`;
    });
  }
  
  // Replace useEffect(() => { with useGSAP(() => {
  content = content.replace(/useEffect\(\(\)\s*=>\s*\{/g, 'useGSAP(() => {');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed', filePath);
});
