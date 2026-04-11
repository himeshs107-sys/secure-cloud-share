import React, { useState, useEffect, useCallback } from 'react'
import { MdRefresh, MdDelete, MdEdit, MdClose, MdCheck } from 'react-icons/md'
import Header from '../components/Header'
import { formatSize } from '../utils/fileUtils'
import api from '../utils/api'
import './Users.css'

export default function Users() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [deleteId, setDeleteId]   = useState(null)
  const [deleting, setDeleting]   = useState(false)
  const [editUser, setEditUser]   = useState(null)
  const [editRole, setEditRole]   = useState('')
  const [editPlan, setEditPlan]   = useState('')
  const [saving, setSaving]       = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { search: search || undefined, limit: 100 } })
      setUsers(res.data.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(prev => prev.filter(u => u._id !== id))
      setDeleteId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const openEdit = (u) => {
    setEditUser(u)
    setEditRole(u.role)
    setEditPlan(u.plan)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const res = await api.put(`/admin/users/${editUser._id}`, { role: editRole, plan: editPlan })
      setUsers(prev => prev.map(u => u._id === editUser._id ? res.data.user : u))
      setEditUser(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content users-page">
      <Header
        title="User Management"
        subtitle={`${users.length} registered account${users.length !== 1 ? 's' : ''}`}
        onSearch={setSearch}
        searchPlaceholder="Search users..."
        actions={<button className="btn btn-ghost" onClick={fetchUsers}><MdRefresh size={15} /></button>}
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 52, background: 'var(--bg-hover)', borderRadius: 8, marginBottom: 10, opacity: 0.5 }} />
            ))}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th><th>Email</th><th>Role</th><th>Plan</th>
                <th>Storage Used</th><th>Joined</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="user-table-avatar"
                        style={{
                          background: u.role === 'admin'
                            ? 'linear-gradient(135deg,var(--accent-cyan),var(--accent-purple))'
                            : 'linear-gradient(135deg,var(--accent-green),#00b4cc)',
                        }}>
                        {u.avatar || u.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-cyan' : 'badge-green'}`} style={{ textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.plan}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 80, height: 5 }}>
                        <div className="progress-fill"
                          style={{ width: `${Math.min(100, ((u.storageUsed || 0) / (u.storageTotal || 1)) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                        {formatSize(u.storageUsed || 0)}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${u.isActive !== false ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title="Edit" onClick={() => openEdit(u)}><MdEdit size={15} /></button>
                      <button className="btn-icon" title="Delete" style={{ color: 'var(--accent-red)' }} onClick={() => setDeleteId(u._id)}><MdDelete size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && (
          <div className="empty-state" style={{ padding: '60px 40px' }}>
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No users found</div>
            <div className="empty-state-desc">No users match your search</div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><MdEdit size={16} style={{marginRight:6,verticalAlign:'middle'}} />Edit User</div>
              <button className="modal-close" onClick={() => setEditUser(null)}><MdClose size={16} /></button>
            </div>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20 }}>{editUser.name} — {editUser.email}</p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Role</label>
              <select className="form-input" value={editRole} onChange={e => setEditRole(e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Plan</label>
              <select className="form-input" value={editPlan} onChange={e => setEditPlan(e.target.value)}>
                <option value="Free">Free</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving…' : <><MdCheck size={15} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><MdDelete size={16} style={{marginRight:6,verticalAlign:'middle'}} />Delete User</div>
              <button className="modal-close" onClick={() => setDeleteId(null)}><MdClose size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Are you sure you want to permanently delete this user? All their data will be lost.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
