// ai-shopping-search/frontend/src/components/Footer.jsx
import React from 'react'

function IconGitHub(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12.02c0 5.07 3.29 9.37 7.86 10.88.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.45.11-3.02 0 0 .98-.31 3.2 1.19a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.5 3.2-1.19 3.2-1.19.63 1.57.23 2.73.12 3.02.76.81 1.2 1.84 1.2 3.1 0 4.44-2.7 5.42-5.27 5.71.42.36.8 1.09.8 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12.02 11.5 11.5 0 0 0 12 .5z"/>
    </svg>
  )
}

function IconLinkedIn(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.6v1.71h.05c.5-.95 1.72-1.95 3.54-1.95C20.6 8.76 21 11 21 14.2V21h-4v-6.03c0-1.44-.03-3.29-2-3.29-2 0-2.31 1.57-2.31 3.17V21H9z"/>
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="w-full max-w-md mx-auto mt-6 mb-4 text-center text-xs text-gray-400 flex items-center justify-center gap-3 px-4">
      <span>&copy; {new Date().getFullYear()} ElA-shba7</span>
      <span aria-hidden="true">·</span>
      <nav aria-label="Footer links" className="flex gap-3 items-center">
        <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
          <IconGitHub /> <span className="hidden sm:inline">GitHub</span>
        </a>
        <a href="https://www.linkedin.com/in/mohamed-mahmoud-4874b41b0/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
          <IconLinkedIn /> <span className="hidden sm:inline">LinkedIn</span>
        </a>
      </nav>
    </footer>
  )
}