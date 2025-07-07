import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';

export interface VirtualEnvironment {
  id: string;
  name: string;
  type: 'workspace' | 'collaboration' | 'visualization' | 'presentation' | 'simulation';
  theme: 'cyberpunk' | 'minimal' | 'nature' | 'space' | 'abstract' | 'custom';
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  objects: VirtualObject[];
  lighting: LightingConfig;
  physics: PhysicsConfig;
  audio: AudioConfig;
  participants: VirtualUser[];
  settings: EnvironmentSettings;
  createdAt: Date;
  lastModified: Date;
}

export interface VirtualObject {
  id: string;
  type: 'code_block' | 'file_system' | 'ai_agent' | 'data_visualization' | 'ui_component' | 'tool' | 'decoration';
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  geometry: GeometryConfig;
  material: MaterialConfig;
  interactions: InteractionConfig[];
  data?: any;
  animations: AnimationConfig[];
  physics?: ObjectPhysics;
}

export interface VirtualUser {
  id: string;
  username: string;
  avatar: AvatarConfig;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  status: 'active' | 'idle' | 'away' | 'busy';
  permissions: UserPermissions;
  tools: VirtualTool[];
  preferences: UserPreferences;
}

export interface AvatarConfig {
  model: string;
  textures: string[];
  animations: string[];
  accessories: AccessoryConfig[];
  customization: {
    colors: Record<string, string>;
    scale: number;
    features: Record<string, any>;
  };
}

export interface VirtualTool {
  id: string;
  name: string;
  type: 'code_editor' | 'debugger' | 'terminal' | 'browser' | 'ai_assistant' | 'collaboration' | 'custom';
  icon: string;
  position: THREE.Vector3;
  size: THREE.Vector2;
  functionality: ToolFunctionality;
  shortcuts: KeyboardShortcut[];
}

export interface ImmersiveCodeEditor {
  id: string;
  language: string;
  content: string;
  position: THREE.Vector3;
  size: THREE.Vector2;
  theme: 'dark' | 'light' | 'neon' | 'holographic';
  features: {
    syntaxHighlighting: boolean;
    autoComplete: boolean;
    aiSuggestions: boolean;
    collaborativeEditing: boolean;
    voiceCommands: boolean;
    gestureControls: boolean;
  };
  visualizations: CodeVisualization[];
}

export interface CodeVisualization {
  type: 'flow_chart' | 'dependency_graph' | 'execution_trace' | 'data_flow' | 'architecture_diagram';
  data: any;
  position: THREE.Vector3;
  scale: number;
  interactive: boolean;
  realTime: boolean;
}

export interface AROverlay {
  id: string;
  type: 'code_hints' | 'documentation' | 'metrics' | 'notifications' | 'ai_suggestions';
  content: any;
  position: 'screen_space' | 'world_space';
  anchor?: THREE.Vector3;
  visibility: 'always' | 'on_focus' | 'on_demand';
  style: OverlayStyle;
}

export interface VRController {
  id: string;
  hand: 'left' | 'right';
  type: 'pointer' | 'grab' | 'gesture' | 'haptic';
  mappings: ControllerMapping[];
  hapticFeedback: HapticConfig;
  tracking: TrackingConfig;
}

export interface MetaverseSession {
  id: string;
  environmentId: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
  activities: SessionActivity[];
  recordings: SessionRecording[];
  analytics: SessionAnalytics;
}

export interface SessionActivity {
  id: string;
  userId: string;
  type: 'code_edit' | 'file_operation' | 'collaboration' | 'ai_interaction' | 'tool_usage';
  timestamp: Date;
  data: any;
  duration: number;
}

export interface GeometryConfig {
  type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'custom';
  parameters: Record<string, number>;
  customMesh?: string;
}

export interface MaterialConfig {
  type: 'basic' | 'standard' | 'physical' | 'holographic' | 'neon' | 'glass';
  properties: {
    color?: string;
    opacity?: number;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    transparent?: boolean;
    wireframe?: boolean;
  };
  textures?: {
    diffuse?: string;
    normal?: string;
    roughness?: string;
    metalness?: string;
    emissive?: string;
  };
}

