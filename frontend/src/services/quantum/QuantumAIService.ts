import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs';
import { Matrix } from 'ml-matrix';

export interface QuantumCircuit {
  id: string;
  name: string;
  description: string;
  qubits: number;
  depth: number;
  gates: QuantumGate[];
  measurements: QuantumMeasurement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuantumGate {
  id: string;
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'RX' | 'RY' | 'RZ' | 'SWAP' | 'CZ' | 'Toffoli';
  qubits: number[];
  parameters?: number[];
  position: { x: number; y: number };
}

export interface QuantumMeasurement {
  qubit: number;
  basis: 'computational' | 'hadamard' | 'custom';
  angle?: number;
}

export interface QuantumState {
  amplitudes: Complex[];
  probabilities: number[];
  entanglement: number;
  coherence: number;
}

export interface Complex {
  real: number;
  imaginary: number;
}

export interface QuantumModel {
  id: string;
  name: string;
  description: string;
  type: 'QNN' | 'QAOA' | 'VQE' | 'QGAN' | 'QRL' | 'QSV';
  circuit: QuantumCircuit;
  classicalLayers: tf.LayersModel | null;
  parameters: {
    learningRate: number;
    iterations: number;
    optimizer: 'SPSA' | 'COBYLA' | 'BFGS' | 'Adam';
    shots: number;
  };
  performance: {
    accuracy: number;
    quantumAdvantage: number;
    coherenceTime: number;
    fidelity: number;
  };
  training: {
    status: 'idle' | 'training' | 'completed' | 'error';
    progress: number;
    currentIteration: number;
    loss: number[];
    quantumLoss: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface QuantumJob {
  id: string;
  modelId: string;
  type: 'training' | 'inference' | 'optimization' | 'simulation';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  backend: 'simulator' | 'ibm_quantum' | 'google_quantum' | 'rigetti' | 'ionq';
  shots: number;
  estimatedTime: number;
  actualTime?: number;
  results?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface QuantumBackend {
  id: string;
  name: string;
  provider: 'IBM' | 'Google' | 'Rigetti' | 'IonQ' | 'Simulator';
  type: 'superconducting' | 'trapped_ion' | 'photonic' | 'simulator';
  qubits: number;
  connectivity: number[][];
  gateSet: string[];
  errorRates: {
    singleQubit: number;
    twoQubit: number;
    readout: number;
  };
  coherenceTimes: {
    t1: number; // relaxation time
    t2: number; // dephasing time
  };
  availability: number; // percentage
  queueLength: number;
  status: 'online' | 'offline' | 'maintenance' | 'calibrating';
}

export interface QuantumAlgorithm {
  id: string;
  name: string;
  description: string;
  category: 'optimization' | 'machine_learning' | 'cryptography' | 'simulation' | 'search';
  complexity: 'polynomial' | 'exponential' | 'quadratic';
  quantumAdvantage: boolean;
  requiredQubits: number;
  implementation: string; // Code implementation
  parameters: Record<string, any>;
  benchmarks: {
    classicalTime: number;
    quantumTime: number;
    speedup: number;
  };
}

export class QuantumAIService {
  private circuits: Map<string, QuantumCircuit> = new Map();
  private models: Map<string, QuantumModel> = new Map();
  private jobs: Map<string, QuantumJob> = new Map();
  private backends: Map<string, QuantumBackend> = new Map();
  private algorithms: Map<string, QuantumAlgorithm> = new Map();
  private readonly STORAGE_KEY = 'genxcoder-quantum';

  constructor() {
    this.loadFromStorage();
    this.initializeBackends();
    this.initializeAlgorithms();
    this.startQuantumSimulator();
  }

  // Quantum Circuit Management
  async createCircuit(circuitData: Omit<QuantumCircuit, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuantumCircuit> {
    const circuitId = uuidv4();
    const circuit: QuantumCircuit = {
      ...circuitData,
      id: circuitId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.circuits.set(circuitId, circuit);
    this.saveToStorage();
    return circuit;
  }

  async getCircuit(circuitId: string): Promise<QuantumCircuit | null> {
    return this.circuits.get(circuitId) || null;
  }

  async updateCircuit(circuitId: string, updates: Partial<QuantumCircuit>): Promise<QuantumCircuit | null> {
    const circuit = this.circuits.get(circuitId);
    if (!circuit) return null;

    const updatedCircuit = {
      ...circuit,
      ...updates,
      updatedAt: new Date()
    };

    this.circuits.set(circuitId, updatedCircuit);
    this.saveToStorage();
    return updatedCircuit;
  }

  async addGateToCircuit(circuitId: string, gate: Omit<QuantumGate, 'id'>): Promise<boolean> {
    const circuit = this.circuits.get(circuitId);
    if (!circuit) return false;

    const newGate: QuantumGate = {
      ...gate,
      id: uuidv4()
    };

    circuit.gates.push(newGate);
    circuit.depth = Math.max(circuit.depth, gate.position.x + 1);
    circuit.updatedAt = new Date();

    this.circuits.set(circuitId, circuit);
    this.saveToStorage();
    return true;
  }

  // Quantum State Simulation
  async simulateCircuit(circuitId: string): Promise<QuantumState> {
    const circuit = await this.getCircuit(circuitId);
    if (!circuit) {
      throw new Error('Circuit not found');
    }

    // Initialize quantum state |0...0⟩
    const numStates = Math.pow(2, circuit.qubits);
    const amplitudes: Complex[] = Array(numStates).fill(null).map((_, i) => ({
      real: i === 0 ? 1 : 0,
      imaginary: 0
    }));

    // Apply quantum gates
    let currentState = amplitudes;
    for (const gate of circuit.gates) {
      currentState = this.applyGate(gate, currentState, circuit.qubits);
    }

    // Calculate probabilities
    const probabilities = currentState.map(amp => 
      amp.real * amp.real + amp.imaginary * amp.imaginary
    );

    // Calculate entanglement (simplified)
    const entanglement = this.calculateEntanglement(currentState, circuit.qubits);

    // Calculate coherence
    const coherence = this.calculateCoherence(currentState);

    return {
      amplitudes: currentState,
      probabilities,
      entanglement,
      coherence
    };
  }

  private applyGate(gate: QuantumGate, state: Complex[], numQubits: number): Complex[] {
    const numStates = state.length;
    const newState = [...state];

    switch (gate.type) {
      case 'H': // Hadamard gate
        return this.applyHadamard(newState, gate.qubits[0], numQubits);
      case 'X': // Pauli-X gate
        return this.applyPauliX(newState, gate.qubits[0], numQubits);
      case 'Y': // Pauli-Y gate
        return this.applyPauliY(newState, gate.qubits[0], numQubits);
      case 'Z': // Pauli-Z gate
        return this.applyPauliZ(newState, gate.qubits[0], numQubits);
      case 'CNOT': // Controlled-NOT gate
        return this.applyCNOT(newState, gate.qubits[0], gate.qubits[1], numQubits);
      case 'RX': // Rotation around X-axis
        return this.applyRotationX(newState, gate.qubits[0], gate.parameters?.[0] || 0, numQubits);
      case 'RY': // Rotation around Y-axis
        return this.applyRotationY(newState, gate.qubits[0], gate.parameters?.[0] || 0, numQubits);
      case 'RZ': // Rotation around Z-axis
        return this.applyRotationZ(newState, gate.qubits[0], gate.parameters?.[0] || 0, numQubits);
      default:
        return newState;
    }
  }

  private applyHadamard(state: Complex[], qubit: number, numQubits: number): Complex[] {
    const newState = [...state];
    const numStates = state.length;
    
    for (let i = 0; i < numStates; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === 0) {
        const j = i | (1 << qubit);
        const temp = { ...newState[i] };
        newState[i] = {
          real: (temp.real + newState[j].real) / Math.sqrt(2),
          imaginary: (temp.imaginary + newState[j].imaginary) / Math.sqrt(2)
        };
        newState[j] = {
          real: (temp.real - newState[j].real) / Math.sqrt(2),
          imaginary: (temp.imaginary - newState[j].imaginary) / Math.sqrt(2)
        };
      }
    }
    
    return newState;
  }

  private applyPauliX(state: Complex[], qubit: number, numQubits: number): Complex[] {
    const newState = [...state];
    const numStates = state.length;
    
    for (let i = 0; i < numStates; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === 0) {
        const j = i | (1 << qubit);
        [newState[i], newState[j]] = [newState[j], newState[i]];
      }
    }
    
    return newState;
  }

  private applyPauliY(state: Complex[], qubit: number, numQubits: number): Complex[] {
    const newState = [...state];
    const numStates = state.length;
    
    for (let i = 0; i < numStates; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === 0) {
        const j = i | (1 << qubit);
        const temp = { ...newState[i] };
        newState[i] = {
          real: newState[j].imaginary,
          imaginary: -newState[j].real
        };
        newState[j] = {
          real: -temp.imaginary,
          imaginary: temp.real
        };
      }
    }
    
    return newState;
  }

  private applyPauliZ(state: Complex[], qubit: number, numQubits: number): Complex[] {
    const newState = [...state];
    const numStates = state.length;
    
    for (let i = 0; i < numStates; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === 1) {
        newState[i] = {
          real: -newState[i].real,
          imaginary: -newState[i].imaginary
        };
      }
    }
    
    return newState;
  }

  private applyCNOT(state: Complex[], control: number, target: number, numQubits: number): Complex[] {
    const newState = [...state];
    const numStates = state.length;
    
    for (let i = 0; i < numStates; i++) {
      const controlBit = (i >> control) & 1;
      if (controlBit === 1) {
        const targetBit = (i >> target) & 1;
        const j = targetBit === 0 ? i | (1 << target) : i & ~(1 << target);
        [newState[i], newState[j]] = [newState[j], newState[i]];
      }
    }
    
    return newState;
  }

  private applyRotationX(state: Complex[], qubit: number, angle: number, numQubits: number): Complex[] {
    const newState = [...state];
    const numStates = state.length;
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    
    for (let i = 0; i < numStates; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === 0) {
        const j = i | (1 << qubit);
        const temp = { ...newState[i] };
        newState[i] = {
          real: cos * temp.real + sin * newState[j].imaginary,
          imaginary: cos * temp.imaginary - sin * newState[j].real
        };
        newState[j] = {
          real: cos * newState[j].real - sin * temp.imaginary,
          imaginary: cos * newState[j].imaginary + sin * temp.real
        };
      }
    }
    
    return newState;
  }

