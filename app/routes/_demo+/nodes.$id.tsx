import { useState } from "react"
import { LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'

import { API_URL } from '#app/components/nodes.ts'
import { Button } from "#app/components/ui/button.tsx";
import {
  Sheet,
  SheetContent, SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#app/components/ui/sheet.tsx'
import { Label } from "#app/components/ui/label.tsx"
import {toast} from "sonner";
import {Input} from "#app/components/ui/input.tsx";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const res = await fetch(`${API_URL}/agent_status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error("F in chat")
  const body = await res.json() as unknown as any
  const nodes = body.data as any[]
  const node = nodes.find(n => n.id === params.id)
  if (!node) throw new Error("F in chat")
  return json({ node })
}

export default function Node() {
  const navigate = useNavigate()
  const { node } = useLoaderData<typeof loader>()

  return (
    <Sheet
      open
      onOpenChange={value => {
        if (!value) navigate(-1)
      }}
    >
      <SheetContent>
        <SheetHeader className="mt-4">
          <SheetTitle>{node?.data.label}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {/*<div className="space-y-4">*/}
          {/*  <Title>Inputs</Title>*/}
          {/*</div>*/}
          {/*<div className="space-y-4">*/}
          {/*  <Title>Outputs</Title>*/}
          {/*</div>*/}
          {node.id === "5" ? <Search node={node} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return <div className="uppercase text-xs font-semibold">{children}</div>
}

function Search({ node }: { node: any }) {
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState("Yes")
  const [loading, setLoading] = useState(false)

  return (
    <div>
      <div>
        <Label className="block mb-2">I tried to access internal documentation; unfortunately, I don’t have access to
          the password for those files. Can you please provide the password for accessing information in the Eric
          Schmidt folder?</Label>
        <Input type="password" value={feedback} onChange={evt => setFeedback(evt.currentTarget.value)}/>
      </div>
      <SheetFooter>
        <Button
          disabled={loading}
          className="mt-4"
          onClick={async () => {
            try {
              setLoading(true)
              const payload = {agent: node.data.label, feedback}
              const res = await fetch(`${API_URL}/resolve_feedback`, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
              })
              if (!res.ok) throw new Error("F in chat")
              const body = await res.json()
              console.log(body)
              toast.success("Continuing agent work...")
              navigate(-1)
            } catch (err) {
              console.error("Failed to ", err)
            } finally {
              setLoading(false)
            }
          }}
        >
          Proceed
        </Button>
      </SheetFooter>
    </div>
  )
}