export interface InteractionConfig {
  type: 'click' | 'hover' | 'grab' | 'gesture' | 'voice' | 'gaze';
  action: string;
  parameters: Record<string, any>;
  feedback: FeedbackConfig;
}

export interface FeedbackConfig {
  visual?: {
    highlight: boolean;
    animation: string;
    particles: boolean;
  };
  audio?: {
    sound: string;
    volume: number;
  };
  haptic?: {
    intensity: number;
    duration: number;
    pattern: string;
  };
}

export interface LightingConfig {
  ambient: {
    color: string;
    intensity: number;
  };
  directional: {
    color: string;
    intensity: number;
    position: THREE.Vector3;
    target: THREE.Vector3;
  }[];
  point: {
    color: string;
    intensity: number;
    position: THREE.Vector3;
    distance: number;
  }[];
  spot: {
    color: string;
    intensity: number;
    position: THREE.Vector3;
    target: THREE.Vector3;
    angle: number;
    penumbra: number;
  }[];
}

export interface PhysicsConfig {
  enabled: boolean;
  gravity: THREE.Vector3;
  collisionDetection: boolean;
  constraints: PhysicsConstraint[];
}

export interface AudioConfig {
  enabled: boolean;
  spatialAudio: boolean;
  backgroundMusic?: string;
  ambientSounds: AmbientSound[];
  volume: number;
}

export interface EnvironmentSettings {
  maxParticipants: number;
  privacy: 'public' | 'private' | 'invite_only';
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
    canRecord: boolean;
    canExport: boolean;
  };
  features: {
    aiAssistants: boolean;
    voiceChat: boolean;
    screenSharing: boolean;
    fileSharing: boolean;
    realTimeSync: boolean;
  };
}

export class MetaverseService {
  private environments: Map<string, VirtualEnvironment> = new Map();
  private sessions: Map<string, MetaverseSession> = new Map();
  private users: Map<string, VirtualUser> = new Map();
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private vrSupported = false;
  private arSupported = false;
  private readonly STORAGE_KEY = 'genxcoder-metaverse';

  constructor() {
    this.loadFromStorage();
    this.detectCapabilities();
    this.initializeDefaultEnvironments();
  }

  // Environment Management
  async createEnvironment(environmentData: Omit<VirtualEnvironment, 'id' | 'createdAt' | 'lastModified'>): Promise<VirtualEnvironment> {
    const environmentId = uuidv4();
    const environment: VirtualEnvironment = {
      ...environmentData,
      id: environmentId,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.environments.set(environmentId, environment);
    this.saveToStorage();
    return environment;
  }

  async getEnvironments(): Promise<VirtualEnvironment[]> {
    return Array.from(this.environments.values());
  }

  async getEnvironment(environmentId: string): Promise<VirtualEnvironment | null> {
    return this.environments.get(environmentId) || null;
  }

  async updateEnvironment(environmentId: string, updates: Partial<VirtualEnvironment>): Promise<boolean> {
    const environment = this.environments.get(environmentId);
    if (!environment) return false;

    Object.assign(environment, updates);
    environment.lastModified = new Date();
    this.environments.set(environmentId, environment);
    this.saveToStorage();
    return true;
  }

  // 3D Scene Management
  async initializeScene(environmentId: string, container: HTMLElement): Promise<boolean> {
    const environment = this.environments.get(environmentId);
    if (!environment) return false;

    try {
      // Initialize Three.js scene
      this.scene = new THREE.Scene();
      
      // Setup camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );

      // Setup renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(this.renderer.domElement);

      // Apply environment settings
      await this.applyEnvironmentToScene(environment);

      // Start render loop
      this.startRenderLoop();

      return true;
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error);
      return false;
    }
  }

