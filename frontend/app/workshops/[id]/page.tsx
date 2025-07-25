'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar, Clock, Users, MapPin, CheckCircle, UserPlus, ExternalLink, ArrowLeft } from 'lucide-react'

interface Workshop {
  id: string
  title: string
  description: string
  instructor: string
  maxParticipants: number
  scheduledAt: string
  duration: number
  meetingUrl?: string
  isActive: boolean
  registrations: {
    id: string
    userId: string
    registeredAt: string
    attended: boolean
    user: { id: string; name: string; email: string }
  }[]
  _count: { registrations: number }
}

export default function WorkshopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [workshop, setWorkshop] = useState<Workshop | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (params.id) {
      fetchWorkshop()
    }
  }, [params.id])

  const fetchWorkshop = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/${params.id}`, {
        headers: user ? {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        } : {}
      })
      
      if (response.ok) {
        const data = await response.json()
        setWorkshop(data)
      } else if (response.status === 404) {
        router.push('/workshops')
      }
    } catch (error) {
      console.error('Error fetching workshop:', error)
    } finally {
      setLoading(false)
    }
  }

  const registerForWorkshop = async () => {
    if (!user || !workshop) return

    setRegistering(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/${workshop.id}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await fetchWorkshop()
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Error registering for workshop:', error)
    } finally {
      setRegistering(false)
    }
  }

  const isRegistered = () => {
    if (!user || !workshop) return false
    return workshop.registrations.some(reg => reg.userId === user.id)
  }

  const getUserRegistration = () => {
    if (!user || !workshop) return null
    return workshop.registrations.find(reg => reg.userId === user.id)
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

  const isUpcoming = () => {
    if (!workshop) return false
    return new Date(workshop.scheduledAt) > new Date()
  }

  const isHappening = () => {
    if (!workshop) return false
    const now = new Date()
    const start = new Date(workshop.scheduledAt)
    const end = new Date(start.getTime() + workshop.duration * 60000)
    return now >= start && now <= end
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

  if (!workshop) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Workshop not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The workshop you're looking for doesn't exist or has been cancelled.
          </p>
          <button
            onClick={() => router.push('/workshops')}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workshops
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const userRegistration = getUserRegistration()

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/workshops')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workshops
          </button>
          
          {isHappening() && workshop.meetingUrl && isRegistered() && (
            <a
              href={workshop.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 animate-pulse"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Join Live Workshop
            </a>
          )}
        </div>

        {/* Workshop Info */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{workshop.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{workshop.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-primary-600" />
                    <div>
                      <div className="font-medium">{formatDate(workshop.scheduledAt)}</div>
                      <div className="text-sm text-gray-500">{formatTime(workshop.scheduledAt)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-3 text-primary-600" />
                    <div>
                      <div className="font-medium">{workshop.duration} minutes</div>
                      <div className="text-sm text-gray-500">Duration</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-3 text-primary-600" />
                    <div>
                      <div className="font-medium">Instructor: {workshop.instructor}</div>
                      <div className="text-sm text-gray-500">Workshop Leader</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-primary-600" />
                    <div>
                      <div className="font-medium">
                        {workshop.meetingUrl ? 'Online Workshop' : 'Location TBD'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workshop.meetingUrl ? 'Virtual Meeting' : 'Check back for updates'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Registration Status */}
            <div className="ml-8 text-center">
              <div className="bg-gray-50 rounded-lg p-6 min-w-[200px]">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {workshop._count.registrations}/{workshop.maxParticipants}
                </div>
                <div className="text-sm text-gray-500 mb-4">Participants</div>
                
                {user ? (
                  <>
                    {isRegistered() ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center text-green-600">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">You're Registered!</span>
                        </div>
                        
                        {userRegistration && (
                          <div className="text-xs text-gray-500">
                            Registered {new Date(userRegistration.registeredAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        {isUpcoming() && workshop.meetingUrl && (
                          <a
                            href={workshop.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Meeting Link
                          </a>
                        )}
                        
                        {userRegistration?.attended && (
                          <div className="text-xs text-green-600 font-medium">
                            ✓ Attended
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={registerForWorkshop}
                        disabled={registering || workshop._count.registrations >= workshop.maxParticipants || !isUpcoming()}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {registering ? (
                          'Registering...'
                        ) : workshop._count.registrations >= workshop.maxParticipants ? (
                          'Workshop Full'
                        ) : !isUpcoming() ? (
                          'Registration Closed'
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Register Now
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Please log in to register
                    </p>
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                    >
                      Log In
                    </button>
                  </div>
                )}
                
                <div className="mt-4 text-xs text-gray-500">
                  {workshop.maxParticipants - workshop._count.registrations} spots remaining
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              workshop.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {workshop.isActive ? 'Active' : 'Cancelled'}
            </div>
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isHappening() 
                ? 'bg-red-100 text-red-800' 
                : isUpcoming()
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isHappening() ? 'Live Now' : isUpcoming() ? 'Upcoming' : 'Completed'}
            </div>
            
            {workshop._count.registrations >= workshop.maxParticipants && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Full
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Expect</h2>
          <div className="prose max-w-none text-gray-600">
            <p>
              This workshop will provide hands-on experience with conflict resolution techniques. 
              You'll learn practical skills that can be applied in various situations, from workplace 
              disputes to family conflicts.
            </p>
            <ul className="mt-4 space-y-2">
              <li>• Interactive discussions and case studies</li>
              <li>• Practical exercises and role-playing scenarios</li>
              <li>• Q&A session with the instructor</li>
              <li>• Resource materials and follow-up recommendations</li>
            </ul>
            
            {workshop.meetingUrl && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Online Workshop Details</h3>
                <p className="text-blue-800 text-sm">
                  This is a virtual workshop conducted online. The meeting link will be available 
                  to registered participants. Please ensure you have a stable internet connection 
                  and a quiet environment for the best experience.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Registered Participants (if user is registered) */}
        {isRegistered() && workshop.registrations.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Other Participants ({workshop.registrations.length - 1})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workshop.registrations
                .filter(reg => reg.userId !== user?.id)
                .slice(0, 6)
                .map((registration) => (
                <div key={registration.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {registration.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{registration.user.name}</p>
                    <p className="text-xs text-gray-500">
                      Registered {new Date(registration.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {workshop.registrations.length > 7 && (
              <p className="text-sm text-gray-500 mt-4">
                And {workshop.registrations.length - 7} more participants...
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}