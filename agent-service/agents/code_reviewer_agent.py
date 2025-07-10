"""
Code Review Agent for analyzing Python code quality, security, and best practices.
"""

import autogen
import json
import re
from typing import Dict, Any
from agents.base import BaseAgent, AgentMetadata, ConfigType
from models.feedback import StructuredFeedback, QualityMetrics, FeedbackIssue, FeedbackType, SeverityLevel
from datetime import datetime


class CodeReviewerAgent(BaseAgent):
    """Agent specialized in reviewing Python code for quality and security."""
    
    @classmethod
    def get_metadata(cls) -> AgentMetadata:
        """Return agent metadata for registration and discovery."""
        return AgentMetadata(
            name="Code Reviewer",
            description="Reviews Python code for quality, security, and best practices",
            capabilities=[
                "Code quality analysis",
                "Security vulnerability detection",
                "Performance optimization suggestions",
                "Best practices enforcement",
                "Code style compliance",
                "Architecture review",
                "Refactoring recommendations"
            ],
            config_type=ConfigType.REVIEW,
            dependencies=["Python Coder"],
            version="2.0.0"
        )
    
    def get_system_message(self) -> str:
        """Get the system message for this agent."""
        return """You are a Code Review Agent specialized in analyzing Python code for quality, security, and best practices.

Your responsibilities:
1. Review Python code for quality, readability, and maintainability
2. Identify security vulnerabilities and potential exploits
3. Suggest performance optimizations and improvements
4. Ensure adherence to Python best practices (PEP 8, SOLID principles)
5. Check for proper error handling and logging
6. Validate code architecture and design patterns
7. Recommend refactoring opportunities

Review Areas:
- Code Quality: Readability, maintainability, complexity
- Security: Input validation, SQL injection, XSS, authentication
- Performance: Algorithm efficiency, memory usage, bottlenecks
- Best Practices: PEP 8, type hints, docstrings, naming conventions
- Architecture: SOLID principles, design patterns, modularity
- Testing: Testability, test coverage considerations
- Documentation: Code comments, docstrings, API documentation

Output Format:
Provide structured feedback in JSON format:
- overall_score: 1-10 rating
- critical_issues: Security vulnerabilities, major bugs
- major_issues: Performance problems, architecture concerns
- minor_issues: Style violations, minor improvements
- suggestions: Specific improvement recommendations
- security_concerns: Detailed security analysis
- performance_notes: Performance optimization opportunities
- best_practices: Adherence to Python standards
- refactoring_opportunities: Code improvement suggestions

Standards:
- Be constructive and specific in feedback
- Prioritize security and critical issues first
- Provide actionable suggestions with examples
- Consider maintainability and scalability
- Reference specific lines or functions when possible"""
    
    def create_agent(self) -> autogen.AssistantAgent:
        """Create and return a configured CodeReviewer agent."""
        return autogen.AssistantAgent(
            name="code_reviewer",
            system_message=self.get_system_message(),
            llm_config=self.llm_config,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=2  # Focused review process
        )
    
    def validate_input(self, input_data: Any) -> Dict[str, Any]:
        """Validate input data for the Code Reviewer agent."""
        issues = []
        warnings = []
        suggestions = []
        
        if not input_data:
            issues.append("No code provided for review")
            return {"is_valid": False, "warnings": warnings, "suggestions": suggestions}
        
        # Check if input contains code
        if isinstance(input_data, str):
            # Look for Python code indicators
            python_keywords = ["def ", "class ", "import ", "from ", "if __name__"]
            if not any(keyword in input_data for keyword in python_keywords):
                warnings.append("Input doesn't appear to contain Python code")
            
            if len(input_data.strip()) < 50:
                warnings.append("Code seems very short for meaningful review")
            
            # Check for common code smells
            code_smells = ["TODO", "FIXME", "HACK", "XXX"]
            if any(smell in input_data.upper() for smell in code_smells):
                suggestions.append("Code contains TODO/FIXME comments that should be addressed")
        
        elif isinstance(input_data, dict):
            if "code" not in input_data and "source" not in input_data:
                suggestions.append("Consider including 'code' or 'source' key in input data")
        
        return {
            "is_valid": len(issues) == 0,
            "warnings": warnings,
            "suggestions": suggestions
        }
    
    def process(self, input_data: Any, context: Dict[str, Any] = None) -> Any:
        """Process code and generate review feedback."""
        # Validate input first
        validation = self.validate_input(input_data)
        if not validation["is_valid"]:
            return StructuredFeedback(
                quality_score=0.0,
                quality_metrics=QualityMetrics(),
                issues=[FeedbackIssue(
                    type=FeedbackType.CODE_QUALITY,
                    severity=SeverityLevel.CRITICAL,
                    message="Invalid input data provided for review"
                )],
                reviewer_agent=self.metadata.name,
                timestamp=datetime.now().isoformat()
            )
        
        # Extract code from input
        code_to_review = self._extract_code_from_input(input_data)
        
        # Perform code analysis
        feedback = self._analyze_code(code_to_review, context)
        
        return feedback
    
    def _extract_code_from_input(self, input_data: Any) -> str:
        """Extract code string from various input formats."""
        if isinstance(input_data, str):
            return input_data
        elif isinstance(input_data, dict):
            # Handle iterative input format
            if "current_code" in input_data:
                return input_data["current_code"]
            elif "code" in input_data:
                return input_data["code"]
            elif "source" in input_data:
                return input_data["source"]
            else:
                return str(input_data)
        else:
            return str(input_data)
    
    def _analyze_code(self, code: str, context: Dict[str, Any] = None) -> StructuredFeedback:
        """Analyze code and return structured feedback."""
        issues = []
        suggestions = []
        positive_aspects = []
        
        # Basic code analysis (this would be enhanced with actual LLM analysis)
        quality_metrics = self._calculate_quality_metrics(code)
        
        # Check for common issues
        issues.extend(self._check_security_issues(code))
        issues.extend(self._check_style_issues(code))
        issues.extend(self._check_performance_issues(code))
        
        # Generate suggestions
        suggestions.extend(self._generate_suggestions(code))
        
        # Find positive aspects
        positive_aspects.extend(self._find_positive_aspects(code))
        
        # Calculate overall quality score
        overall_score = quality_metrics.overall_score()
        
        # Adjust score based on issues
        critical_issues = [issue for issue in issues if issue.severity == SeverityLevel.CRITICAL]
        high_issues = [issue for issue in issues if issue.severity == SeverityLevel.HIGH]
        
        if critical_issues:
            overall_score = min(overall_score, 40.0)
        elif high_issues:
            overall_score = min(overall_score, 70.0)
        
        return StructuredFeedback(
            quality_score=overall_score,
            quality_metrics=quality_metrics,
            issues=issues,
            suggestions=suggestions,
            positive_aspects=positive_aspects,
            reviewer_agent=self.metadata.name,
            timestamp=datetime.now().isoformat()
        )
    
    def _calculate_quality_metrics(self, code: str) -> QualityMetrics:
        """Calculate quality metrics for the code."""
        lines = code.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]
        
        # Basic complexity analysis
        complexity_score = 80.0
        if len(non_empty_lines) > 100:
            complexity_score -= 10.0
        if code.count('if ') + code.count('for ') + code.count('while ') > 10:
            complexity_score -= 15.0
        
        # Maintainability analysis
        maintainability_score = 75.0
        if 'def ' in code:
            maintainability_score += 10.0
        if 'class ' in code:
            maintainability_score += 5.0
        if '"""' in code or "'''" in code:  # Docstrings
            maintainability_score += 10.0
        
        # Readability analysis
        readability_score = 70.0
        if re.search(r'#.*', code):  # Comments
            readability_score += 10.0
        if len([line for line in lines if len(line) > 100]) < len(lines) * 0.1:  # Line length
            readability_score += 10.0
        
        # Test coverage estimation
        test_coverage = 0.0
        if 'test_' in code or 'Test' in code or 'assert' in code:
            test_coverage = 60.0
        
        # Performance score
        performance_score = 75.0
        if 'import numpy' in code or 'import pandas' in code:
            performance_score += 10.0
        if 'for ' in code and 'range(' in code:
            performance_score -= 5.0  # Potential optimization opportunity
        
        # Security score
        security_score = 80.0
        if 'eval(' in code or 'exec(' in code:
            security_score -= 30.0
        if 'input(' in code and 'int(' not in code:
            security_score -= 10.0
        
        return QualityMetrics(
            complexity_score=max(0.0, min(100.0, complexity_score)),
            maintainability_score=max(0.0, min(100.0, maintainability_score)),
            readability_score=max(0.0, min(100.0, readability_score)),
            test_coverage=max(0.0, min(100.0, test_coverage)),
            performance_score=max(0.0, min(100.0, performance_score)),
            security_score=max(0.0, min(100.0, security_score))
        )
    
    def _check_security_issues(self, code: str) -> list[FeedbackIssue]:
        """Check for security issues in the code."""
        issues = []
        
        if 'eval(' in code:
            issues.append(FeedbackIssue(
                type=FeedbackType.SECURITY,
                severity=SeverityLevel.CRITICAL,
                message="Use of eval() function poses security risk",
                suggestion="Replace eval() with safer alternatives like ast.literal_eval() for simple expressions"
            ))
        
        if 'exec(' in code:
            issues.append(FeedbackIssue(
                type=FeedbackType.SECURITY,
                severity=SeverityLevel.CRITICAL,
                message="Use of exec() function poses security risk",
                suggestion="Avoid exec() or implement strict input validation"
            ))
        
        if re.search(r'input\([^)]*\)', code) and 'int(' not in code:
            issues.append(FeedbackIssue(
                type=FeedbackType.SECURITY,
                severity=SeverityLevel.MEDIUM,
                message="Unvalidated user input detected",
                suggestion="Validate and sanitize user input before processing"
            ))
        
        return issues
    
    def _check_style_issues(self, code: str) -> list[FeedbackIssue]:
        """Check for style and formatting issues."""
        issues = []
        lines = code.split('\n')
        
        # Check line length
        long_lines = [i+1 for i, line in enumerate(lines) if len(line) > 100]
        if long_lines:
            issues.append(FeedbackIssue(
                type=FeedbackType.STYLE,
                severity=SeverityLevel.LOW,
                message=f"Lines exceed 100 characters: {long_lines[:3]}{'...' if len(long_lines) > 3 else ''}",
                suggestion="Break long lines for better readability (PEP 8)"
            ))
        
        # Check for missing docstrings
        if 'def ' in code and '"""' not in code and "'''" not in code:
            issues.append(FeedbackIssue(
                type=FeedbackType.MAINTAINABILITY,
                severity=SeverityLevel.MEDIUM,
                message="Functions lack docstrings",
                suggestion="Add docstrings to document function purpose and parameters"
            ))
        
        return issues
    
    def _check_performance_issues(self, code: str) -> list[FeedbackIssue]:
        """Check for potential performance issues."""
        issues = []
        
        # Check for inefficient loops
        if re.search(r'for\s+\w+\s+in\s+range\(len\(', code):
            issues.append(FeedbackIssue(
                type=FeedbackType.PERFORMANCE,
                severity=SeverityLevel.MEDIUM,
                message="Inefficient loop pattern detected",
                suggestion="Use 'for item in list' or 'for i, item in enumerate(list)' instead of range(len())"
            ))
        
        # Check for string concatenation in loops
        if 'for ' in code and '+=' in code and 'str' in code:
            issues.append(FeedbackIssue(
                type=FeedbackType.PERFORMANCE,
                severity=SeverityLevel.MEDIUM,
                message="String concatenation in loop may be inefficient",
                suggestion="Consider using join() or f-strings for better performance"
            ))
        
        return issues
    
    def _generate_suggestions(self, code: str) -> list[str]:
        """Generate improvement suggestions."""
        suggestions = []
        
        if 'import ' not in code and 'from ' not in code:
            suggestions.append("Consider organizing imports at the top of the file")
        
        if 'def ' in code and 'return' not in code:
            suggestions.append("Consider adding return statements to functions for clarity")
        
        if 'class ' in code and '__init__' not in code:
            suggestions.append("Consider adding __init__ method to classes")
        
        if 'print(' in code:
            suggestions.append("Consider using logging instead of print statements for production code")
        
        return suggestions
    
    def _find_positive_aspects(self, code: str) -> list[str]:
        """Find positive aspects of the code."""
        positive = []
        
        if '"""' in code or "'''" in code:
            positive.append("Good use of docstrings for documentation")
        
        if re.search(r'#.*', code):
            positive.append("Code includes helpful comments")
        
        if 'def ' in code:
            positive.append("Code is well-structured with functions")
        
        if 'class ' in code:
            positive.append("Object-oriented design approach")
        
        if 'try:' in code and 'except' in code:
            positive.append("Proper error handling implemented")
        
        return positive