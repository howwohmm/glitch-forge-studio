import { EnhancedShaderManager } from './enhancedShaderManager';

export async function testShaderSystem() {
  console.log('🚀 Testing Shader System...');
  
  const manager = EnhancedShaderManager.getInstance();
  
  // Load all shaders
  console.log('📦 Loading shaders...');
  await manager.loadAllShaders();
  
  // Get statistics
  const stats = {
    total: manager.getAllShaders().length,
    mobile: manager.getMobileCompatibleShaders().length,
    categories: manager.getCategories().length,
    recommended: manager.getRecommendedShaders(5).length
  };
  
  console.log('📊 Shader Statistics:', stats);
  
  // Test categories
  console.log('📂 Categories:');
  manager.getCategories().forEach(cat => {
    console.log(`  - ${cat.name}: ${cat.shaders.length} shaders`);
  });
  
  // Test recommended shaders
  console.log('⭐ Recommended Shaders:');
  manager.getRecommendedShaders(5).forEach(shader => {
    console.log(`  - ${shader.name} (${shader.category}, ${shader.complexity})`);
  });
  
  // Test performance tier
  console.log(`⚡ Performance Tier: ${manager.getPerformanceTier()}`);
  
  // Test mobile detection
  console.log(`📱 Mobile Optimized: ${manager.getMobileCompatibleShaders().length} shaders`);
  
  console.log('✅ Shader System Test Complete!');
  
  return stats;
}

// Auto-run test in development
if (import.meta.env.DEV) {
  testShaderSystem().catch(console.error);
} 