"""
Improved Agent Manager using factory pattern and event-driven architecture.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from core.agent_factory import agent_factory
from core.events import event_bus, EventType, AgentEvent, publish_agent_started, publish_agent_completed, publish_agent_failed
from config.pipeline_config import pipeline_config_manager, PipelineConfig, ExecutionMode
from core.iterative_executor import iterative_executor
from core.backend_client import backend_client
from models.feedback import IterativeLoopResult
from agents.base import BaseAgent
import time
from datetime import datetime

class AgentManagerV2:
    """
    Improved agent manager with dynamic agent creation, event-driven communication,
    and configuration-driven pipeline execution.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._active_agents: Dict[str, BaseAgent] = {}
        self._pipeline_config: Optional[PipelineConfig] = None
        self._execution_context: Dict[str, Any] = {}
        self._progress_data: Dict[str, Any] = {}
        self._start_time: Optional[float] = None
        
        # Auto-discover agents on initialization
        self._discover_agents()
        
        # Subscribe to agent events for progress tracking
        event_bus.subscribe(EventType.AGENT_COMPLETED, self._on_agent_completed)
        event_bus.subscribe(EventType.AGENT_FAILED, self._on_agent_failed)
    
    def _discover_agents(self):
        """Discover and register all available agents."""
        try:
            discovered_count = agent_factory.auto_discover_agents()
            self.logger.info(f"Discovered {discovered_count} agents")
            
            # Validate dependencies
            dependency_issues = agent_factory.validate_dependencies()
            if dependency_issues:
                self.logger.warning(f"Agent dependency issues found: {dependency_issues}")
            
        except Exception as e:
            self.logger.error(f"Failed to discover agents: {str(e)}")
    
    def initialize_pipeline(self, pipeline_name: str = "default") -> bool:
        """
        Initialize agents for a specific pipeline configuration.
        Returns True if successful, False otherwise.
        """
        try:
            # Load pipeline configuration
            self._pipeline_config = pipeline_config_manager.get_pipeline_config(pipeline_name)
            self.logger.info(f"Loaded pipeline configuration: {self._pipeline_config.name}")
            
            # Clear existing agents
            self._active_agents.clear()
            
            # Create agents based on pipeline configuration
            for step in self._pipeline_config.steps:
                if step.is_iterative():
                    # For iterative steps, initialize both improver and evaluator agents
                    iter_config = step.iterative_config
                    
                    # Initialize improver agent
                    try:
                        improver_agent = agent_factory.create_agent(iter_config.improver_agent)
                        self._active_agents[iter_config.improver_agent] = improver_agent
                        self.logger.info(f"Initialized improver agent: {improver_agent.metadata.name}")
                    except Exception as e:
                        self.logger.error(f"Failed to initialize improver agent {iter_config.improver_agent}: {str(e)}")
                        if not step.optional:
                            return False
                    
                    # Initialize evaluator agent
                    try:
                        evaluator_agent = agent_factory.create_agent(iter_config.evaluator_agent)
                        self._active_agents[iter_config.evaluator_agent] = evaluator_agent
                        self.logger.info(f"Initialized evaluator agent: {evaluator_agent.metadata.name}")
                    except Exception as e:
                        self.logger.error(f"Failed to initialize evaluator agent {iter_config.evaluator_agent}: {str(e)}")
                        if not step.optional:
                            return False
                else:
                    # Regular step - initialize single agent
                    agent_key = step.agent_type
                    
                    try:
                        # Create agent using factory
                        agent = agent_factory.create_agent(agent_key)
                        self._active_agents[agent_key] = agent
                        
                        self.logger.info(f"Initialized agent: {agent.metadata.name}")
                        
                    except Exception as e:
                        self.logger.error(f"Failed to initialize agent {agent_key}: {str(e)}")
                        if not step.optional:
                            return False
            
            # Initialize progress tracking
            self._initialize_progress_tracking()
            
            self.logger.info(f"Successfully initialized {len(self._active_agents)} agents for pipeline '{pipeline_name}'")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize pipeline '{pipeline_name}': {str(e)}")
            return False
    
    def _initialize_progress_tracking(self):
        """Initialize progress tracking data structure."""
        if not self._pipeline_config:
            return
        
        steps = []
        for step in self._pipeline_config.steps:
            agent = self._active_agents.get(step.agent_type)
            step_info = {
                'name': agent.metadata.name if agent else step.agent_type,
                'description': agent.metadata.description if agent else f"Execute {step.agent_type}",
                'status': 'pending',
                'progress_percentage': 0,
                'agent_type': step.agent_type,
                'optional': step.optional
            }
            steps.append(step_info)
        
        self._progress_data = {
            'total_steps': len(self._pipeline_config.steps),
            'completed_steps': 0,
            'failed_steps': 0,
            'progress_percentage': 0.0,
            'steps': steps,
            'elapsed_time': 0.0,
            'estimated_remaining_time': 0.0,
            'is_running': False,
            'is_completed': False,
            'has_failures': False,
            'current_step_info': None,
            'logs': []
        }
    
    async def execute_pipeline(self, input_data: Any, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute the configured pipeline with the given input data.
        Returns the final result or error information.
        """
        if not self._pipeline_config:
            raise ValueError("No pipeline configuration loaded. Call initialize_pipeline() first.")
        
        if not correlation_id:
            correlation_id = event_bus.create_correlation_id()
        
        self._start_time = time.time()
        self._progress_data['is_running'] = True
        self._progress_data['is_completed'] = False
        self._progress_data['has_failures'] = False
        
        try:
            self.logger.info(f"Starting pipeline execution: {self._pipeline_config.name}")
            
            # Publish pipeline started event
            await event_bus.publish(AgentEvent(
                event_type=EventType.PIPELINE_STARTED,
                source="agent_manager_v2",
                correlation_id=correlation_id,
                data={"pipeline_name": self._pipeline_config.name, "input_data": input_data}
            ))
            
            # Get execution order
            execution_order = self._pipeline_config.get_execution_order()
            self.logger.info(f"Execution order: {execution_order}")
            
            # Execute steps in order
            current_data = input_data
            results = {}
            
            for step_group in execution_order:
                # Execute steps in this group (can be parallel)
                group_results = await self._execute_step_group(step_group, current_data, correlation_id)
                results.update(group_results)
                
                # Update current data with results from this group
                if group_results:
                    # Use the last result as input for next group
                    current_data = list(group_results.values())[-1]
            
            # Mark as completed
            self._progress_data['is_running'] = False
            self._progress_data['is_completed'] = True
            self._progress_data['progress_percentage'] = 100.0
            
            # Publish pipeline completed event
            await event_bus.publish(AgentEvent(
                event_type=EventType.PIPELINE_COMPLETED,
                source="agent_manager_v2",
                correlation_id=correlation_id,
                data={"results": results}
            ))
            
            # Save project to backend
            await self._save_project_to_backend(correlation_id, input_data, results)
            
            self.logger.info("Pipeline execution completed successfully")
            return {
                "success": True,
                "results": results,
                "pipeline_name": self._pipeline_config.name,
                "correlation_id": correlation_id
            }
            
        except Exception as e:
            self.logger.error(f"Pipeline execution failed: {str(e)}")
            
            # Mark as failed
            self._progress_data['is_running'] = False
            self._progress_data['has_failures'] = True
            
            # Publish pipeline failed event
            await event_bus.publish(AgentEvent(
                event_type=EventType.PIPELINE_FAILED,
                source="agent_manager_v2",
                correlation_id=correlation_id,
                data={"error": str(e)}
            ))
            
            return {
                "success": False,
                "error": str(e),
                "pipeline_name": self._pipeline_config.name if self._pipeline_config else "unknown",
                "correlation_id": correlation_id
            }
    
    async def _execute_step_group(self, step_names: List[str], input_data: Any, correlation_id: str) -> Dict[str, Any]:
        """Execute a group of steps (potentially in parallel)."""
        results = {}
        
        if len(step_names) == 1:
            # Single step - execute directly
            step_name = step_names[0]
            result = await self._execute_single_step(step_name, input_data, correlation_id)
            results[step_name] = result
        else:
            # Multiple steps - execute in parallel
            tasks = []
            for step_name in step_names:
                task = self._execute_single_step(step_name, input_data, correlation_id)
                tasks.append((step_name, task))
            
            # Wait for all tasks to complete
            for step_name, task in tasks:
                try:
                    result = await task
                    results[step_name] = result
                except Exception as e:
                    self.logger.error(f"Step {step_name} failed: {str(e)}")
                    results[step_name] = {"error": str(e)}
        
        return results
    
    async def _execute_single_step(self, step_name: str, input_data: Any, correlation_id: str) -> Any:
        """Execute a single pipeline step."""
        step_config = self._pipeline_config.get_step(step_name)
        if not step_config:
            raise ValueError(f"Step configuration for {step_name} not found")
        
        # Check if this is an iterative step
        if step_config.is_iterative():
            return await self._execute_iterative_step(step_config, input_data, correlation_id)
        
        # Regular step execution
        agent = self._active_agents.get(step_name)
        if not agent:
            raise ValueError(f"Agent {step_name} not found in active agents")
        
        try:
            # Update progress
            self._update_step_progress(step_name, "running", 0)
            
            # Publish step started event
            await publish_agent_started(agent.metadata.name, correlation_id, step_name=step_name)
            
            # Execute the agent
            self.logger.info(f"Executing step: {step_name}")
            result = agent.process(input_data, context=self._execution_context)
            
            # Update progress
            self._update_step_progress(step_name, "completed", 100)
            self._progress_data['completed_steps'] += 1
            self._update_overall_progress()
            
            # Publish step completed event
            await publish_agent_completed(agent.metadata.name, result, correlation_id, step_name=step_name)
            
            self.logger.info(f"Step {step_name} completed successfully")
            return result
            
        except Exception as e:
            # Update progress
            self._update_step_progress(step_name, "failed", 0)
            self._progress_data['failed_steps'] += 1
            self._progress_data['has_failures'] = True
            self._update_overall_progress()
            
            # Publish step failed event
            await publish_agent_failed(agent.metadata.name, str(e), correlation_id, step_name=step_name)
            
            # Handle failure based on strategy
            if step_config and step_config.optional:
                self.logger.warning(f"Optional step {step_name} failed: {str(e)}")
                return {"error": str(e), "optional": True}
            else:
                raise
    
    async def _execute_iterative_step(self, step_config, input_data: Any, correlation_id: str) -> Any:
        """Execute an iterative step with feedback loop."""
        if not step_config.iterative_config:
            raise ValueError(f"Iterative step {step_config.agent_type} missing iterative configuration")
        
        iter_config = step_config.iterative_config
        
        # Get the improver and evaluator agents
        improver_agent = self._active_agents.get(iter_config.improver_agent)
        evaluator_agent = self._active_agents.get(iter_config.evaluator_agent)
        
        if not improver_agent:
            raise ValueError(f"Improver agent {iter_config.improver_agent} not found in active agents")
        if not evaluator_agent:
            raise ValueError(f"Evaluator agent {iter_config.evaluator_agent} not found in active agents")
        
        try:
            # Update progress
            self._update_step_progress(step_config.agent_type, "running", 0)
            
            # Publish iterative step started event
            await publish_agent_started(f"{improver_agent.metadata.name}+{evaluator_agent.metadata.name}", 
                                      correlation_id, step_name=step_config.agent_type)
            
            # Execute iterative loop
            self.logger.info(f"Executing iterative step: {step_config.agent_type}")
            loop_result = await iterative_executor.execute_iterative_loop(
                loop_name=step_config.agent_type,
                improver_agent=improver_agent,
                evaluator_agent=evaluator_agent,
                initial_input=input_data,
                max_iterations=iter_config.max_iterations,
                quality_threshold=iter_config.quality_threshold,
                timeout_per_iteration=iter_config.timeout_per_iteration,
                correlation_id=correlation_id
            )
            
            # Update progress based on loop result
            if loop_result.threshold_met or loop_result.final_output:
                self._update_step_progress(step_config.agent_type, "completed", 100)
                self._progress_data['completed_steps'] += 1
                
                # Publish step completed event with loop details
                await publish_agent_completed(
                    f"{improver_agent.metadata.name}+{evaluator_agent.metadata.name}",
                    {
                        "final_output": loop_result.final_output,
                        "loop_result": loop_result.to_dict()
                    },
                    correlation_id,
                    step_name=step_config.agent_type
                )
                
                self.logger.info(f"Iterative step {step_config.agent_type} completed successfully")
                self.logger.info(f"Quality improvement: {loop_result.get_quality_improvement():.1f} points")
                
                return {
                    "output": loop_result.final_output,
                    "iterative_result": loop_result.to_dict(),
                    "quality_score": loop_result.final_quality_score,
                    "iterations_completed": loop_result.total_iterations,
                    "threshold_met": loop_result.threshold_met
                }
            else:
                # Loop failed or didn't produce output
                self._update_step_progress(step_config.agent_type, "failed", 0)
                self._progress_data['failed_steps'] += 1
                self._progress_data['has_failures'] = True
                
                error_msg = f"Iterative loop failed to produce valid output after {loop_result.total_iterations} iterations"
                await publish_agent_failed(
                    f"{improver_agent.metadata.name}+{evaluator_agent.metadata.name}",
                    error_msg,
                    correlation_id,
                    step_name=step_config.agent_type
                )
                
                if step_config.optional:
                    self.logger.warning(f"Optional iterative step {step_config.agent_type} failed")
                    return {"error": error_msg, "optional": True, "loop_result": loop_result.to_dict()}
                else:
                    raise Exception(error_msg)
                    
        except Exception as e:
            # Update progress
            self._update_step_progress(step_config.agent_type, "failed", 0)
            self._progress_data['failed_steps'] += 1
            self._progress_data['has_failures'] = True
            self._update_overall_progress()
            
            # Publish step failed event
            await publish_agent_failed(
                f"{improver_agent.metadata.name}+{evaluator_agent.metadata.name}",
                str(e),
                correlation_id,
                step_name=step_config.agent_type
            )
            
            # Handle failure based on strategy
            if step_config.optional:
                self.logger.warning(f"Optional iterative step {step_config.agent_type} failed: {str(e)}")
                return {"error": str(e), "optional": True}
            else:
                raise
        
        finally:
            self._update_overall_progress()
    
    def _update_step_progress(self, step_name: str, status: str, progress: int):
        """Update progress for a specific step."""
        for step in self._progress_data['steps']:
            if step['agent_type'] == step_name:
                step['status'] = status
                step['progress_percentage'] = progress
                if status == "running":
                    self._progress_data['current_step_info'] = step
                break
    
    def _update_overall_progress(self):
        """Update overall pipeline progress."""
        if not self._pipeline_config:
            return
        
        total_steps = len(self._pipeline_config.steps)
        completed_steps = self._progress_data['completed_steps']
        
        # Calculate progress percentage
        progress_percentage = (completed_steps / total_steps) * 100 if total_steps > 0 else 0
        self._progress_data['progress_percentage'] = progress_percentage
        
        # Update elapsed time
        if self._start_time:
            self._progress_data['elapsed_time'] = time.time() - self._start_time
        
        # Estimate remaining time
        if completed_steps > 0 and self._start_time:
            elapsed = time.time() - self._start_time
            avg_time_per_step = elapsed / completed_steps
            remaining_steps = total_steps - completed_steps
            self._progress_data['estimated_remaining_time'] = avg_time_per_step * remaining_steps
    
    async def _on_agent_completed(self, event: AgentEvent):
        """Handle agent completed events."""
        self.logger.debug(f"Agent completed: {event.source}")
    
    async def _on_agent_failed(self, event: AgentEvent):
        """Handle agent failed events."""
        self.logger.warning(f"Agent failed: {event.source} - {event.data}")
    
    def get_progress(self) -> Dict[str, Any]:
        """Get current pipeline progress."""
        return self._progress_data.copy()
    
    def get_available_agents(self) -> Dict[str, str]:
        """Get list of available agents."""
        available = agent_factory.get_available_agents()
        return {key: metadata.name for key, metadata in available.items()}
    
    def get_active_agents(self) -> Dict[str, str]:
        """Get list of currently active agents."""
        return {key: agent.metadata.name for key, agent in self._active_agents.items()}
    
    def get_pipeline_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the current pipeline configuration."""
        if not self._pipeline_config:
            return None
        
        return {
            "name": self._pipeline_config.name,
            "description": self._pipeline_config.description,
            "version": self._pipeline_config.version,
            "total_steps": len(self._pipeline_config.steps),
            "step_names": [step.agent_type for step in self._pipeline_config.steps],
            "execution_order": self._pipeline_config.get_execution_order()
        }
    
    def get_factory_stats(self) -> Dict[str, Any]:
        """Get agent factory statistics."""
        return agent_factory.get_factory_stats()
    
    def validate_input(self, user_input: str) -> Dict[str, Any]:
        """Validate user input for pipeline execution."""
        validation_result = {
            'is_valid': True,
            'warnings': [],
            'suggestions': []
        }
        
        # Basic validation
        if not user_input or not user_input.strip():
            validation_result['is_valid'] = False
            validation_result['warnings'].append("Input cannot be empty")
            return validation_result
        
        # Length validation
        if len(user_input.strip()) < 10:
            validation_result['warnings'].append("Input is very short. Consider providing more details for better results.")
        
        if len(user_input) > 5000:
            validation_result['warnings'].append("Input is very long. Consider breaking it down into smaller, more focused requests.")
        
        # Content suggestions
        input_lower = user_input.lower()
        
        # Check for specific requirements
        if 'create' not in input_lower and 'build' not in input_lower and 'develop' not in input_lower:
            validation_result['suggestions'].append("Consider starting with action words like 'Create', 'Build', or 'Develop' to clarify your intent.")
        
        # Check for technology mentions
        tech_keywords = ['python', 'web', 'api', 'database', 'gui', 'cli', 'script', 'application', 'tool']
        if not any(keyword in input_lower for keyword in tech_keywords):
            validation_result['suggestions'].append("Consider mentioning the type of application or technology you want to use (e.g., web app, CLI tool, Python script).")
        
        # Check for functionality details
        if len(input_lower.split()) < 5:
            validation_result['suggestions'].append("Provide more details about the functionality you want to implement.")
        
        return validation_result
    
    async def _save_project_to_backend(self, execution_id: str, input_data: Any, results: Dict[str, Any]):
        """Save completed project to backend storage."""
        try:
            # Check if backend is available
            backend_healthy = await backend_client.check_backend_health()
            if not backend_healthy:
                self.logger.warning("Backend is not healthy, skipping project save")
                return
            
            # Prepare project data for backend
            project_data = {
                "execution_id": execution_id,
                "pipeline_name": self._pipeline_config.name if self._pipeline_config else "default",
                "input_data": str(input_data),
                "status": "completed",
                "started_at": datetime.fromtimestamp(self._start_time).isoformat() if self._start_time else datetime.now().isoformat(),
                "completed_at": datetime.now().isoformat(),
                "result": results,
                "progress": self._progress_data
            }
            
            # Save to backend
            self.logger.info(f"Saving project {execution_id} to backend")
            save_result = await backend_client.save_generated_project(project_data)
            
            if save_result.get("success"):
                self.logger.info(f"Successfully saved project {execution_id} to backend")
                if "saved_path" in save_result:
                    self.logger.info(f"Project files saved to: {save_result['saved_path']}")
            else:
                self.logger.error(f"Failed to save project {execution_id} to backend: {save_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            self.logger.error(f"Error saving project {execution_id} to backend: {str(e)}")
    
    def clear_agents(self):
        """Clear all active agents and reset state."""
        self._active_agents.clear()
        self._pipeline_config = None
        self._execution_context.clear()
        self._progress_data.clear()
        self._start_time = None
        agent_factory.clear_instances()
        self.logger.info("Cleared all agents and reset state")

# Global instance for backward compatibility
agent_manager_v2 = AgentManagerV2()
