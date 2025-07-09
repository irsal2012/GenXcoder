#!/usr/bin/env python3
"""
Test script to manually save the completed project to backend.
"""

import asyncio
import aiohttp
import json

async def test_backend_save():
    """Test saving the actual project data to backend."""
    
    # This is the actual data from the completed execution
    project_data = {
        "execution_id": "4d7f3163-ca1d-4709-921b-f5c2fc388c70",
        "pipeline_name": "test-03",
        "input_data": "Create a data analysis tool that reads CSV files, performs statistical analysis, generates interactive visualizations, and exports comprehensive reports in PDF format.",
        "status": "completed",
        "started_at": "2025-07-09T15:32:43.071798",
        "completed_at": "2025-07-09T15:32:43.243169",
        "result": {
            "requirement_analyst": {
                "agent": "Requirement Analyst",
                "input_processed": True,
                "requirements_structure": {
                    "functional_requirements": [],
                    "non_functional_requirements": [],
                    "constraints": [],
                    "assumptions": [],
                    "edge_cases": [],
                    "questions": [],
                    "acceptance_criteria": []
                }
            },
            "python_coder": {
                "agent": "Python Coder",
                "success": True,
                "generated_code": {
                    "utility.py": "#!/usr/bin/env python3\n\"\"\"\nCustom Utility Application\nGenerated based on requirements\n\"\"\"\n\nimport logging\nfrom typing import Any, Dict\n\n# Configure logging\nlogging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')\nlogger = logging.getLogger(__name__)\n\n\nclass CustomUtility:\n    \"\"\"A custom utility class based on user requirements.\"\"\"\n    \n    def __init__(self):\n        \"\"\"Initialize the utility.\"\"\"\n        logger.info(\"Custom utility initialized\")\n        self.requirements = \"Data analysis tool requirements\"\n    \n    def process(self, input_data: Any) -> Dict[str, Any]:\n        \"\"\"Process input data according to requirements.\n        \n        Args:\n            input_data: Input data to process\n            \n        Returns:\n            Processed result\n        \"\"\"\n        logger.info(f\"Processing input: {input_data}\")\n        \n        # Basic processing logic - customize based on requirements\n        result = {\n            \"input\": input_data,\n            \"processed\": True,\n            \"requirements\": self.requirements,\n            \"timestamp\": __import__('datetime').datetime.now().isoformat()\n        }\n        \n        logger.info(\"Processing completed\")\n        return result\n    \n    def get_info(self) -> Dict[str, str]:\n        \"\"\"Get information about this utility.\"\"\"\n        return {\n            \"name\": \"Custom Utility\",\n            \"requirements\": self.requirements,\n            \"version\": \"1.0.0\"\n        }\n\n\ndef main():\n    \"\"\"Main function to run the utility.\"\"\"\n    utility = CustomUtility()\n    \n    print(\"Custom Utility Application\")\n    print(f\"Requirements: {utility.requirements}\")\n    print(\"Type 'quit' to exit\")\n    \n    while True:\n        try:\n            user_input = input(\"\\nEnter input: \").strip()\n            \n            if user_input.lower() == 'quit':\n                print(\"Goodbye!\")\n                break\n            \n            result = utility.process(user_input)\n            print(f\"Result: {result}\")\n            \n        except KeyboardInterrupt:\n            print(\"\\nGoodbye!\")\n            break\n        except Exception as e:\n            print(f\"Error: {e}\")\n\n\nif __name__ == \"__main__\":\n    main()\n"
                },
                "requirements": "Data analysis tool requirements",
                "files_created": ["utility.py"]
            },
            "test_generator": {
                "agent": "Test Generator",
                "test_structure": {
                    "unit_tests": [],
                    "integration_tests": [],
                    "edge_case_tests": [],
                    "performance_tests": [],
                    "mock_objects": [],
                    "test_fixtures": [],
                    "test_coverage_target": 90
                }
            },
            "code_reviewer": {
                "quality_score": 69.16666666666667,
                "quality_metrics": {
                    "complexity_score": 80.0,
                    "maintainability_score": 100.0,
                    "readability_score": 80.0,
                    "test_coverage": 0.0,
                    "performance_score": 75.0,
                    "security_score": 80.0
                },
                "issues": [
                    {
                        "type": "style",
                        "severity": "low",
                        "message": "Lines exceed 100 characters: [1]",
                        "line_number": None,
                        "code_snippet": None,
                        "suggestion": "Break long lines for better readability (PEP 8)"
                    }
                ],
                "suggestions": ["Consider using logging instead of print statements for production code"],
                "positive_aspects": [
                    "Good use of docstrings for documentation",
                    "Code includes helpful comments",
                    "Code is well-structured with functions",
                    "Object-oriented design approach",
                    "Proper error handling implemented"
                ]
            },
            "deployment_engineer": {
                "agent": "Deployment Engineer",
                "deployment_structure": {
                    "dockerfile": "",
                    "docker_compose": "",
                    "ci_cd_pipeline": "",
                    "environment_configs": {},
                    "infrastructure_code": "",
                    "monitoring_config": "",
                    "deployment_scripts": [],
                    "security_configs": {}
                }
            },
            "documentation_writer": {
                "agent": "Documentation Writer",
                "documentation_structure": {
                    "readme": "",
                    "api_docs": [],
                    "user_guide": "",
                    "developer_guide": "",
                    "installation_guide": "",
                    "tutorials": [],
                    "changelog": "",
                    "contributing_guide": ""
                }
            },
            "ui_designer": {
                "agent": "UI Designer",
                "ui_structure": {
                    "main_app": "",
                    "components": [],
                    "pages": [],
                    "styling": "",
                    "config": {},
                    "requirements": [],
                    "assets": []
                }
            }
        }
    }
    
    print("🧪 Testing Backend Save with Actual Project Data")
    print("=" * 60)
    
    try:
        async with aiohttp.ClientSession() as session:
            print(f"📤 Sending project data for: {project_data['execution_id']}")
            print(f"📋 Project name: {project_data['pipeline_name']}")
            print(f"📝 Input length: {len(project_data['input_data'])}")
            
            async with session.post(
                "http://localhost:8000/api/v1/projects/save-generated",
                json=project_data,
                timeout=30
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Successfully saved project!")
                    print(f"   Project ID: {result.get('project_id')}")
                    print(f"   Saved path: {result.get('saved_path')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to save project ({response.status}): {error_text}")
                    return False
                    
    except Exception as e:
        print(f"❌ Error saving project: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_backend_save())
    if success:
        print("\n🎉 Project should now be saved in backend/generated_projects/")
    else:
        print("\n⚠️ Project save failed - check the error above")
