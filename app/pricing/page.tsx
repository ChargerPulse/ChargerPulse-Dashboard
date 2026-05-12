'use client'

import { useState } from 'react'

const plans = [
  {
    name: 'Pro',
    price: 5,
    chargers: 1,
    checkoutUrl: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/44db6a87-af91-43ff-96db-613d1db2f061',
    features: ['Monitor 1 charger', 'Real-time alerts', 'Basic analytics', 'Email support']
  },
  {
    name: 'Plus',
    price: 15,
    chargers: 5,
    checkoutUrl: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/b0df42fc-f1a6-4fc8-b7d3-ed43878790ec',
    features: ['Monitor up to 5 chargers', 'Real-time alerts', 'Advanced analytics', 'Priority support']
  },
  {
    name: 'Enterprise',
    price: 50,
    chargers: 'Unlimited',
    checkoutUrl: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/1a1cc852-4a6c-4b99-9d14-caaeba115d17',
    features: ['Unlimited chargers', 'Real-time alerts', 'Custom analytics', 'Dedicated support']
  }
]

export default function PricingPage() {
  const handleCheckout = (checkoutUrl: string) => {
    window.location.href = checkoutUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">⚡ ChargerPulse Pricing</h1>
          <p className="text-xl text-gray-600">Simple, transparent pricing for EV charger monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <div className="text-4xl font-bold mb-2">${plan.price}<span className="text-lg">/mo</span></div>
                <p className="text-blue-100">Monitor {plan.chargers} charger{typeof plan.chargers === 'number' && plan.chargers !== 1 ? 's' : ''}</p>
              </div>

              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.checkoutUrl)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">All plans include 7-day free trial. Cancel anytime.</p>
        </div>
      </div>
    </div>
  )
}