  private applyRotationY(state: Complex[], qubit: number, angle: number, numQubits: number): Complex[] {
    const newState = [...state];
    const numStates = state.length;
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    
    for (let i = 0; i < numStates; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === 0) {
        const j = i | (1 << qubit);
        const temp = { ...newState[i] };
        newState[i] = {
          real: cos * temp.real - sin * newState[j].real,
          imaginary: cos * temp.imaginary - sin * newState[j].imaginary
        };
        newState[j] = {
          real: sin * temp.real + cos * newState[j].real,
          imaginary: sin * temp.imaginary + cos * newState[j].imaginary
        };
      }
    }
    
    return newState;
  }

  private applyRotationZ(state: Complex[], qubit: number, angle: number, numQubits: number): Complex[] {
    const newState = [...state];
    const numStates = state.length;
    
    for (let i = 0; i < numStates; i++) {
      const bit = (i >> qubit) & 1;
      const phase = bit === 0 ? -angle / 2 : angle / 2;
      const cos = Math.cos(phase);
      const sin = Math.sin(phase);
      
      const temp = { ...newState[i] };
      newState[i] = {
        real: cos * temp.real - sin * temp.imaginary,
        imaginary: sin * temp.real + cos * temp.imaginary
      };
    }
    
    return newState;
  }

