import {
  type LoaderFunctionArgs,
  type MetaFunction,
  json,
} from '@remix-run/node'
import {Outlet, useLoaderData, useNavigate} from '@remix-run/react'
import {useCallback, useEffect, useState} from 'react'
import ReactFlow, {
  Background,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {ExclamationTriangleIcon, PlayCircleIcon} from "@heroicons/react/24/solid";

import {API_URL, getWorkflow, initialEdges, initialNodes} from '#app/components/nodes.ts'
import { Badge } from '#app/components/ui/badge.tsx'

import { cn } from '#app/utils/misc.tsx'
import {Button} from "#app/components/ui/button.tsx";
import {
  Dialog, DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '#app/components/ui/dialog.tsx'
import {Textarea} from "#app/components/ui/textarea.tsx";
import {toast} from "sonner";

const nodeTypes = {
  agent: AgentNode,
  'agent-input': AgentInput,
  'agent-output': AgentOutput,
}

export const meta: MetaFunction = () => [{ title: 'Reagent' }]

export async function loader({ request }: LoaderFunctionArgs) {
  const workflow = await getWorkflow("2")
  return json({ workflow })
}

export default function Nodes() {
  const navigate = useNavigate()
  const { workflow } = useLoaderData<typeof loader>()
  const [running, setRunning] = useState(false)

  const [nodes, setNodes] = useState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: any) => setEdges(eds => addEdge(params, eds)),
    [setEdges],
  )

  async function poll() {
    try {
      const res = await fetch(`${API_URL}/agent_status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("F in chat")
      const body = await res.json() as unknown as any
      const elapsedTime = body.elapsed_time as number
      toast.info("Refreshing agent workflow status")
      if (elapsedTime) setRunning(true)
      const nodes = body.data as any[]
      // console.log({ body, nodes })
      setNodes(nodes as any)
    } catch (err) {
      console.error("Error occurred", err)
      toast.error("Failed to refresh workflow status.")
    }
  }

  useEffect(() => {
    poll()
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [running])

  return (
    <main className="mt-6 container h-[calc(100vh-32px)]">
      <div className="flex sm:justify-between">
        <div>
          <div className="text-lg tracking-normal">
            <span className="font-semibold">Workflow</span>&nbsp;:&nbsp;{workflow?.name}
          </div>
          <div className=" text-sm text-muted-foreground">{workflow?.description}</div>
        </div>
        <RunWorkflow running={running} setRunning={setRunning} />
      </div>
      <Alert/>
      <div className="h-3/4 py-6 grid">
        <div className="space-y-2">
          <div className="border-2 h-full">
            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={nodes}
              edges={edges}
              // onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(evt, node) => {
                navigate(`/${workflow?.to}/${node.id}`)
              }}
            >
              {/*<MiniMap />*/}
              {/*<Controls />*/}
              <Background/>
            </ReactFlow>
          </div>
        </div>
        <Outlet/>
      </div>
    </main>
  )
}

function Alert() {
  return (
    <div className="mt-4 rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon
            className="h-5 w-5 text-yellow-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-yellow-800">
            Instructions
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            <p>Select a node to view more details about each task execution.</p>
          </div>
        </div>
      </div>
    </div>
  )
}


function getStatusColor(status: string) {
  switch (status) {
    case 'idle':
      return 'zinc' as const
    case 'running':
      return 'yellow' as const
    case 'success':
      return 'green' as const
    case 'failed':
      return 'red' as const
    default:
      console.error("Unknown")
  }
}

function AgentNode({data}: any) {
  return (
    <AgentBody data={data}>
      <Handle type="target" position={Position.Top} className="w-16" />
      <Handle type="source" position={Position.Bottom} className="w-16" />
    </AgentBody>
  )
}

function AgentInput({ data }: any) {
  return (
    <AgentBody data={data}>
      <Handle type="source" position={Position.Bottom} className="w-16" />
    </AgentBody>
  )
}

function AgentOutput({ data }: any) {
  return (
    <AgentBody data={data}>
      <Handle type="target" position={Position.Top} className="w-16" />
    </AgentBody>
  )
}

function AgentBody({
  data,
  children,
}: {
  data: any
  children: React.ReactNode
}) {
  const { label, status, timeElapsed } = data
  return (
    <div
      className={cn(
        'react-flow__node-default',
        `border-${getStatusColor(status)}-600`,
      )}
    >
      <div className="text-center">{label}</div>
      <div className="flex justify-center mt-2">
        <Badge color={getStatusColor(status)}>{status}</Badge>
      </div>
      {timeElapsed ? <div className="text-xs text-muted-foreground mt-1">Duration: {timeElapsed.toFixed(1)}s</div> : null}

      {children}
    </div>
  )
}

const DEFAULT_PROMPT = "Scrape the first sentence on this link https://github.com/langchain-ai/langgraph/tree/main and then search the web to find an important lead developer."

function RunWorkflow({ running, setRunning }: { running: boolean; setRunning: (val: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)

  return (
    <div className="flex gap-4 items-center">
      <div className="text-right">
        <div className="text-xs uppercase font-semibold">Status</div>
        <div className="text-sm text-muted-foreground font-semibold">
          {running ? <div className="text-green-600">Running</div> : starting ?
            <div className="text-yellow-600">Starting...</div> : <div>Pending</div>}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="flex gap-1">
            <span>Run Workflow</span>
            <PlayCircleIcon className="h-4 w-4"/>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What would you like to research today?</DialogTitle>
          </DialogHeader>
          <Textarea value={prompt} onChange={evt => setPrompt(evt.currentTarget.value)}/>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="secondary" disabled={starting}>Close</Button>
            </DialogClose>
            <Button
              className="flex gap-1"
              disabled={starting}
              onClick={async () => {
                try {
                  setStarting(true)
                  const res = await fetch(`${API_URL}/run_agent_stream`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt }),
                  })
                  if (!res.ok) throw new Error("F in chat")
                  await res.json()
                  toast.success("Agent workflow started!")
                  setRunning(true)
                  setOpen(false)
                } catch (err) {
                  console.error("Error", err)
                } finally {
                  setStarting(false)
                }
              }}
            >
              <span>{starting ? "Starting..." : "Start Workflow"}</span>
              {!starting && <PlayCircleIcon className="h-4 w-4"/>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
