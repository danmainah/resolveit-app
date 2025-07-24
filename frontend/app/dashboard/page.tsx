'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from 'react-query'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  AlertCircle,
  Users,
  Calendar
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { format } from 'date-fns'

interface Case {
  id: string
  caseType: string
  status: string
  issueDescription: string
  createdAt: string
  oppositePartyDetails: {
    name: string
  }
  panel?: {
    members: Array<{
      user: {
        name: string
        role: string
      }
    }>
  }
  _count: {
    documents: number
    caseUpdates: number
  }
}

interface DashboardStats {
  totalCases: number
  pendingCases: number
  inProgressCases: number
  resolvedCases: number
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: cases, isLoading: casesLoading } = useQuery<Case[]>(
    'user-cases',
    async () => {
      const response = await api.get('/cases/my-cases?limit=5')
      return response.data.cases
    }
  )

  const { data: notifications, isLoading: notificationsLoading } = useQuery(
    'user-notifications',
    async () => {
      const response = await api.get('/users/notifications?limit=5')
      return response.data.notifications
    }
  )

  const stats: DashboardStats = {
    totalCases: cases?.length || 0,
    pendingCases: cases?.filter(c => c.status === 'PENDING').length || 0,
    inProgressCases: cases?.filter(c => ['AWAITING_RESPONSE', 'ACCEPTED', 'PANEL_CREATED', 'MEDIATION_IN_PROGRESS'].includes(c.status)).length || 0,
    resolvedCases: cases?.filter(c => c.status === 'RESOLVED').length || 0,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending'
      case 'AWAITING_RESPONSE':
      case 'ACCEPTED':
      case 'PANEL_CREATED':
      case 'MEDIATION_IN_PROGRESS':
        return 'status-in-progress'
      case 'RESOLVED':
        return 'status-resolved'
      case 'UNRESOLVED':
        return 'status-unresolved'
      default:
        return 'status-pending'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review'
      case 'AWAITING_RESPONSE':
        return 'Awaiting Response'
      case 'ACCEPTED':
        return 'Accepted'
      case 'PANEL_CREATED':
        return 'Panel Created'
      case 'MEDIATION_IN_PROGRESS':
        return 'In Mediation'
      case 'RESOLVED':
        return 'Resolved'
      case 'UNRESOLVED':
        return 'Unresolved'
      default:
        return status
    }
  }

  if (!user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verification Pending</h2>
          <p className="text-gray-600 mb-6">
            Your account is currently under review. You'll be able to register cases once verified by an administrator.
          </p>
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-warning-800">
              <strong>What's next?</strong><br />
              Our team will review your account within 24-48 hours. You'll receive a notification once approved.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your cases and recent activity.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Cases
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalCases}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.pendingCases}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.inProgressCases}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resolved
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.resolvedCases}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/cases/register"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Register New Case</h3>
                <p className="text-sm text-gray-500">Start a new dispute resolution</p>
              </div>
            </Link>

            <Link
              href="/cases"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">View All Cases</h3>
                <p className="text-sm text-gray-500">Manage your cases</p>
              </div>
            </Link>

            <Link
              href="/notifications"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <AlertCircle className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Check updates</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cases */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Cases</h2>
              <Link href="/cases" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            
            {casesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : cases && cases.length > 0 ? (
              <div className="space-y-4">
                {cases.slice(0, 5).map((case_) => (
                  <div key={case_.id} className="border-l-4 border-primary-500 pl-4">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/cases/${case_.id}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {case_.caseType} Case
                      </Link>
                      <span className={getStatusColor(case_.status)}>
                        {getStatusText(case_.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      vs. {case_.oppositePartyDetails.name}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(case_.createdAt), 'MMM dd, yyyy')}
                      <span className="mx-2">•</span>
                      {case_._count.documents} documents
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No cases yet</p>
                <Link href="/cases/register" className="text-primary-600 hover:text-primary-500 text-sm">
                  Register your first case
                </Link>
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Notifications</h2>
              <Link href="/notifications" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            
            {notificationsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification: any) => (
                  <div key={notification.id} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${notification.isRead ? 'bg-gray-300' : 'bg-primary-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notifications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}