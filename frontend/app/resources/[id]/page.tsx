'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { BookOpen, Video, Users, FileText, Eye, Clock, User, CheckCircle, Play } from 'lucide-react'
import Link from 'next/link'

interface Resource {
  id: string
  title: string
  description: string
  content: string
  type: 'ARTICLE' | 'VIDEO' | 'WORKSHOP' | 'GUIDE' | 'TEMPLATE'
  category: string
  author: string
  viewCount: number
  thumbnailUrl?: string
  videoUrl?: string
  createdAt: string
  tags: { name: string }[]
}

const resourceIcons = {
  ARTICLE: BookOpen,
  VIDEO: Video,
  WORKSHOP: Users,
  GUIDE: FileText,
  TEMPLATE: FileText
}

export default function ResourceDetailPage() {
  const params = useParams()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (params.id) {
      fetchResource()
    }
  }, [params.id])

  const fetchResource = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resources/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setResource(data)
      }
    } catch (error) {
      console.error('Error fetching resource:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (newProgress: number, isCompleted: boolean = false) => {
    if (!user) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resources/${params.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          progress: newProgress,
          completed: isCompleted
        })
      })

      setProgress(newProgress)
      setCompleted(isCompleted)
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const markAsCompleted = () => {
    updateProgress(100, true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!resource) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Resource not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The resource you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/resources"
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
          >
            Back to Resources
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const Icon = resourceIcons[resource.type]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                  {resource.type}
                </span>
                <span className="ml-2 text-sm text-gray-500">{resource.category}</span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                {!completed && (
                  <button
                    onClick={markAsCompleted}
                    className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </button>
                )}
                {completed && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{resource.title}</h1>
          <p className="text-gray-600 mb-4">{resource.description}</p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {resource.author}
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {resource.viewCount} views
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(resource.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {resource.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          {/* Video Player */}
          {resource.type === 'VIDEO' && resource.videoUrl && (
            <div className="aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-75" />
                  <p className="text-lg">Video Player</p>
                  <p className="text-sm opacity-75">
                    Video URL: {resource.videoUrl}
                  </p>
                  <p className="text-xs mt-2 opacity-50">
                    (Integrate with video player library like Video.js or Plyr)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thumbnail for non-video content */}
          {resource.type !== 'VIDEO' && resource.thumbnailUrl && (
            <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
              <img
                src={resource.thumbnailUrl}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content Body */}
          <div className="p-6">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: resource.content }}
            />
          </div>
        </div>

        {/* Progress Bar for logged-in users */}
        {user && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">Your Progress</h3>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {completed && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                ✓ You have completed this resource
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Link
            href="/resources"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            ← Back to Resources
          </Link>
          
          {resource.type === 'WORKSHOP' && (
            <Link
              href="/workshops"
              className="flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
            >
              View All Workshops →
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}