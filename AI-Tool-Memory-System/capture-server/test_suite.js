import fs from 'fs';

async function runTests() {
  const baseUrl = 'http://127.0.0.1:3000/api';
  console.log('--- STARTING TESTS ---');
  
  // 1. Add Category
  let res = await fetch(`${baseUrl}/categories`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestCategory' })
  });
  let data = await res.json();
  console.log('Add Category:', data);
  const catId = data.category.id;

  // 2. Add Tool
  res = await fetch(`${baseUrl}/tools`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://test.com',
      tool: { name: 'TestTool', category: 'TestCategory', description: 'desc', tags: ['test'] }
    })
  });
  data = await res.json();
  console.log('Add Tool:', data);
  const toolId = data.tool.id;

  // 3. Rename Category
  res = await fetch(`${baseUrl}/categories/${catId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestCategoryRenamed' })
  });
  data = await res.json();
  console.log('Rename Category:', data);

  // 4. Verify Tool Category
  res = await fetch(`${baseUrl}/tools`);
  let tools = await res.json();
  const t1 = tools.find(t => t.id === toolId);
  console.log('Tool Category after rename:', t1.category); // Should be TestCategoryRenamed

  // 5. Edit Tool
  res = await fetch(`${baseUrl}/tools/${toolId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestToolRenamed' })
  });
  data = await res.json();
  console.log('Edit Tool:', data);

  // 6. Delete Category
  res = await fetch(`${baseUrl}/categories/${catId}`, {
    method: 'DELETE'
  });
  data = await res.json();
  console.log('Delete Category:', data);

  // 7. Verify Uncategorized Fallback
  res = await fetch(`${baseUrl}/tools`);
  tools = await res.json();
  const t2 = tools.find(t => t.id === toolId);
  console.log('Tool Category after delete:', t2.category); // Should be Uncategorized

  // 8. Test Duplicate
  res = await fetch(`${baseUrl}/tools`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://test.com',
      tool: { name: 'TestTool', category: 'Uncategorized', description: 'desc', tags: ['test'] }
    })
  });
  data = await res.json();
  console.log('Duplicate check:', data.isDuplicate);

  // 9. Delete Tool
  res = await fetch(`${baseUrl}/tools/${toolId}`, { method: 'DELETE' });
  data = await res.json();
  console.log('Delete Tool:', data);

  // 10. Social Analyzer Preview
  res = await fetch(`${baseUrl}/analyze-url`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }) // Just a random video, should trigger fallback
  });
  data = await res.json();
  console.log('Social Analyze (Random YT):', data.error ? data.error : data.tool.name);

}

runTests().catch(console.error);
