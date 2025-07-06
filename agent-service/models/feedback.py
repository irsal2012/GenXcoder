"""
Feedback data structures for iterative agent communication.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum

class FeedbackType(Enum):
    """Types of feedback that can be provided."""
    CODE_QUALITY = "code_quality"
    FUNCTIONALITY = "functionality"
    PERFORMANCE = "performance"
    SECURITY = "security"
    MAINTAINABILITY = "maintainability"
    STYLE = "style"

class SeverityLevel(Enum):
    """Severity levels for feedback issues."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

@dataclass
class FeedbackIssue:
    """Individual feedback issue or suggestion."""
    type: FeedbackType
    severity: SeverityLevel
    message: str
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None
    suggestion: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "type": self.type.value,
            "severity": self.severity.value,
            "message": self.message,
            "line_number": self.line_number,
            "code_snippet": self.code_snippet,
            "suggestion": self.suggestion
        }

@dataclass
class QualityMetrics:
    """Code quality metrics."""
    complexity_score: float = 0.0  # 0-100, higher is better
    maintainability_score: float = 0.0  # 0-100, higher is better
    readability_score: float = 0.0  # 0-100, higher is better
    test_coverage: float = 0.0  # 0-100 percentage
    performance_score: float = 0.0  # 0-100, higher is better
    security_score: float = 0.0  # 0-100, higher is better
    
    def overall_score(self) -> float:
        """Calculate overall quality score."""
        scores = [
            self.complexity_score,
            self.maintainability_score,
            self.readability_score,
            self.test_coverage,
            self.performance_score,
            self.security_score
        ]
        return sum(scores) / len(scores) if scores else 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "complexity_score": self.complexity_score,
            "maintainability_score": self.maintainability_score,
            "readability_score": self.readability_score,
            "test_coverage": self.test_coverage,
            "performance_score": self.performance_score,
            "security_score": self.security_score,
            "overall_score": self.overall_score()
        }

@dataclass
class StructuredFeedback:
    """Structured feedback from reviewer agents."""
    quality_score: float  # 0-100 overall quality score
    quality_metrics: QualityMetrics
    issues: List[FeedbackIssue] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    positive_aspects: List[str] = field(default_factory=list)
    iteration_number: int = 1
    reviewer_agent: str = ""
    timestamp: Optional[str] = None
    
    def meets_threshold(self, threshold: float) -> bool:
        """Check if quality score meets the given threshold."""
        return self.quality_score >= threshold
    
    def get_critical_issues(self) -> List[FeedbackIssue]:
        """Get only critical and high severity issues."""
        return [issue for issue in self.issues 
                if issue.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH]]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "quality_score": self.quality_score,
            "quality_metrics": self.quality_metrics.to_dict(),
            "issues": [issue.to_dict() for issue in self.issues],
            "suggestions": self.suggestions,
            "positive_aspects": self.positive_aspects,
            "iteration_number": self.iteration_number,
            "reviewer_agent": self.reviewer_agent,
            "timestamp": self.timestamp
        }

@dataclass
class IterationResult:
    """Result of a single iteration in an iterative loop."""
    iteration_number: int
    agent_type: str
    input_data: Any
    output_data: Any
    feedback: Optional[StructuredFeedback] = None
    execution_time: float = 0.0
    success: bool = True
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "iteration_number": self.iteration_number,
            "agent_type": self.agent_type,
            "input_data": str(self.input_data)[:500] + "..." if len(str(self.input_data)) > 500 else str(self.input_data),
            "output_data": str(self.output_data)[:500] + "..." if len(str(self.output_data)) > 500 else str(self.output_data),
            "feedback": self.feedback.to_dict() if self.feedback else None,
            "execution_time": self.execution_time,
            "success": self.success,
            "error_message": self.error_message
        }

@dataclass
class IterativeLoopResult:
    """Complete result of an iterative loop execution."""
    loop_name: str
    total_iterations: int
    final_quality_score: float
    quality_threshold: float
    threshold_met: bool
    iterations: List[IterationResult] = field(default_factory=list)
    final_output: Any = None
    total_execution_time: float = 0.0
    improvement_trend: List[float] = field(default_factory=list)  # Quality scores over iterations
    
    def get_quality_improvement(self) -> float:
        """Calculate quality improvement from first to last iteration."""
        if len(self.improvement_trend) < 2:
            return 0.0
        return self.improvement_trend[-1] - self.improvement_trend[0]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "loop_name": self.loop_name,
            "total_iterations": self.total_iterations,
            "final_quality_score": self.final_quality_score,
            "quality_threshold": self.quality_threshold,
            "threshold_met": self.threshold_met,
            "iterations": [iteration.to_dict() for iteration in self.iterations],
            "final_output": str(self.final_output)[:1000] + "..." if len(str(self.final_output)) > 1000 else str(self.final_output),
            "total_execution_time": self.total_execution_time,
            "improvement_trend": self.improvement_trend,
            "quality_improvement": self.get_quality_improvement()
        }

