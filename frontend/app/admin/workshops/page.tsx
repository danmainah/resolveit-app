'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Plus, Search, Calendar } from 'lucide-react'

interface Workshop {
  id: string
  title: string
  description: string
  instructor: string
  maxParticipants: number
  scheduledAt: string
  duration: number
  isActive: boolean
  _count: { registrations: number }
}

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const fetchWorkshops = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops?upcoming=false&limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWorkshops(data.workshops || [])
      } else {
        setWorkshops([])
      }
    } catch (error) {
      console.error('Error fetching workshops:', error)
      setWorkshops([])
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Manage Workshops</h1>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Workshop
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search workshops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Workshops List */}
        <div className="bg-white shadow rounded-lg">
          {filteredWorkshops.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workshops found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by scheduling a new workshop.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredWorkshops.map((workshop) => (
                <div key={workshop.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{workshop.title}</h3>
                      <p className="text-sm text-gray-500">Instructor: {workshop.instructor}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(workshop.scheduledAt).toLocaleDateString()} • {workshop.duration} minutes
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        workshop.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {workshop.isActive ? 'Active' : 'Cancelled'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {workshop._count.registrations}/{workshop.maxParticipants} registered
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}