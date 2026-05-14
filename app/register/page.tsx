'use client'

import { useState } from 'react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    chargerId: '',
    nickname: '',
    location: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (!formData.chargerId || !formData.nickname) {
      setStatus('error')
      setMessage('Charger ID and Name are required.')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(`Charger "${formData.nickname}" registered successfully!`)
        setFormData({ chargerId: '', nickname: '', location: '' })
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Failed to connect to server.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">➕ Register Charger</h1>
            <p className="text-gray-600">Add a new EV charger to your monitoring fleet</p>
          </div>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
            Back to Dashboard
          </a>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <h2 className="font-bold text-blue-800 mb-2">📡 OCPP Connection Details</h2>
          <div className="bg-white rounded p-3 font-mono text-sm text-blue-900 border border-blue-200">
            wss://chargerpulse-1.onrender.com/YOUR_CHARGER_ID
          </div>
          <p className="text-blue-600 text-xs mt-2">
            Replace YOUR_CHARGER_ID with the Charger ID you register below. Protocol: OCPP 1.6
          </p>
        </div>

        {status === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-5 py-4 rounded-lg mb-6">
            <strong>✅ Charger Registered!</strong>
            <p className="text-sm mt-1">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-lg mb-6">
            <strong>Error:</strong> {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Charger ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.chargerId}
              onChange={e => setFormData({ ...formData, chargerId: e.target.value.trim() })}
              placeholder="e.g. CP-001 or DepotCharger1"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">Must match exactly what your charger uses to connect. No spaces.</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Charger Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={e => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="e.g. Depot Bay 1"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Johannesburg Depot, Gate 2"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={status === 'loading'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 px-6 rounded-lg text-lg"
          >
            {status === 'loading' ? '⏳ Registering...' : '➕ Register Charger'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 How to Connect Your Charger</h2>
          <div className="space-y-3">
            {[
              ['1', 'Register your charger above with a unique ID'],
              ['2', 'Log into your charger admin panel'],
              ['3', 'Find the OCPP Central System URL setting'],
              ['4', 'Enter: wss://chargerpulse-1.onrender.com/YOUR_CHARGER_ID'],
              ['5', 'Set OCPP version to 1.6'],
              ['6', 'Save and restart your charger'],
              ['7', 'Your charger will appear on the dashboard within 60 seconds'],
            ].map(([num, text]) => (
              <div key={num} className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {num}
                </span>
                <p className="text-gray-700 pt-0.5">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}