  private async applyEnvironmentToScene(environment: VirtualEnvironment): Promise<void> {
    if (!this.scene) return;

    // Clear existing objects
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    // Add lighting
    this.setupLighting(environment.lighting);

    // Add environment objects
    for (const obj of environment.objects) {
      const mesh = await this.createVirtualObject(obj);
      if (mesh) {
        this.scene.add(mesh);
      }
    }

    // Setup physics if enabled
    if (environment.physics.enabled) {
      this.setupPhysics(environment.physics);
    }

    // Setup audio
    if (environment.audio.enabled) {
      this.setupAudio(environment.audio);
    }
  }

  private setupLighting(lighting: LightingConfig): void {
    if (!this.scene) return;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(lighting.ambient.color, lighting.ambient.intensity);
    this.scene.add(ambientLight);

    // Directional lights
    lighting.directional.forEach(light => {
      const directionalLight = new THREE.DirectionalLight(light.color, light.intensity);
      directionalLight.position.copy(light.position);
      directionalLight.target.position.copy(light.target);
      directionalLight.castShadow = true;
      if (this.scene) {
        this.scene.add(directionalLight);
        this.scene.add(directionalLight.target);
      }
    });

    // Point lights
    lighting.point.forEach(light => {
      const pointLight = new THREE.PointLight(light.color, light.intensity, light.distance);
      pointLight.position.copy(light.position);
      pointLight.castShadow = true;
      if (this.scene) {
        this.scene.add(pointLight);
      }
    });

    // Spot lights
    lighting.spot.forEach(light => {
      const spotLight = new THREE.SpotLight(light.color, light.intensity, 0, light.angle, light.penumbra);
      spotLight.position.copy(light.position);
      spotLight.target.position.copy(light.target);
      spotLight.castShadow = true;
      if (this.scene) {
        this.scene.add(spotLight);
        this.scene.add(spotLight.target);
      }
    });
  }

  private async createVirtualObject(obj: VirtualObject): Promise<THREE.Object3D | null> {
    try {
      // Create geometry
      let geometry: THREE.BufferGeometry;
      switch (obj.geometry.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(
            obj.geometry.parameters.width || 1,
            obj.geometry.parameters.height || 1,
            obj.geometry.parameters.depth || 1
          );
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(
            obj.geometry.parameters.radius || 1,
            obj.geometry.parameters.widthSegments || 32,
            obj.geometry.parameters.heightSegments || 16
          );
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(
            obj.geometry.parameters.radiusTop || 1,
            obj.geometry.parameters.radiusBottom || 1,
            obj.geometry.parameters.height || 1,
            obj.geometry.parameters.radialSegments || 8
          );
          break;
        case 'plane':
          geometry = new THREE.PlaneGeometry(
            obj.geometry.parameters.width || 1,
            obj.geometry.parameters.height || 1
          );
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }

      // Create material
      const material = this.createMaterial(obj.material);

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(obj.position);
      mesh.rotation.copy(obj.rotation);
      mesh.scale.copy(obj.scale);
      mesh.userData = { virtualObject: obj };

      // Add interactions
      this.setupObjectInteractions(mesh, obj.interactions);

      return mesh;
    } catch (error) {
      console.error('Failed to create virtual object:', error);
      return null;
    }
  }