  private calculateEntanglement(state: Complex[], numQubits: number): number {
    // Simplified entanglement measure using von Neumann entropy
    if (numQubits < 2) return 0;
    
    // For simplicity, calculate entanglement between first qubit and rest
    const probabilities = state.map(amp => amp.real * amp.real + amp.imaginary * amp.imaginary);
    
    // Reduced density matrix for first qubit
    const prob0 = probabilities.filter((_, i) => ((i >> 0) & 1) === 0).reduce((sum, p) => sum + p, 0);
    const prob1 = 1 - prob0;
    
    if (prob0 === 0 || prob1 === 0) return 0;
    
    return -(prob0 * Math.log2(prob0) + prob1 * Math.log2(prob1));
  }

  private calculateCoherence(state: Complex[]): number {
    // Calculate coherence as the sum of off-diagonal elements
    let coherence = 0;
    for (let i = 0; i < state.length; i++) {
      for (let j = i + 1; j < state.length; j++) {
        const real = state[i].real * state[j].real + state[i].imaginary * state[j].imaginary;
        const imag = state[i].imaginary * state[j].real - state[i].real * state[j].imaginary;
        coherence += Math.sqrt(real * real + imag * imag);
      }
    }
    return coherence / (state.length * (state.length - 1) / 2);
  }

