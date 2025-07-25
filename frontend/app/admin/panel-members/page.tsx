'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Shield, Search, Plus, MoreVertical, UserMinus, FileText, Calendar, Mail, Phone } from 'lucide-react'

interface PanelMember {
  id: string
  name: string
  email: string
  phone?: string
  specialization?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  _count?: {
    assignedCases: number
    resolvedCases: number
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminPanelMembersPage() {
  const [panelMembers, setPanelMembers] = useState<PanelMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActions, setShowActions] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    fetchPanelMembers()
    fetchAvailableUsers()
  }, [])

  const fetchPanelMembers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/panel-members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPanelMembers(data.members || [])
      } else {
        setPanelMembers([])
      }
    } catch (error) {
      console.error('Error fetching panel members:', error)
      setPanelMembers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?role=USER`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(Array.isArray(data) ? data : data.users || [])
      } else {
        setAvailableUsers([])
      }
    } catch (error) {
      console.error('Error fetching available users:', error)
      setAvailableUsers([])
    }
  }

  const addPanelMembers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/panel-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userIds: selectedUsers })
      })
      
      if (response.ok) {
        await fetchPanelMembers()
        await fetchAvailableUsers()
        setShowAddModal(false)
        setSelectedUsers([])
      }
    } catch (error) {
      console.error('Error adding panel members:', error)
    }
  }

  const removePanelMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this panel member?')) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/panel-members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        setPanelMembers(prev => prev.filter(m => m.id !== memberId))
        await fetchAvailableUsers()
      }
    } catch (error) {
      console.error('Error removing panel member:', error)
    }
  }

  const updateMemberStatus = async (memberId: string, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/panel-members/${memberId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setPanelMembers(prev => 
          prev.map(m => 
            m.id === memberId ? { ...m, status: newStatus as any } : m
          )
        )
      }
    } catch (error) {
      console.error('Error updating member status:', error)
    }
  }

  const filteredMembers = panelMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.specialization && member.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-2xl font-bold text-gray-900">Panel Members</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Panel Members
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search panel members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Panel Members Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowActions(showActions === member.id ? null : member.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {showActions === member.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          onClick={() => updateMemberStatus(member.id, member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => removePanelMember(member.id)}
                          className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Remove from Panel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {member.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </div>
              </div>

              {member.specialization && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Specialization</p>
                  <p className="text-sm text-gray-600">{member.specialization}</p>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{member._count?.assignedCases || 0}</div>
                  <div className="text-gray-500">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{member._count?.resolvedCases || 0}</div>
                  <div className="text-gray-500">Resolved</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No panel members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Add some users as panel members to get started.'}
            </p>
          </div>
        )}

        {/* Add Panel Members Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Add Panel Members</h3>
              </div>
              
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No available users to add</p>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, user.id])
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id))
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedUsers([])
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={addPanelMembers}
                  disabled={selectedUsers.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  Add Selected ({selectedUsers.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}