import {ExclamationTriangleIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import { ColumnDef } from '@tanstack/react-table'

import { Button } from '#app/components/ui/button.tsx'
import { Checkbox } from '#app/components/ui/checkbox.tsx'
import { DataTable } from '#app/components/ui/data-table.tsx'
import { Workflow, workflows } from "#app/components/nodes.ts";

export default function Index() {
  return (
    <div className="container mt-4 space-y-8">
      <Alert />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="font-bold text-lg">Agent Workflows</div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" disabled>
              <TrashIcon className="h-4 w-4" />
            </Button>
            <Link to="/add">
              <Button size="sm" className="flex space-x-1">
                <PlusIcon className="h-4 w-4 stroke-2" />
                <span>Add Workflow</span>
              </Button>
            </Link>
          </div>
        </div>
        <DataTable columns={columns} data={workflows} loading={false} />
      </div>
    </div>
  )
}

function Alert() {
  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon
            className="h-5 w-5 text-yellow-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-yellow-800">
            Getting Started
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>Select a multi-agent workflow to get started.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const columns: ColumnDef<Workflow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center px-2">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center px-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
  },
  {
    id: 'description',
    header: 'Description',
    accessorKey: "description",
    cell: ({ row }) => {
      const id = row.getValue('description') as string
      return (
        <div className="text-muted-foreground">{id}</div>
      )
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    accessorKey: "to",
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <Link to={`/${row.original.to}`}>
            <Button size="sm">View</Button>
          </Link>
        </div>
      )
    },
  },
]
