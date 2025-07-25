'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Filter, BookOpen, Video, Users, FileText, Eye, Clock } from 'lucide-react'
import Link from 'next/link'

interface Resource {
  id: string
  title: string
  description: string
  type: 'ARTICLE' | 'VIDEO' | 'WORKSHOP' | 'GUIDE' | 'TEMPLATE'
  category: string
  author: string
  viewCount: number
  thumbnailUrl?: string
  videoUrl?: string
  createdAt: string
  tags: { name: string }[]
  _count: { userProgress: number }
}

const resourceIcons = {
  ARTICLE: BookOpen,
  VIDEO: Video,
  WORKSHOP: Users,
  GUIDE: FileText,
  TEMPLATE: FileText
}

const resourceColors = {
  ARTICLE: 'bg-blue-100 text-blue-600',
  VIDEO: 'bg-red-100 text-red-600',
  WORKSHOP: 'bg-green-100 text-green-600',
  GUIDE: 'bg-purple-100 text-purple-600',
  TEMPLATE: 'bg-yellow-100 text-yellow-600'
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { user } = useAuth()

  useEffect(() => {
    fetchResources()
  }, [searchTerm, selectedType, selectedCategory, currentPage])

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedType !== 'ALL') params.append('type', selectedType)
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resources?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setResources(data.resources)
        setCategories(data.categories)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchResources()
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Educational Resources</h1>
          <p className="text-sm text-gray-500">
            Learn conflict resolution techniques and best practices
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="ARTICLE">Articles</option>
                  <option value="VIDEO">Videos</option>
                  <option value="WORKSHOP">Workshops</option>
                  <option value="GUIDE">Guides</option>
                  <option value="TEMPLATE">Templates</option>
                </select>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Resources Grid */}
        {resources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or check back later for new content.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => {
              const Icon = resourceIcons[resource.type]
              return (
                <Link key={resource.id} href={`/resources/${resource.id}`}>
                  <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                    {resource.thumbnailUrl && (
                      <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                        <img
                          src={resource.thumbnailUrl}
                          alt={resource.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resourceColors[resource.type]}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {resource.type}
                        </div>
                        <span className="text-xs text-gray-500">{resource.category}</span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                        {resource.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {resource.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>By {resource.author}</span>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {resource.viewCount}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {resource.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {resource.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.name}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{resource.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'text-white bg-primary-600'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}