  private createMaterial(materialConfig: MaterialConfig): THREE.Material {
    const props = materialConfig.properties;

    switch (materialConfig.type) {
      case 'basic':
        return new THREE.MeshBasicMaterial({
          color: props.color || '#ffffff',
          transparent: props.transparent || false,
          opacity: props.opacity || 1,
          wireframe: props.wireframe || false
        });

      case 'standard':
        return new THREE.MeshStandardMaterial({
          color: props.color || '#ffffff',
          metalness: props.metalness || 0,
          roughness: props.roughness || 1,
          transparent: props.transparent || false,
          opacity: props.opacity || 1,
          wireframe: props.wireframe || false
        });

      case 'physical':
        return new THREE.MeshPhysicalMaterial({
          color: props.color || '#ffffff',
          metalness: props.metalness || 0,
          roughness: props.roughness || 1,
          transparent: props.transparent || false,
          opacity: props.opacity || 1,
          wireframe: props.wireframe || false
        });

      case 'holographic':
        return new THREE.MeshBasicMaterial({
          color: props.color || '#00ffff',
          transparent: true,
          opacity: 0.7,
          wireframe: true
        });

      case 'neon':
        const neonMaterial = new THREE.MeshBasicMaterial({
          color: props.color || '#ff00ff',
          transparent: true,
          opacity: 0.8
        });
        // Set emissive separately to avoid TypeScript error
        (neonMaterial as any).emissive = new THREE.Color(props.emissive || props.color || '#ff00ff');
        return neonMaterial;

      case 'glass':
        return new THREE.MeshPhysicalMaterial({
          color: props.color || '#ffffff',
          metalness: 0,
          roughness: 0,
          transparent: true,
          opacity: 0.3,
          transmission: 0.9,
          thickness: 0.5
        });

      default:
        return new THREE.MeshStandardMaterial({ color: props.color || '#ffffff' });
    }
  }

  private setupObjectInteractions(mesh: THREE.Object3D, interactions: InteractionConfig[]): void {
    // Add interaction handlers based on configuration
    interactions.forEach(interaction => {
      switch (interaction.type) {
        case 'click':
          mesh.userData.onClick = () => this.handleInteraction(interaction);
          break;
        case 'hover':
          mesh.userData.onHover = () => this.handleInteraction(interaction);
          break;
        // Add more interaction types as needed
      }
    });
  }

  private handleInteraction(interaction: InteractionConfig): void {
    // Execute interaction action
    console.log('Interaction triggered:', interaction.action);
    
    // Provide feedback
    if (interaction.feedback.visual?.highlight) {
      // Add visual highlight effect
    }
    
    if (interaction.feedback.audio?.sound) {
      // Play audio feedback
    }
    
    if (interaction.feedback.haptic) {
      // Trigger haptic feedback
    }
  }

  private setupPhysics(physics: PhysicsConfig): void {
    // Initialize physics engine (would integrate with a physics library like Cannon.js)
    console.log('Physics setup:', physics);
  }

  private setupAudio(audio: AudioConfig): void {
    // Setup spatial audio
    if (audio.spatialAudio) {
      // Initialize Web Audio API for 3D audio
    }
    
    // Play background music
    if (audio.backgroundMusic) {
      // Load and play background music
    }
    
    // Setup ambient sounds
    audio.ambientSounds.forEach(sound => {
      // Load and position ambient sounds
    });
  }

