/**
 * DIAGNOSTIC: Test Pug rendering directly
 * Save this as test-pug.js in your project root
 * Run with: node test-pug.js
 */

const pug = require('pug');
const path = require('path');

console.log('🧪 Testing Pug Variable Interpolation\n');

// Test 1: Simple string interpolation
const simpleTemplate = `
h1 Hello #{name}
p School ID: ${school_id}
a(href="/school/${school_id}") Link
`;

console.log('📝 Test 1: Simple Template');
console.log('Template:', simpleTemplate);

const compiled1 = pug.compile(simpleTemplate);
const result1 = compiled1({ name: 'Test', school_id: '123abc' });

console.log('✅ Result:', result1);
console.log('');

// Test 2: Compile actual director_dashboard.pug
console.log('📝 Test 2: Actual Template File');

try {
  const templatePath = path.join(__dirname, 'views', 'dashboard', 'director_dashboard.pug');
  console.log('Template path:', templatePath);
  
  const compiledTemplate = pug.compileFile(templatePath);
  
  const testData = {
    title: 'Test Dashboard',
    school_id: '595647b43e5ea452049f2aa4',
    school_name: 'Test School',
    pic_id: '123',
    pic_name: 'Test User',
    access_lvl: 1,
    is_super_admin: true,
    csrf_token: 'test-token',
    info: {
      students_male: 100,
      students_fem: 90,
      teachers_male: 10,
      teachers_fem: 8,
      admins_male: 2,
      admins_fem: 1,
      classes_ol: 5,
      classes_al: 3,
      courses: 20,
      programs: 5,
      finalists: 10
    }
  };
  
  const html = compiledTemplate(testData);
  
  // Check if school_id is interpolated
  if (html.includes('${school_id}')) {
    console.log('❌ PROBLEM FOUND: Template contains literal ${school_id}');
    console.log('   This means Pug is NOT interpolating the variable!');
  } else if (html.includes('595647b43e5ea452049f2aa4')) {
    console.log('✅ SUCCESS: Template correctly interpolated school_id');
    console.log('   The template itself is fine!');
  } else {
    console.log('⚠️  UNKNOWN: school_id not found in either form');
  }
  
  // Extract a sample link
  const linkMatch = html.match(/href="([^"]*finalists[^"]*)"/);
  if (linkMatch) {
    console.log('🔗 Sample link found:', linkMatch[1]);
  }
  
} catch (err) {
  console.error('❌ Error:', err.message);
}