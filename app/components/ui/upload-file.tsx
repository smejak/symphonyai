import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Button } from '#app/components/ui/button'

import { cn } from '#app/utils/misc.tsx'

export function UploadFile({
  onUpload,
  className,
}: {
  onUpload: (file: File) => void
  className?: string
}) {
  const fileTypes = ['.jpeg', '.jpg', '.png', '.gif']
  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    accept: {
      'image/*': fileTypes,
    },
    onDrop: async ([file]) => {
      if (!file) {
        return toast.error('Only select 1 file to upload.')
      }
      onUpload(file)
    },
  })

  return (
    <div
      className={cn(
        'mx-auto max-w-lg justify-center rounded-lg border border-dashed border-zinc-700 text-center p-4',
        className,
      )}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <Button className="mt-2" size="sm">
          Upload File
        </Button>
        <div className="text-muted-foreground mt-6 text-xs space-y-2">
          <div>
            <div>Accepted file types:</div>
            <div>{fileTypes.join(', ')}</div>
          </div>
          <div>Max file size: 3MB</div>
        </div>
      </div>
    </div>
  )
}
