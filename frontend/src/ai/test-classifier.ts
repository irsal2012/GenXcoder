import { intentClassifier } from './IntentClassifier';

// Test function to validate our AI classifier
export async function testIntentClassifier() {
  console.log('🧠 Testing AI Intent Classifier...');
  
  const testCases = [
    {
      input: "Create a calculator with basic arithmetic operations",
      expected: { projectType: 'calculator', complexity: 'simple' }
    },
    {
      input: "Build a comprehensive todo application with categories, due dates, and user authentication",
      expected: { projectType: 'todo', complexity: 'intermediate' }
    },
    {
      input: "Develop a REST API for managing user accounts with JWT authentication and database integration",
      expected: { projectType: 'api', complexity: 'advanced' }
    },
    {
      input: "Create a data analysis tool that processes CSV files and generates visualizations",
      expected: { projectType: 'data_analysis', complexity: 'intermediate' }
    },
    {
      input: "Make a simple web application with forms and responsive design",
      expected: { projectType: 'web_app', complexity: 'intermediate' }
    }
  ];

  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await intentClassifier.classifyIntent(testCase.input);
      const success = result.intent.projectType === testCase.expected.projectType;
      
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        actual: {
          projectType: result.intent.projectType,
          complexity: result.intent.complexity,
          confidence: result.intent.confidence,
          features: result.intent.features
        },
        success,
        reasoning: result.reasoning
      });
      
      console.log(`${success ? '✅' : '❌'} "${testCase.input}"`);
      console.log(`   Expected: ${testCase.expected.projectType} (${testCase.expected.complexity})`);
      console.log(`   Actual: ${result.intent.projectType} (${result.intent.complexity}) - ${Math.round(result.intent.confidence * 100)}% confidence`);
      console.log(`   Features: ${result.intent.features.join(', ')}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error testing "${testCase.input}":`, error);
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        actual: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const accuracy = (successCount / results.length) * 100;
  
  console.log(`🎯 Test Results: ${successCount}/${results.length} passed (${accuracy.toFixed(1)}% accuracy)`);
  
  return {
    results,
    accuracy,
    successCount,
    totalTests: results.length
  };
}

// Test project template service
export function testProjectTemplates() {
  console.log('📋 Testing Project Template Service...');
  
  const { projectTemplateService } = require('../services/ai/ProjectTemplates');
  
  // Test template retrieval
  const allTemplates = projectTemplateService.getAllTemplates();
  console.log(`✅ Found ${allTemplates.length} templates`);
  
  // Test search functionality
  const calculatorTemplates = projectTemplateService.searchTemplates('calculator');
  console.log(`✅ Calculator search found ${calculatorTemplates.length} templates`);
  
  // Test category retrieval
  const categories = projectTemplateService.getTemplatesByCategory();
  console.log(`✅ Found ${categories.length} template categories`);
  
  // Test recommendation system
  const mockIntent = {
    projectType: 'calculator' as const,
    complexity: 'simple' as const,
    features: ['basic_operations'],
    techStack: ['python'],
    confidence: 0.9,
    needsClarification: false
  };
  
  const recommendations = projectTemplateService.getRecommendedTemplates(mockIntent);
  console.log(`✅ Generated ${recommendations.length} recommendations for calculator project`);
  
  return {
    totalTemplates: allTemplates.length,
    categories: categories.length,
    searchResults: calculatorTemplates.length,
    recommendations: recommendations.length
  };
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Starting AI Component Tests...\n');
  
  const classifierResults = await testIntentClassifier();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const templateResults = testProjectTemplates();
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('📊 Overall Test Summary:');
  console.log(`   Intent Classifier: ${classifierResults.accuracy.toFixed(1)}% accuracy`);
  console.log(`   Template Service: ${templateResults.totalTemplates} templates available`);
  console.log(`   Categories: ${templateResults.categories} template categories`);
  console.log('');
  console.log('🎉 AI Components are ready for use!');
  
  return {
    classifier: classifierResults,
    templates: templateResults
  };
}