  // Quantum Machine Learning Models
  async createQuantumModel(modelData: Omit<QuantumModel, 'id' | 'createdAt' | 'updatedAt' | 'training'>): Promise<QuantumModel> {
    const modelId = uuidv4();
    const model: QuantumModel = {
      ...modelData,
      id: modelId,
      training: {
        status: 'idle',
        progress: 0,
        currentIteration: 0,
        loss: [],
        quantumLoss: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.models.set(modelId, model);
    this.saveToStorage();
    return model;
  }

  async trainQuantumModel(modelId: string, trainingData: any[]): Promise<QuantumJob> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error('Quantum model not found');
    }

    const jobId = uuidv4();
    const job: QuantumJob = {
      id: jobId,
      modelId,
      type: 'training',
      status: 'queued',
      priority: 'medium',
      backend: 'simulator',
      shots: model.parameters.shots,
      estimatedTime: model.parameters.iterations * 1000, // ms per iteration
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    // Start training asynchronously
    this.executeQuantumTraining(job, model, trainingData);
    
    return job;
  }

  private async executeQuantumTraining(job: QuantumJob, model: QuantumModel, trainingData: any[]): Promise<void> {
    try {
      job.status = 'running';
      model.training.status = 'training';
      
      const startTime = Date.now();
      
      for (let iteration = 0; iteration < model.parameters.iterations; iteration++) {
        // Simulate quantum training iteration
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate computation time
        
        // Update progress
        model.training.currentIteration = iteration + 1;
        model.training.progress = ((iteration + 1) / model.parameters.iterations) * 100;
        
        // Simulate loss calculation
        const classicalLoss = Math.exp(-iteration / 50) + Math.random() * 0.1;
        const quantumLoss = Math.exp(-iteration / 30) + Math.random() * 0.05; // Quantum advantage
        
        model.training.loss.push(classicalLoss);
        model.training.quantumLoss.push(quantumLoss);
        
        // Update model
        this.models.set(model.id, model);
        
        if (iteration % 10 === 0) {
          this.saveToStorage();
        }
      }
      
      // Complete training
      job.status = 'completed';
      job.actualTime = Date.now() - startTime;
      job.completedAt = new Date();
      
      model.training.status = 'completed';
      model.performance.accuracy = 0.85 + Math.random() * 0.1; // Simulate final accuracy
      model.performance.quantumAdvantage = model.training.quantumLoss[model.training.quantumLoss.length - 1] / 
                                          model.training.loss[model.training.loss.length - 1];
      model.performance.fidelity = 0.95 + Math.random() * 0.04;
      model.updatedAt = new Date();
      
      this.models.set(model.id, model);
      this.jobs.set(job.id, job);
      this.saveToStorage();
      
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      model.training.status = 'error';
      
      this.models.set(model.id, model);
      this.jobs.set(job.id, job);
      this.saveToStorage();
    }
  }

  async getQuantumModel(modelId: string): Promise<QuantumModel | null> {
    return this.models.get(modelId) || null;
  }

  async getAllQuantumModels(): Promise<QuantumModel[]> {
    return Array.from(this.models.values());
  }

  // Quantum Job Management
  async getJob(jobId: string): Promise<QuantumJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async getJobsByModel(modelId: string): Promise<QuantumJob[]> {
    return Array.from(this.jobs.values()).filter(job => job.modelId === modelId);
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'running') return false;

    job.status = 'cancelled';
    this.jobs.set(jobId, job);
    this.saveToStorage();
    return true;
  }

  // Quantum Backend Management
  async getAvailableBackends(): Promise<QuantumBackend[]> {
    return Array.from(this.backends.values()).filter(backend => 
      backend.status === 'online' && backend.availability > 0.8
    );
  }

  async getBackend(backendId: string): Promise<QuantumBackend | null> {
    return this.backends.get(backendId) || null;
  }

  async getOptimalBackend(requiredQubits: number): Promise<QuantumBackend | null> {
    const availableBackends = await this.getAvailableBackends();
    
    return availableBackends
      .filter(backend => backend.qubits >= requiredQubits)
      .sort((a, b) => {
        // Sort by queue length and error rates
        const scoreA = a.queueLength + a.errorRates.singleQubit * 1000;
        const scoreB = b.queueLength + b.errorRates.singleQubit * 1000;
        return scoreA - scoreB;
      })[0] || null;
  }

