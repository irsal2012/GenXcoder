"""
Iterative execution engine for agent loops with feedback mechanisms.
"""

import asyncio
import logging
import time
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

from models.feedback import (
    StructuredFeedback, IterationResult, IterativeLoopResult, 
    FeedbackProcessor, QualityMetrics
)
from agents.base import BaseAgent
from core.events import event_bus, EventType, AgentEvent

class IterativeExecutor:
    """Handles iterative execution of agent loops with feedback."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def execute_iterative_loop(
        self,
        loop_name: str,
        improver_agent: BaseAgent,
        evaluator_agent: BaseAgent,
        initial_input: Any,
        max_iterations: int = 3,
        quality_threshold: float = 85.0,
        timeout_per_iteration: int = 300,
        correlation_id: Optional[str] = None
    ) -> IterativeLoopResult:
        """
        Execute an iterative loop between an improver and evaluator agent.
        
        Args:
            loop_name: Name of the loop for tracking
            improver_agent: Agent that generates/improves content (e.g., python_coder)
            evaluator_agent: Agent that evaluates and provides feedback (e.g., code_reviewer)
            initial_input: Initial input data for the loop
            max_iterations: Maximum number of iterations
            quality_threshold: Quality score threshold to exit loop
            timeout_per_iteration: Timeout in seconds per iteration
            correlation_id: Correlation ID for event tracking
        
        Returns:
            IterativeLoopResult with complete loop execution details
        """
        start_time = time.time()
        iterations = []
        improvement_trend = []
        current_input = initial_input
        final_output = None
        final_quality_score = 0.0
        threshold_met = False
        
        self.logger.info(f"Starting iterative loop '{loop_name}' with max {max_iterations} iterations")
        
        # Publish loop started event
        if correlation_id:
            await event_bus.publish(AgentEvent(
                event_type=EventType.PIPELINE_STARTED,
                source="iterative_executor",
                correlation_id=correlation_id,
                data={
                    "loop_name": loop_name,
                    "max_iterations": max_iterations,
                    "quality_threshold": quality_threshold
                }
            ))
        
        for iteration in range(1, max_iterations + 1):
            self.logger.info(f"Starting iteration {iteration}/{max_iterations} for loop '{loop_name}'")
            
            try:
                # Execute improver agent (e.g., python_coder)
                improver_result = await self._execute_agent_with_timeout(
                    improver_agent,
                    current_input,
                    timeout_per_iteration,
                    f"{loop_name}_improver_iter_{iteration}"
                )
                
                if not improver_result["success"]:
                    # Record failed iteration
                    iterations.append(IterationResult(
                        iteration_number=iteration,
                        agent_type=improver_agent.metadata.name,
                        input_data=current_input,
                        output_data=None,
                        success=False,
                        error_message=improver_result["error"]
                    ))
                    break
                
                # Execute evaluator agent (e.g., code_reviewer)
                evaluator_input = {
                    "code": improver_result["output"],
                    "iteration": iteration,
                    "previous_feedback": iterations[-1].feedback if iterations else None
                }
                
                evaluator_result = await self._execute_agent_with_timeout(
                    evaluator_agent,
                    evaluator_input,
                    timeout_per_iteration,
                    f"{loop_name}_evaluator_iter_{iteration}"
                )
                
                if not evaluator_result["success"]:
                    # Record iteration with improver success but evaluator failure
                    iterations.append(IterationResult(
                        iteration_number=iteration,
                        agent_type=f"{improver_agent.metadata.name}+{evaluator_agent.metadata.name}",
                        input_data=current_input,
                        output_data=improver_result["output"],
                        success=False,
                        error_message=f"Evaluator failed: {evaluator_result['error']}"
                    ))
                    break
                
                # Parse feedback from evaluator
                feedback = self._parse_evaluator_output(
                    evaluator_result["output"],
                    iteration,
                    evaluator_agent.metadata.name
                )
                
                # Record successful iteration
                iteration_result = IterationResult(
                    iteration_number=iteration,
                    agent_type=f"{improver_agent.metadata.name}+{evaluator_agent.metadata.name}",
                    input_data=current_input,
                    output_data=improver_result["output"],
                    feedback=feedback,
                    execution_time=improver_result["execution_time"] + evaluator_result["execution_time"],
                    success=True
                )
                
                iterations.append(iteration_result)
                improvement_trend.append(feedback.quality_score)
                final_output = improver_result["output"]
                final_quality_score = feedback.quality_score
                
                self.logger.info(f"Iteration {iteration} completed. Quality score: {feedback.quality_score:.1f}")
                
                # Check if quality threshold is met
                if feedback.meets_threshold(quality_threshold):
                    threshold_met = True
                    self.logger.info(f"Quality threshold {quality_threshold} met with score {feedback.quality_score:.1f}")
                    break
                
                # Prepare input for next iteration (include feedback)
                if iteration < max_iterations:
                    current_input = {
                        "original_request": initial_input,
                        "current_code": improver_result["output"],
                        "feedback": FeedbackProcessor.format_feedback_for_agent(feedback),
                        "iteration": iteration + 1
                    }
                
            except Exception as e:
                self.logger.error(f"Error in iteration {iteration}: {str(e)}")
                iterations.append(IterationResult(
                    iteration_number=iteration,
                    agent_type=f"{improver_agent.metadata.name}+{evaluator_agent.metadata.name}",
                    input_data=current_input,
                    output_data=None,
                    success=False,
                    error_message=str(e)
                ))
                break
        
        total_execution_time = time.time() - start_time
        
        # Create final result
        result = IterativeLoopResult(
            loop_name=loop_name,
            total_iterations=len(iterations),
            final_quality_score=final_quality_score,
            quality_threshold=quality_threshold,
            threshold_met=threshold_met,
            iterations=iterations,
            final_output=final_output,
            total_execution_time=total_execution_time,
            improvement_trend=improvement_trend
        )
        
        # Publish loop completed event
        if correlation_id:
            await event_bus.publish(AgentEvent(
                event_type=EventType.PIPELINE_COMPLETED,
                source="iterative_executor",
                correlation_id=correlation_id,
                data={
                    "loop_result": result.to_dict(),
                    "threshold_met": threshold_met,
                    "final_quality_score": final_quality_score
                }
            ))
        
        self.logger.info(f"Iterative loop '{loop_name}' completed in {total_execution_time:.2f}s")
        self.logger.info(f"Final quality score: {final_quality_score:.1f}, Threshold met: {threshold_met}")
        
        return result
    
    async def _execute_agent_with_timeout(
        self,
        agent: BaseAgent,
        input_data: Any,
        timeout_seconds: int,
        step_name: str
    ) -> Dict[str, Any]:
        """Execute an agent with timeout protection."""
        start_time = time.time()
        
        try:
            # Execute agent with timeout
            result = await asyncio.wait_for(
                asyncio.create_task(self._execute_agent_async(agent, input_data)),
                timeout=timeout_seconds
            )
            
            execution_time = time.time() - start_time
            
            return {
                "success": True,
                "output": result,
                "execution_time": execution_time,
                "step_name": step_name
            }
            
        except asyncio.TimeoutError:
            execution_time = time.time() - start_time
            error_msg = f"Agent {agent.metadata.name} timed out after {timeout_seconds}s"
            self.logger.error(error_msg)
            
            return {
                "success": False,
                "output": None,
                "execution_time": execution_time,
                "error": error_msg,
                "step_name": step_name
            }
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"Agent {agent.metadata.name} failed: {str(e)}"
            self.logger.error(error_msg)
            
            return {
                "success": False,
                "output": None,
                "execution_time": execution_time,
                "error": error_msg,
                "step_name": step_name
            }
    
    async def _execute_agent_async(self, agent: BaseAgent, input_data: Any) -> Any:
        """Execute agent in async context."""
        # Run the synchronous agent.process in a thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, agent.process, input_data)
    
    def _parse_evaluator_output(
        self,
        evaluator_output: Any,
        iteration_number: int,
        evaluator_name: str
    ) -> StructuredFeedback:
        """
        Parse evaluator output into structured feedback.
        
        This method attempts to extract structured feedback from the evaluator's output.
        If the output is already structured, it uses it directly. Otherwise, it creates
        a basic feedback structure.
        """
        try:
            # If the evaluator returns structured feedback directly
            if isinstance(evaluator_output, dict) and "quality_score" in evaluator_output:
                return self._dict_to_structured_feedback(evaluator_output, iteration_number, evaluator_name)
            
            # If the evaluator returns a StructuredFeedback object
            if isinstance(evaluator_output, StructuredFeedback):
                evaluator_output.iteration_number = iteration_number
                evaluator_output.reviewer_agent = evaluator_name
                evaluator_output.timestamp = datetime.now().isoformat()
                return evaluator_output
            
            # Parse text-based feedback (fallback)
            return self._parse_text_feedback(evaluator_output, iteration_number, evaluator_name)
            
        except Exception as e:
            self.logger.warning(f"Failed to parse evaluator output: {str(e)}")
            # Return default feedback with low quality score
            return StructuredFeedback(
                quality_score=50.0,
                quality_metrics=QualityMetrics(
                    complexity_score=50.0,
                    maintainability_score=50.0,
                    readability_score=50.0,
                    test_coverage=0.0,
                    performance_score=50.0,
                    security_score=50.0
                ),
                suggestions=["Unable to parse detailed feedback"],
                iteration_number=iteration_number,
                reviewer_agent=evaluator_name,
                timestamp=datetime.now().isoformat()
            )
    
    def _dict_to_structured_feedback(
        self,
        feedback_dict: Dict[str, Any],
        iteration_number: int,
        evaluator_name: str
    ) -> StructuredFeedback:
        """Convert dictionary feedback to StructuredFeedback object."""
        quality_metrics = QualityMetrics()
        
        if "quality_metrics" in feedback_dict:
            metrics_dict = feedback_dict["quality_metrics"]
            quality_metrics = QualityMetrics(
                complexity_score=metrics_dict.get("complexity_score", 50.0),
                maintainability_score=metrics_dict.get("maintainability_score", 50.0),
                readability_score=metrics_dict.get("readability_score", 50.0),
                test_coverage=metrics_dict.get("test_coverage", 0.0),
                performance_score=metrics_dict.get("performance_score", 50.0),
                security_score=metrics_dict.get("security_score", 50.0)
            )
        
        return StructuredFeedback(
            quality_score=feedback_dict.get("quality_score", 50.0),
            quality_metrics=quality_metrics,
            issues=[],  # Would need more complex parsing for issues
            suggestions=feedback_dict.get("suggestions", []),
            positive_aspects=feedback_dict.get("positive_aspects", []),
            iteration_number=iteration_number,
            reviewer_agent=evaluator_name,
            timestamp=datetime.now().isoformat()
        )
    
    def _parse_text_feedback(
        self,
        text_output: str,
        iteration_number: int,
        evaluator_name: str
    ) -> StructuredFeedback:
        """Parse text-based feedback into structured format."""
        text = str(text_output).lower()
        
        # Simple heuristic-based quality scoring
        quality_score = 70.0  # Default score
        
        # Adjust score based on keywords
        positive_keywords = ["good", "excellent", "well", "clear", "efficient", "secure"]
        negative_keywords = ["bad", "poor", "unclear", "inefficient", "insecure", "complex"]
        
        positive_count = sum(1 for keyword in positive_keywords if keyword in text)
        negative_count = sum(1 for keyword in negative_keywords if keyword in text)
        
        # Adjust quality score
        quality_score += (positive_count * 5) - (negative_count * 10)
        quality_score = max(0.0, min(100.0, quality_score))
        
        # Extract suggestions (simple approach)
        suggestions = []
        lines = str(text_output).split('\n')
        for line in lines:
            if any(word in line.lower() for word in ["suggest", "recommend", "should", "could", "improve"]):
                suggestions.append(line.strip())
        
        return StructuredFeedback(
            quality_score=quality_score,
            quality_metrics=QualityMetrics(
                complexity_score=quality_score,
                maintainability_score=quality_score,
                readability_score=quality_score,
                test_coverage=max(0.0, quality_score - 20),
                performance_score=quality_score,
                security_score=quality_score
            ),
            suggestions=suggestions[:5],  # Limit to 5 suggestions
            iteration_number=iteration_number,
            reviewer_agent=evaluator_name,
            timestamp=datetime.now().isoformat()
        )

# Global instance
iterative_executor = IterativeExecutor()