  private startRenderLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    
    animate();
  }

  // VR/AR Support
  async enableVR(): Promise<boolean> {
    if (!this.vrSupported || !this.renderer) return false;

    try {
      // Enable VR mode
      this.renderer.xr.enabled = true;
      
      // Add VR controllers
      await this.setupVRControllers();
      
      return true;
    } catch (error) {
      console.error('Failed to enable VR:', error);
      return false;
    }
  }

  async enableAR(): Promise<boolean> {
    if (!this.arSupported) return false;

    try {
      // Initialize AR session
      // This would integrate with WebXR AR APIs
      return true;
    } catch (error) {
      console.error('Failed to enable AR:', error);
      return false;
    }
  }

  private async setupVRControllers(): Promise<void> {
    // Setup VR controller tracking and interactions
    // This would integrate with WebXR controller APIs
  }

  // Session Management
  async startSession(environmentId: string, userId: string): Promise<MetaverseSession> {
    const sessionId = uuidv4();
    const session: MetaverseSession = {
      id: sessionId,
      environmentId,
      participants: [userId],
      startTime: new Date(),
      activities: [],
      recordings: [],
      analytics: {
        totalTime: 0,
        interactions: 0,
        collaborations: 0,
        codeChanges: 0
      }
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async joinSession(sessionId: string, userId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }

    return true;
  }

  async endSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.endTime = new Date();
    this.saveToStorage();
    return true;
  }

  // Code Visualization
  async createCodeVisualization(code: string, language: string, type: CodeVisualization['type']): Promise<CodeVisualization> {
    const visualization: CodeVisualization = {
      type,
      data: await this.analyzeCode(code, language, type),
      position: new THREE.Vector3(0, 0, 0),
      scale: 1,
      interactive: true,
      realTime: false
    };

    return visualization;
  }

  private async analyzeCode(code: string, language: string, type: CodeVisualization['type']): Promise<any> {
    // Analyze code and generate visualization data
    switch (type) {
      case 'flow_chart':
        return this.generateFlowChart(code, language);
      case 'dependency_graph':
        return this.generateDependencyGraph(code, language);
      case 'execution_trace':
        return this.generateExecutionTrace(code, language);
      case 'data_flow':
        return this.generateDataFlow(code, language);
      case 'architecture_diagram':
        return this.generateArchitectureDiagram(code, language);
      default:
        return {};
    }
  }

  private generateFlowChart(code: string, language: string): any {
    // Generate flow chart data from code
    return {
      nodes: [],
      edges: [],
      layout: 'hierarchical'
    };
  }

  private generateDependencyGraph(code: string, language: string): any {
    // Generate dependency graph data
    return {
      nodes: [],
      edges: [],
      clusters: []
    };
  }

  private generateExecutionTrace(code: string, language: string): any {
    // Generate execution trace visualization
    return {
      steps: [],
      timeline: [],
      callStack: []
    };
  }

  private generateDataFlow(code: string, language: string): any {
    // Generate data flow visualization
    return {
      variables: [],
      flows: [],
      transformations: []
    };
  }

  private generateArchitectureDiagram(code: string, language: string): any {
    // Generate architecture diagram
    return {
      components: [],
      connections: [],
      layers: []
    };
  }

  // Utility Methods
  private detectCapabilities(): void {
    // Detect VR support
    this.vrSupported = 'xr' in navigator && 'isSessionSupported' in (navigator as any).xr;
    
    // Detect AR support
    this.arSupported = 'xr' in navigator && 'isSessionSupported' in (navigator as any).xr;
  }

  private initializeDefaultEnvironments(): void {
    if (this.environments.size > 0) return;

    const defaultEnvironments = [
      {
        name: 'Cyberpunk Workspace',
        type: 'workspace' as const,
        theme: 'cyberpunk' as const,
        dimensions: { width: 20, height: 10, depth: 20 },
        objects: [],
        lighting: this.getDefaultLighting('cyberpunk'),
        physics: { enabled: false, gravity: new THREE.Vector3(0, -9.8, 0), collisionDetection: false, constraints: [] },
        audio: { enabled: true, spatialAudio: true, ambientSounds: [], volume: 0.5 },
        participants: [],
        settings: this.getDefaultSettings()
      },
      {
        name: 'Minimal Studio',
        type: 'workspace' as const,
        theme: 'minimal' as const,
        dimensions: { width: 15, height: 8, depth: 15 },
        objects: [],
        lighting: this.getDefaultLighting('minimal'),
        physics: { enabled: false, gravity: new THREE.Vector3(0, -9.8, 0), collisionDetection: false, constraints: [] },
        audio: { enabled: true, spatialAudio: true, ambientSounds: [], volume: 0.3 },
        participants: [],
        settings: this.getDefaultSettings()
      }
    ];

    defaultEnvironments.forEach(async (envData) => {
      await this.createEnvironment(envData);
    });
  }

  private getDefaultLighting(theme: string): LightingConfig {
    switch (theme) {
      case 'cyberpunk':
        return {
          ambient: { color: '#0a0a2e', intensity: 0.3 },
          directional: [
            { color: '#ff00ff', intensity: 0.8, position: new THREE.Vector3(5, 10, 5), target: new THREE.Vector3(0, 0, 0) }
          ],
          point: [
            { color: '#00ffff', intensity: 1, position: new THREE.Vector3(-5, 5, -5), distance: 20 }
          ],
          spot: []
        };
      case 'minimal':
        return {
          ambient: { color: '#ffffff', intensity: 0.6 },
          directional: [
            { color: '#ffffff', intensity: 1, position: new THREE.Vector3(10, 10, 10), target: new THREE.Vector3(0, 0, 0) }
          ],
          point: [],
          spot: []
        };
      default:
        return {
          ambient: { color: '#404040', intensity: 0.4 },
          directional: [
            { color: '#ffffff', intensity: 0.8, position: new THREE.Vector3(5, 10, 5), target: new THREE.Vector3(0, 0, 0) }
          ],
          point: [],
          spot: []
        };
    }
  }

  private getDefaultSettings(): EnvironmentSettings {
    return {
      maxParticipants: 10,
      privacy: 'private',
      permissions: {
        canEdit: true,
        canInvite: true,
        canRecord: false,
        canExport: true
      },
      features: {
        aiAssistants: true,
        voiceChat: true,
        screenSharing: true,
        fileSharing: true,
        realTimeSync: true
      }
    };
  }

  private saveToStorage(): void {
    try {
      const data = {
        environments: Array.from(this.environments.entries()),
        sessions: Array.from(this.sessions.entries()),
        users: Array.from(this.users.entries()),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save metaverse data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.environments = new Map(parsed.environments || []);
        this.sessions = new Map(parsed.sessions || []);
        this.users = new Map(parsed.users || []);

        // Convert date strings back to Date objects
        this.environments.forEach(env => {
          env.createdAt = new Date(env.createdAt);
          env.lastModified = new Date(env.lastModified);
        });

        this.sessions.forEach(session => {
          session.startTime = new Date(session.startTime);
          if (session.endTime) session.endTime = new Date(session.endTime);
        });
      }
    } catch (error) {
      console.warn('Failed to load metaverse data:', error);
    }
  }

  // Public API
  isVRSupported(): boolean {
    return this.vrSupported;
  }

  isARSupported(): boolean {
    return this.arSupported;
  }

  async getSessions(): Promise<MetaverseSession[]> {
    return Array.from(this.sessions.values());
  }

  async getUsers(): Promise<VirtualUser[]> {
    return Array.from(this.users.values());
  }

  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    if (this.scene) {
      this.scene.clear();
    }
  }
}

