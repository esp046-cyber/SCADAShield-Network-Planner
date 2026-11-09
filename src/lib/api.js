// src/lib/api.js

// Falls back to localhost in dev, or your production API URL if defined
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-domain.com/api'

export async function saveProjectToBackend(projectData) {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Failed to save project to backend API:', error)
    throw error
  }
}

export async function fetchProjectFromBackend(projectId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch project from API:', error)
    throw error
  }
}
