'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EditSampleEntity } from './edit-sample-entity'

export function SampleEntityList() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const { data: entities, isLoading, refetch } = trpc.sample.getAll.useQuery()

  const deleteMutation = trpc.sample.delete.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entity?')) {
      try {
        await deleteMutation.mutateAsync({ id })
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading entities...</div>
  }

  if (!entities || entities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No entities found. Create your first entity!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entities.map((entity) => (
        <Card key={entity.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{entity.title}</CardTitle>
                <CardDescription>
                  Created by {entity.user.name} on{' '}
                  {new Date(entity.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(entity.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(entity.id)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          {entity.description && (
            <CardContent>
              <p className="text-gray-600">{entity.description}</p>
            </CardContent>
          )}
        </Card>
      ))}

      {editingId && (
        <EditSampleEntity
          id={editingId}
          onClose={() => setEditingId(null)}
          onSuccess={() => {
            setEditingId(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
