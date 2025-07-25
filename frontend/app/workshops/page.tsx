'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar, Clock, Users, MapPin, CheckCircle, UserPlus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Workshop {
  id: string
  title: string
  description: string
  instructor: string
  maxParticipants: number
  scheduledAt: string
  duration: number
  meetingUrl?: string
  _count: { registrations: number }
}

interface Registration {
  id: string
  workshopId: string
  registeredAt: string
  attended: boolean
  workshop: Workshop
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered'>('upcoming')
  const { user } = useAuth()

  useEffect(() => {
    fetchWorkshops()
    if (user) {
      fetchRegistrations()
    }
  }, [user])

  const fetchWorkshops = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops?upcoming=true`)
      
      if (response.ok) {
        const data = await response.json()
        setWorkshops(data.workshops)
      }
    } catch (error) {
      console.error('Error fetching workshops:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/user/registrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRegistrations(data)
      }
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }
  }

  const registerForWorkshop = async (workshopId: string) => {
    if (!user) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/${workshopId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await fetchWorkshops()
        await fetchRegistrations()
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Error registering for workshop:', error)
    }
  }

  const isRegistered = (workshopId: string) => {
    return registrations.some(reg => reg.workshopId === workshopId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Workshops</h1>
          <p className="text-sm text-gray-500">
            Join live workshops to enhance your conflict resolution skills
          </p>
        </div>

        {/* Tabs */}
        {user && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming Workshops
              </button>
              <button
                onClick={() => setActiveTab('registered')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'registered'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Registrations ({registrations.length})
              </button>
            </nav>
          </div>
        )}

        {/* Upcoming Workshops */}
        {(!user || activeTab === 'upcoming') && (
          <div className="space-y-6">
            {workshops.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming workshops</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for new workshop announcements.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {workshops.map((workshop) => (
                  <div key={workshop.id} className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <Link href={`/workshops/${workshop.id}`} className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 hover:text-primary-600 cursor-pointer">
                          {workshop.title}
                        </h3>
                      </Link>
                      <div className="flex items-center text-sm text-gray-500 ml-4">
                        <Users className="w-4 h-4 mr-1" />
                        {workshop._count.registrations}/{workshop.maxParticipants}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{workshop.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(workshop.scheduledAt)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(workshop.scheduledAt)} ({workshop.duration} minutes)
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Instructor: {workshop.instructor}
                      </div>
                      {workshop.meetingUrl && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          Online Workshop
                        </div>
                      )}
                    </div>

                    {user && (
                      <div className="flex justify-between items-center">
                        {isRegistered(workshop.id) ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Registered</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => registerForWorkshop(workshop.id)}
                            disabled={workshop._count.registrations >= workshop.maxParticipants}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {workshop._count.registrations >= workshop.maxParticipants ? 'Full' : 'Register'}
                          </button>
                        )}
                        
                        <Link
                          href={`/workshops/${workshop.id}`}
                          className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View Details
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    )}

                    {!user && (
                      <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                          Please log in to register for workshops
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Registrations */}
        {user && activeTab === 'registered' && (
          <div className="space-y-6">
            {registrations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No workshop registrations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Register for upcoming workshops to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((registration) => (
                  <div key={registration.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {registration.workshop.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{registration.workshop.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(registration.workshop.scheduledAt)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {formatTime(registration.workshop.scheduledAt)}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            {registration.workshop.instructor}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          registration.attended 
                            ? 'bg-green-100 text-green-800' 
                            : new Date(registration.workshop.scheduledAt) > new Date()
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {registration.attended 
                            ? 'Attended' 
                            : new Date(registration.workshop.scheduledAt) > new Date()
                            ? 'Upcoming'
                            : 'Missed'
                          }
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Registered {new Date(registration.registeredAt).toLocaleDateString()}
                        </p>
                        
                        {registration.workshop.meetingUrl && 
                         new Date(registration.workshop.scheduledAt) > new Date() && (
                          <a
                            href={registration.workshop.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                          >
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}