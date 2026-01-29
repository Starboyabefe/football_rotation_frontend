'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface BackgroundSlideshowProps {
  images: string[]
  interval?: number // milliseconds between slides
}

export default function BackgroundSlideshow({ 
  images, 
  interval = 5000 
}: BackgroundSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (images.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [images.length, interval])

  if (images.length === 0) {
    return <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 -z-10" />
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10" />
      
      {/* Slideshow images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image}
              alt={`Player ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              onLoad={() => index === 0 && setIsLoaded(true)}
              quality={85}
            />
          </div>
        ))}
      </div>

      {/* Optional: Animated blur effect */}
      <div className="absolute inset-0 backdrop-blur-[2px] z-5" />
    </div>
  )
}