// Singleton instance
export const metaverseService = new MetaverseService();

// Type definitions for additional interfaces
interface AccessoryConfig {
  id: string;
  type: string;
  model: string;
  position: THREE.Vector3;
}

interface UserPermissions {
  canEdit: boolean;
  canInvite: boolean;
  canModerate: boolean;
  canRecord: boolean;
}

interface UserPreferences {
  theme: string;
  controls: string;
  audio: boolean;
  notifications: boolean;
}

interface ToolFunctionality {
  actions: string[];
  shortcuts: KeyboardShortcut[];
  customization: Record<string, any>;
}

interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
}

interface AnimationConfig {
  name: string;
  duration: number;
  loop: boolean;
  autoStart: boolean;
}

interface ObjectPhysics {
  mass: number;
  friction: number;
  restitution: number;
  collisionGroup: number;
}

interface PhysicsConstraint {
  type: string;
  objectA: string;
  objectB: string;
  parameters: Record<string, any>;
}

interface AmbientSound {
  id: string;
  file: string;
  position?: THREE.Vector3;
  volume: number;
  loop: boolean;
}

interface SessionRecording {
  id: string;
  startTime: Date;
  endTime: Date;
  format: string;
  size: number;
  url: string;
}

interface SessionAnalytics {
  totalTime: number;
  interactions: number;
  collaborations: number;
  codeChanges: number;
}

interface OverlayStyle {
  background: string;
  color: string;
  fontSize: number;
  padding: number;
  borderRadius: number;
}

interface ControllerMapping {
  input: string;
  action: string;
  parameters: Record<string, any>;
}

interface HapticConfig {
  enabled: boolean;
  intensity: number;
  patterns: Record<string, number[]>;
}

interface TrackingConfig {
  position: boolean;
  rotation: boolean;
  velocity: boolean;
  acceleration: boolean;
}