  // Quantum Algorithms
  async getAlgorithm(algorithmId: string): Promise<QuantumAlgorithm | null> {
    return this.algorithms.get(algorithmId) || null;
  }

  async getAlgorithmsByCategory(category: QuantumAlgorithm['category']): Promise<QuantumAlgorithm[]> {
    return Array.from(this.algorithms.values()).filter(algo => algo.category === category);
  }

  async executeAlgorithm(algorithmId: string, parameters: Record<string, any>): Promise<any> {
    const algorithm = await this.getAlgorithm(algorithmId);
    if (!algorithm) {
      throw new Error('Algorithm not found');
    }

    // Simulate algorithm execution
    const startTime = Date.now();
    
    // Create a simple quantum circuit for the algorithm
    const circuit = await this.createCircuit({
      name: `${algorithm.name} Execution`,
      description: `Executing ${algorithm.name} with parameters`,
      qubits: algorithm.requiredQubits,
      depth: 10,
      gates: [],
      measurements: []
    });

    // Simulate quantum execution
    const result = await this.simulateCircuit(circuit.id);
    
    const executionTime = Date.now() - startTime;
    
    return {
      algorithmId,
      parameters,
      result,
      executionTime,
      quantumAdvantage: algorithm.benchmarks.speedup,
      timestamp: new Date()
    };
  }

  // Utility Methods
  private initializeBackends(): void {
    if (this.backends.size > 0) return;

    const backends: Omit<QuantumBackend, 'id'>[] = [
      {
        name: 'IBM Quantum Simulator',
        provider: 'IBM',
        type: 'simulator',
        qubits: 32,
        connectivity: [],
        gateSet: ['H', 'X', 'Y', 'Z', 'CNOT', 'RX', 'RY', 'RZ'],
        errorRates: { singleQubit: 0.001, twoQubit: 0.01, readout: 0.02 },
        coherenceTimes: { t1: 100, t2: 50 },
        availability: 99.9,
        queueLength: 0,
        status: 'online'
      },
      {
        name: 'Google Sycamore',
        provider: 'Google',
        type: 'superconducting',
        qubits: 70,
        connectivity: [],
        gateSet: ['H', 'X', 'Y', 'Z', 'CNOT', 'RX', 'RY', 'RZ', 'CZ'],
        errorRates: { singleQubit: 0.002, twoQubit: 0.015, readout: 0.03 },
        coherenceTimes: { t1: 80, t2: 40 },
        availability: 85.0,
        queueLength: 15,
        status: 'online'
      },
      {
        name: 'IonQ Trapped Ion',
        provider: 'IonQ',
        type: 'trapped_ion',
        qubits: 32,
        connectivity: [],
        gateSet: ['H', 'X', 'Y', 'Z', 'CNOT', 'RX', 'RY', 'RZ'],
        errorRates: { singleQubit: 0.0005, twoQubit: 0.005, readout: 0.01 },
        coherenceTimes: { t1: 10000, t2: 1000 },
        availability: 90.0,
        queueLength: 8,
        status: 'online'
      }
    ];

    backends.forEach(backend => {
      const id = uuidv4();
      this.backends.set(id, { ...backend, id });
    });
  }