class FeedbackProcessor:
    """Utility class for processing and analyzing feedback."""
    
    @staticmethod
    def aggregate_feedback(feedback_list: List[StructuredFeedback]) -> StructuredFeedback:
        """Aggregate multiple feedback instances into one."""
        if not feedback_list:
            return StructuredFeedback(
                quality_score=0.0,
                quality_metrics=QualityMetrics()
            )
        
        # Calculate average quality score
        avg_quality_score = sum(f.quality_score for f in feedback_list) / len(feedback_list)
        
        # Aggregate quality metrics
        avg_metrics = QualityMetrics(
            complexity_score=sum(f.quality_metrics.complexity_score for f in feedback_list) / len(feedback_list),
            maintainability_score=sum(f.quality_metrics.maintainability_score for f in feedback_list) / len(feedback_list),
            readability_score=sum(f.quality_metrics.readability_score for f in feedback_list) / len(feedback_list),
            test_coverage=sum(f.quality_metrics.test_coverage for f in feedback_list) / len(feedback_list),
            performance_score=sum(f.quality_metrics.performance_score for f in feedback_list) / len(feedback_list),
            security_score=sum(f.quality_metrics.security_score for f in feedback_list) / len(feedback_list)
        )
        
        # Combine all issues and suggestions
        all_issues = []
        all_suggestions = []
        all_positive_aspects = []
        
        for feedback in feedback_list:
            all_issues.extend(feedback.issues)
            all_suggestions.extend(feedback.suggestions)
            all_positive_aspects.extend(feedback.positive_aspects)
        
        return StructuredFeedback(
            quality_score=avg_quality_score,
            quality_metrics=avg_metrics,
            issues=all_issues,
            suggestions=list(set(all_suggestions)),  # Remove duplicates
            positive_aspects=list(set(all_positive_aspects)),  # Remove duplicates
            reviewer_agent="aggregated"
        )
    
    @staticmethod
    def format_feedback_for_agent(feedback: StructuredFeedback) -> str:
        """Format feedback into a readable string for agent consumption."""
        formatted = f"Code Review Feedback (Quality Score: {feedback.quality_score:.1f}/100)\n\n"
        
        if feedback.positive_aspects:
            formatted += "✅ Positive Aspects:\n"
            for aspect in feedback.positive_aspects:
                formatted += f"  • {aspect}\n"
            formatted += "\n"
        
        if feedback.issues:
            formatted += "⚠️ Issues to Address:\n"
            for issue in feedback.issues:
                severity_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🔵", "info": "ℹ️"}
                icon = severity_icon.get(issue.severity.value, "•")
                formatted += f"  {icon} [{issue.type.value.upper()}] {issue.message}\n"
                if issue.suggestion:
                    formatted += f"    💡 Suggestion: {issue.suggestion}\n"
                if issue.code_snippet:
                    formatted += f"    📝 Code: {issue.code_snippet}\n"
            formatted += "\n"
        
        if feedback.suggestions:
            formatted += "💡 General Suggestions:\n"
            for suggestion in feedback.suggestions:
                formatted += f"  • {suggestion}\n"
            formatted += "\n"
        
        # Add quality metrics summary
        metrics = feedback.quality_metrics
        formatted += f"📊 Quality Metrics:\n"
        formatted += f"  • Complexity: {metrics.complexity_score:.1f}/100\n"
        formatted += f"  • Maintainability: {metrics.maintainability_score:.1f}/100\n"
        formatted += f"  • Readability: {metrics.readability_score:.1f}/100\n"
        formatted += f"  • Test Coverage: {metrics.test_coverage:.1f}%\n"
        formatted += f"  • Performance: {metrics.performance_score:.1f}/100\n"
        formatted += f"  • Security: {metrics.security_score:.1f}/100\n"
        
        return formatted
