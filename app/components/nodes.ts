import { MarkerType, Node } from 'reactflow'

export interface Workflow {
  id: string
  to: string
  name: string
  description: string
  executions: number
  lastRun: Date
}

export const workflows: Workflow[] = [
  {
    id: '1',
    to: "simple",
    name: 'Simple Text Message',
    description: "Test example.",
    executions: 5,
    lastRun: new Date(),
  },
  {
    id: '2',
    to: "nodes",
    name: 'Research Paper',
    description: "Generate a research report on a topic with additional websites as context.",
    executions: 5,
    lastRun: new Date(),
  },
]

export const initialNodes: Node[] = [
  {
    id: '1',
    type: 'agent-input',
    position: { x: 300, y: 0 },
    data: {
      label: 'User',
      status: 'pending',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
  {
    id: '2',
    type: 'agent',
    position: { x: 300, y: 150 },
    data: {
      label: 'Supervisor Agent',
      status: 'pending',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
  {
    id: '3',
    type: 'agent',
    position: { x: 100, y: 300 },
    data: {
      label: 'Research Team Agent',
      status: 'running',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
  {
    id: '4',
    type: 'agent',
    position: { x: 525, y: 300 },
    data: {
      label: 'Document Authoring Agent',
      status: 'pending',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
  {
    id: '5',
    type: 'agent-output',
    position: { x: 0, y: 450 },
    data: {
      label: 'Searcher Agent',
      status: 'success',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
  {
    id: '6',
    type: 'agent-output',
    position: { x: 175, y: 450 },
    data: {
      label: 'Web Scraper Agent',
      status: 'running',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
  {
    id: '7',
    type: 'agent-output',
    position: { x: 350, y: 450 },
    data: {
      label: 'Writer Agent',
      status: 'pending',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
  {
    id: '8',
    type: 'agent-output',
    position: { x: 525, y: 450 },
    data: {
      label: 'Note Taker Agent',
      status: 'failed',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
  {
    id: '9',
    type: 'agent-output',
    position: { x: 700, y: 450 },
    data: {
      label: 'Chart Generator Agent',
      status: 'pending',
      timeElapsed: 500,
      timeEstimated: 3000,
    },
  },
]

export const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e3-6',
    source: '3',
    target: '6',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e4-7',
    source: '4',
    target: '7',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e4-8',
    source: '4',
    target: '8',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e4-9',
    source: '4',
    target: '9',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
]

export async function getNode(id: string) {
  return initialNodes.find(node => node.id === id)
}

export async function getWorkflow(id: string) {
  return workflows.find(w => w.id === id)
}

export const API_URL = "https://da6f-4-39-199-2.ngrok-free.app"