  private initializeAlgorithms(): void {
    if (this.algorithms.size > 0) return;

    const algorithms: Omit<QuantumAlgorithm, 'id'>[] = [
      {
        name: 'Quantum Approximate Optimization Algorithm (QAOA)',
        description: 'Variational quantum algorithm for combinatorial optimization',
        category: 'optimization',
        complexity: 'polynomial',
        quantumAdvantage: true,
        requiredQubits: 4,
        implementation: 'QAOA implementation with parameterized quantum circuits',
        parameters: { layers: 3, beta: [0.1, 0.2, 0.3], gamma: [0.5, 0.6, 0.7] },
        benchmarks: { classicalTime: 1000, quantumTime: 100, speedup: 10 }
      },
      {
        name: 'Variational Quantum Eigensolver (VQE)',
        description: 'Quantum algorithm for finding ground state energies',
        category: 'simulation',
        complexity: 'polynomial',
        quantumAdvantage: true,
        requiredQubits: 6,
        implementation: 'VQE with UCCSD ansatz for molecular simulation',
        parameters: { ansatz: 'UCCSD', optimizer: 'SPSA', maxIterations: 100 },
        benchmarks: { classicalTime: 5000, quantumTime: 500, speedup: 10 }
      },
      {
        name: 'Quantum Neural Network (QNN)',
        description: 'Neural network with quantum layers for machine learning',
        category: 'machine_learning',
        complexity: 'polynomial',
        quantumAdvantage: true,
        requiredQubits: 8,
        implementation: 'Hybrid quantum-classical neural network',
        parameters: { layers: 4, entanglement: 'full', rotation: 'RY' },
        benchmarks: { classicalTime: 2000, quantumTime: 200, speedup: 10 }
      },
      {
        name: "Grover's Search Algorithm",
        description: 'Quantum search algorithm with quadratic speedup',
        category: 'search',
        complexity: 'quadratic',
        quantumAdvantage: true,
        requiredQubits: 10,
        implementation: "Grover's algorithm for unstructured search",
        parameters: { iterations: 'optimal', oracle: 'custom' },
        benchmarks: { classicalTime: 1000000, quantumTime: 1000, speedup: 1000 }
      }
    ];

    algorithms.forEach(algorithm => {
      const id = uuidv4();
      this.algorithms.set(id, { ...algorithm, id });
    });
  }

  private startQuantumSimulator(): void {
    // Simulate quantum backend status updates
    setInterval(() => {
      this.backends.forEach((backend, id) => {
        // Simulate queue changes
        backend.queueLength += Math.floor((Math.random() - 0.5) * 5);
        backend.queueLength = Math.max(0, backend.queueLength);
        
        // Simulate availability changes
        backend.availability += (Math.random() - 0.5) * 2;
        backend.availability = Math.max(70, Math.min(99.9, backend.availability));
        
        this.backends.set(id, backend);
      });
    }, 30000); // Update every 30 seconds
  }

  private saveToStorage(): void {
    try {
      const data = {
        circuits: Array.from(this.circuits.entries()),
        models: Array.from(this.models.entries()),
        jobs: Array.from(this.jobs.entries()),
        backends: Array.from(this.backends.entries()),
        algorithms: Array.from(this.algorithms.entries()),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save quantum data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.circuits = new Map(parsed.circuits || []);
        this.models = new Map(parsed.models || []);
        this.jobs = new Map(parsed.jobs || []);
        this.backends = new Map(parsed.backends || []);
        this.algorithms = new Map(parsed.algorithms || []);

        // Convert date strings back to Date objects
        this.circuits.forEach(circuit => {
          circuit.createdAt = new Date(circuit.createdAt);
          circuit.updatedAt = new Date(circuit.updatedAt);
        });

        this.models.forEach(model => {
          model.createdAt = new Date(model.createdAt);
          model.updatedAt = new Date(model.updatedAt);
        });

        this.jobs.forEach(job => {
          job.createdAt = new Date(job.createdAt);
          if (job.completedAt) {
            job.completedAt = new Date(job.completedAt);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load quantum data:', error);
    }
  }

  // Public utility methods
  clearAllData(): void {
    this.circuits.clear();
    this.models.clear();
    this.jobs.clear();
    this.backends.clear();
    this.algorithms.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeBackends();
    this.initializeAlgorithms();
  }

  getCircuitCount(): number {
    return this.circuits.size;
  }

  getModelCount(): number {
    return this.models.size;
  }

  getActiveJobCount(): number {
    return Array.from(this.jobs.values()).filter(
      job => job.status === 'running' || job.status === 'queued'
    ).length;
  }

  async getQuantumMetrics(): Promise<{
    totalCircuits: number;
    totalModels: number;
    activeJobs: number;
    availableBackends: number;
    averageQuantumAdvantage: number;
  }> {
    const models = Array.from(this.models.values());
    const availableBackends = await this.getAvailableBackends();
    
    const averageQuantumAdvantage = models.length > 0 
      ? models.reduce((sum, model) => sum + model.performance.quantumAdvantage, 0) / models.length
      : 0;

    return {
      totalCircuits: this.circuits.size,
      totalModels: this.models.size,
      activeJobs: this.getActiveJobCount(),
      availableBackends: availableBackends.length,
      averageQuantumAdvantage
    };
  }
}

// Singleton instance
export const quantumAIService = new QuantumAIService();
