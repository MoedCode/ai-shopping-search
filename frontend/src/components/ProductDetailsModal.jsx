//ai-shopping-search/frontend/src/components/ProductDetailsModal.jsx
'use client'
import { XMarkIcon, ArrowTopRightOnSquareIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export default function ProductDetailsModal({ isOpen, onClose, product }) {
  if (!isOpen || !product) return null;

  // Determine the correct image and link
  const imageUrl = product.image || product.image_url || "https://placehold.co/600x600?text=No+Image";
  const productUrl = product.url || product.product_url;
  const hasLink = productUrl && (productUrl.startsWith('http') || productUrl.startsWith('https'));

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-gray-100 rounded-full z-10 transition-colors"
        >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
        </button>

        {/* Left: Large Image */}
        <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center min-h-[300px]">
            <img 
                src={imageUrl} 
                alt={product.name} 
                className="max-h-[400px] w-full object-contain mix-blend-multiply" 
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x600?text=No+Image"; }}
            />
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-1/2 p-8 flex flex-col">
            {/* Brand */}
            {product.brand && (
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
                    {product.brand}
                </span>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
            </h2>

            {/* Rating (Optional) */}
            <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    i < Math.round(product.rating || 0) 
                    ? <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                    : <StarIcon key={i} className="w-5 h-5 text-gray-300" />
                ))}
                <span className="text-sm text-gray-500 ml-2">
                    ({product.rating || 0}/5)
                </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6 flex-1 text-sm leading-relaxed overflow-y-auto max-h-[200px] custom-scrollbar">
                {product.description || "No description available for this product."}
            </p>

            <hr className="border-gray-100 mb-6" />

            {/* Footer: Price & Action */}
            <div className="mt-auto">
                <div className="flex items-end gap-2 mb-6">
                    <span className="text-3xl font-bold text-gray-900">
                        ${product.price}
                    </span>
                    {product.price_range && (
                        <span className="text-sm text-gray-500 mb-1">
                            {product.price_range}
                        </span>
                    )}
                </div>

                {/* External Link Button */}
                <a 
                    href={hasLink ? productUrl : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`
                        flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-semibold transition-all shadow-sm
                        ${hasLink 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                    `}
                    onClick={(e) => !hasLink && e.preventDefault()}
                >
                    <span>{hasLink ? "Visit Store" : "Link Unavailable"}</span>
                    {hasLink && <ArrowTopRightOnSquareIcon className="w-5 h-5" />}
                </a>
                
                {!hasLink && (
                    <p className="text-center text-xs text-red-400 mt-2">
                        Product link is missing from the source.
                    </p>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}